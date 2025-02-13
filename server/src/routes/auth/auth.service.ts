import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  LoginBodyDTO,
  RegisterBodyDTO,
  ResendOtpDTO,
  VerifyOtpDTO,
} from 'src/routes/auth/auth.dto';

import {
  isNotFoundPrismaError,
  isUniqueConstraintPrismaError,
} from 'src/shared/helpers';
import { HashingService } from 'src/shared/services/hashing.service';
import { MailService } from 'src/shared/services/mail.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { TokenService } from 'src/shared/services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  async generateTokens(payload: { userId: number; role: Role }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(payload),
      this.tokenService.signRefreshToken(payload),
    ]);

    const decodedRefreshToken =
      await this.tokenService.verifyRefreshToken(refreshToken);

    await this.prismaService.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.userId,
        createdAt: new Date(),
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
      },
    });
    return { accessToken, refreshToken };
  }

  async register(body: RegisterBodyDTO) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Email đã được sử dụng. Vui lòng dùng email khác.',
      );
    }
    const hashedPassword = await this.hashingService.hash(body.password);

    const user = await this.prismaService.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
      },
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Hết hạn sau 10 phút

    await this.prismaService.userVerification.create({
      data: { otpCode, expiresAt, userId: user.id },
    });

    // Gửi email với HTML tích hợp sẵn
    await this.mailService.sendVerificationEmail(
      user.email,
      user.name,
      otpCode,
    );

    return user;
  }

  async login(body: LoginBodyDTO) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    const isPasswordMatch = await this.hashingService.compare(
      body.password,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new UnprocessableEntityException([
        {
          field: 'password',
          error: 'Mật khẩu không đúng',
        },
      ]);
    }

    const tokens = await this.generateTokens({
      userId: user.id,
      role: user.role,
    });

    return tokens;
  }

  async refreshToken(refreshToken: string) {
    try {
      //1. Kiểm tra có hợp lệ hay không
      const { userId, role } =
        await this.tokenService.verifyRefreshToken(refreshToken);

      // Kiểm tra có tồn tại hay không
      await this.prismaService.refreshToken.findUniqueOrThrow({
        where: {
          token: refreshToken,
        },
      });

      // Xóa rf cũ
      await this.prismaService.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      });

      return await this.generateTokens({ userId, role });
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('refresh token has been revoked');
      }

      throw new UnauthorizedException();
    }
  }

  async logout(refreshToken: string) {
    try {
      //1. Kiểm tra có hợp lệ hay không
      await this.tokenService.verifyRefreshToken(refreshToken);

      // Kiểm tra có tồn tại hay không
      await this.prismaService.refreshToken.findUniqueOrThrow({
        where: {
          token: refreshToken,
        },
      });

      // Xóa rf cũ
      await this.prismaService.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      });

      return { message: 'Logout successfully' };
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('refresh token has been revoked');
      }

      throw new UnauthorizedException();
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const isPasswordMatch = await this.hashingService.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const hashedNewPassword = await this.hashingService.hash(newPassword);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async verifyOtp(body: VerifyOtpDTO) {
    const { email, otpCode } = body;

    const verification = await this.prismaService.userVerification.findUnique({
      where: {
        userId: (await this.prismaService.user.findUnique({ where: { email } }))
          ?.id,
      },
    });

    if (!verification) {
      throw new UnauthorizedException('Không tìm thấy mã xác thực.');
    }

    if (verification.verifiedAt) {
      throw new BadRequestException('Tài khoản đã được xác thực.');
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('Mã OTP đã hết hạn.');
    }

    if (verification.otpCode !== otpCode) {
      throw new BadRequestException('Mã OTP không chính xác.');
    }

    await this.prismaService.userVerification.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() },
    });

    await this.prismaService.user.update({
      where: { id: verification.userId },
      data: { isActive: true },
    });

    return { message: 'Xác thực tài khoản thành công!' };
  }

  async resendOtp(body: ResendOtpDTO) {
    const user = await this.prismaService.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại.');
    }

    const existingVerification =
      await this.prismaService.userVerification.findUnique({
        where: { userId: user.id },
      });

    if (existingVerification?.verifiedAt) {
      throw new BadRequestException('Tài khoản đã được xác thực.');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP mới hết hạn sau 10 phút

    if (existingVerification) {
      await this.prismaService.userVerification.update({
        where: { userId: user.id },
        data: { otpCode, expiresAt },
      });
    } else {
      await this.prismaService.userVerification.create({
        data: { userId: user.id, otpCode, expiresAt },
      });
    }

    await this.mailService.sendVerificationEmail(
      user.email,
      user.name,
      otpCode,
    );

    return { message: 'OTP mới đã được gửi thành công' };
  }
}
