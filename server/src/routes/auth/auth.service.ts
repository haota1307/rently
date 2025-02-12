import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { LoginBodyDTO, RegisterBodyDTO } from 'src/routes/auth/auth.dto';

import {
  isNotFoundPrismaError,
  isUniqueConstraintPrismaError,
} from 'src/shared/helpers';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { TokenService } from 'src/shared/services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
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
    try {
      const hashedPassword = await this.hashingService.hash(body.password);

      const user = await this.prismaService.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
        },
      });

      return user;
    } catch (error) {
      console.log({ error });
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Tài khoản đã tồn tại');
      }
      throw error;
    }
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
}
