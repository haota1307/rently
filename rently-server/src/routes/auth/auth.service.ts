import {
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { addMilliseconds } from 'date-fns';
import { RegisterBodyDTO } from 'src/routes/auth/auth.dto';
import { AuthRepository } from 'src/routes/auth/auth.repo';
import { RolesService } from 'src/routes/auth/roles.service';
import envConfig from 'src/shared/config';
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant';
import { generateOTP, isUniqueConstraintPrismaError } from 'src/shared/helpers';
import { HashingService } from 'src/shared/services/hashing.service';
import ms from 'ms';
import {
  LoginBodyType,
  RefreshTokenBodyType,
  SendOTPBodyType,
} from 'src/routes/auth/auth.model';
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo';
import { EmailService } from 'src/shared/services/email.service';
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type';
import { TokenService } from 'src/shared/services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly rolesService: RolesService,
    private readonly hashingService: HashingService,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
  ) {}

  async register(body: RegisterBodyDTO) {
    try {
      const VerificationCode =
        await this.authRepository.findUniqueVerificationCode({
          email: body.email,
          code: body.code,
          type: TypeOfVerificationCode.REGISTER,
        });

      if (!VerificationCode) {
        throw new UnprocessableEntityException([
          {
            message: 'Mã OTP không hợp lệ',
            path: 'code',
          },
        ]);
      }

      if (VerificationCode.expiresAt < new Date()) {
        throw new UnprocessableEntityException([
          {
            message: 'Mã OTP đã hết hạn',
            path: 'code',
          },
        ]);
      }

      const clientRoleId = await this.rolesService.getClientRoleId();
      const hashedPassword = await this.hashingService.hash(body.password);

      return await this.authRepository.createUser({
        email: body.email,
        name: body.name,
        password: hashedPassword,
        roleId: clientRoleId,
      });
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Email đã tồn tại');
      }

      throw error;
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    // 1. Kiểm tra email đã tồn tại trong database chưa
    const user = await this.sharedUserRepository.findUnique({
      email: body.email,
    });

    if (user) {
      throw new UnprocessableEntityException([
        {
          message: 'Email đã tồn tại',
          path: 'email',
        },
      ]);
    }

    // 2. Tạo mã OTP
    const code = generateOTP();
    this.authRepository.createVerificationCode({
      email: body.email,
      code,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN)),
    });

    // 3. Gửi mã OTP
    const { error } = await this.emailService.sendOTP({
      email: body.email,
      code,
    });
    if (error) {
      throw new UnprocessableEntityException([
        {
          message: 'Gửi mã OTP thất bại',
          path: 'code',
        },
      ]);
    }
    return { message: 'Gửi mã OTP thành công' };
  }

  async generateTokens({ userId, roleId, roleName }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        roleId,
        roleName,
      }),

      this.tokenService.signRefreshToken({
        userId,
      }),
    ]);

    const decodedRefreshToken =
      await this.tokenService.verifyRefreshToken(refreshToken);

    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    });

    return { accessToken, refreshToken };
  }

  async login(body: LoginBodyType) {
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    });

    if (!user) {
      throw new UnprocessableEntityException([
        {
          message: 'Email không tồn tại',
          path: 'email',
        },
      ]);
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
      roleId: user.roleId,
      roleName: user.role.name,
    });
    return tokens;
  }

  async refreshToken({ refreshToken }: RefreshTokenBodyType) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      const { userId } =
        await this.tokenService.verifyRefreshToken(refreshToken);

      // 2. Kiểm tra refreshToken có tồn tại trong database không
      const refreshTokenInDb =
        await this.authRepository.findUniqueRefeshTokenIncludeUserRole({
          token: refreshToken,
        });

      if (!refreshTokenInDb) {
        throw new UnauthorizedException(
          'Refresh token đã được sử dụng hoặc không tồn tại',
        );
      }

      const {
        user: { roleId, name: roleName },
      } = refreshTokenInDb;

      // 3. Xóa refreshToken cũ
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      });

      // 4. Tạo mới accessToken và refreshToken
      const $token = this.generateTokens({
        userId,
        roleId,
        roleName,
      });

      const [, token] = await Promise.all([$deleteRefreshToken, $token]);

      return token;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }
}
