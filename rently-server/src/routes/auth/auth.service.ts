import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import { RegisterBodyDTO } from 'src/routes/auth/auth.dto'
import { AuthRepository } from 'src/routes/auth/auth.repo'

import envConfig from 'src/shared/config'
import {
  TypeOfVerificationCode,
  TypeOfVerificationCodeType,
} from 'src/shared/constants/auth.constant'
import {
  generateOTP,
  isNotFoundPrismaError,
  isUniqueConstraintPrismaError,
} from 'src/shared/helpers'
import { HashingService } from 'src/shared/services/hashing.service'
import ms from 'ms'
import {
  ChangePasswordBodyType,
  ForgotPasswordBodyType,
  LoginBodyType,
  RefreshTokenBodyType,
  SendOTPBodyType,
} from 'src/routes/auth/auth.model'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { EmailService } from 'src/shared/services/email.service'
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type'
import { TokenService } from 'src/shared/services/token.service'
import {
  EmailAlreadyExistsException,
  EmailNotFoundException,
  FailedToSendOTPException,
  InvalidOTPException,
  OTPExpiredException,
  RefreshTokenAlreadyUsedException,
  UnauthorizedAccessException,
  UserNotFoundException,
} from 'src/routes/auth/auth.error'
import { InvalidPasswordException } from 'src/shared/error'
import { SharedRoleRepository } from 'src/shared/repositories/shared-role.repo'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly sharedRolesService: SharedRoleRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly hashingService: HashingService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService
  ) {}

  async validateVerificationCode({
    email,
    code,
    type,
  }: {
    email: string
    code: string
    type: TypeOfVerificationCodeType
  }) {
    const VerificationCode =
      await this.authRepository.findUniqueVerificationCode({
        email,
        code,
        type,
      })

    if (!VerificationCode) {
      throw InvalidOTPException
    }

    if (VerificationCode.expiresAt < new Date()) {
      throw OTPExpiredException
    }

    return VerificationCode
  }

  async register(body: RegisterBodyDTO) {
    try {
      await this.validateVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeOfVerificationCode.REGISTER,
      })

      const clientRoleId = await this.sharedRolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)

      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          name: body.name,
          password: hashedPassword,
          roleId: clientRoleId,
        }),
        // Xoá mã OTP sau khi đã sử dụng
        this.authRepository.deleteVerificationCode({
          email: body.email,
          code: body.code,
          type: TypeOfVerificationCode.REGISTER,
        }),
      ])

      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailAlreadyExistsException
      }
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    // Kiểm tra email có tồn tại trong database hay không
    const user = await this.sharedUserRepository.findUnique({
      email: body.email,
    })

    if (body.type === TypeOfVerificationCode.REGISTER && user) {
      throw EmailAlreadyExistsException
    }

    if (body.type === TypeOfVerificationCode.FORGOT_PASSWORD && !user) {
      throw EmailNotFoundException
    }

    // Tạo mã OTP
    const code = generateOTP()
    this.authRepository.createVerificationCode({
      email: body.email,
      code,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN)),
    })

    // Gửi mã OTP qua email
    const { error } = await this.emailService.sendOTP({
      email: body.email,
      code,
    })
    if (error) {
      throw FailedToSendOTPException
    }
    return { message: 'Gửi mã OTP thành công' }
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
    ])

    const decodedRefreshToken =
      await this.tokenService.verifyRefreshToken(refreshToken)

    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    })

    return { accessToken, refreshToken }
  }

  async login(body: LoginBodyType) {
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    })

    if (!user) {
      throw EmailNotFoundException
    }

    const isPasswordMatch = await this.hashingService.compare(
      body.password,
      user.password
    )

    if (!isPasswordMatch) {
      throw InvalidPasswordException
    }

    const tokens = await this.generateTokens({
      userId: user.id,
      roleId: user.roleId,
      roleName: user.role.name,
    })
    return {
      tokens,
      user,
    }
  }

  async refreshToken({ refreshToken }: RefreshTokenBodyType) {
    try {
      // Kiểm tra tính hợp lệ của refresh token
      const { userId } =
        await this.tokenService.verifyRefreshToken(refreshToken)

      // Kiểm tra refresh token có tồn tại trong database không
      const refreshTokenInDb =
        await this.authRepository.findUniqueRefeshTokenIncludeUserRole({
          token: refreshToken,
        })

      if (!refreshTokenInDb) {
        throw RefreshTokenAlreadyUsedException
      }

      const {
        user: {
          roleId,
          role: { name: roleName },
        },
      } = refreshTokenInDb

      // Xóa refresh token cũ
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })

      // Tạo mới accessToken và refreshToken
      const $token = this.generateTokens({
        userId,
        roleId,
        roleName,
      })

      const [, token] = await Promise.all([$deleteRefreshToken, $token])

      return token
    } catch (error) {
      console.log({ error })
      if (error instanceof HttpException) {
        throw error
      }
      throw UnauthorizedAccessException
    }
  }

  async logout(refreshToken: string) {
    try {
      // Kiểm tra tính hợp lệ của refresh token
      await this.tokenService.verifyRefreshToken(refreshToken)

      // Xóa refresh token khỏi database
      await this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })

      return { message: 'Đăng xuất thành công' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw RefreshTokenAlreadyUsedException
      }
      throw UnauthorizedAccessException
    }
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    const { code, email, newPassword } = body

    const user = await this.sharedUserRepository.findUnique({
      email,
    })

    if (!user) {
      throw EmailNotFoundException
    }

    await this.validateVerificationCode({
      email,
      code,
      type: TypeOfVerificationCode.FORGOT_PASSWORD,
    })

    const hashedPassword = await this.hashingService.hash(newPassword)

    await Promise.all([
      this.sharedUserRepository.update(
        { id: user.id, deletedAt: null },
        { password: hashedPassword, updatedAt: new Date() }
      ),
      this.authRepository.deleteVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeOfVerificationCode.FORGOT_PASSWORD,
      }),
    ])

    return { message: 'Đổi mật khẩu thành công' }
  }

  async changePassword(userId: number, body: ChangePasswordBodyType) {
    const user = await this.sharedUserRepository.findUnique({
      id: userId,
      deletedAt: null,
    })

    if (!user) {
      throw UserNotFoundException
    }

    const isMatch = await this.hashingService.compare(
      body.oldPassword,
      user.password
    )

    if (!isMatch) {
      throw InvalidPasswordException
    }

    const hashedNewPassword = await this.hashingService.hash(body.newPassword)

    await this.sharedUserRepository.update(
      { id: userId, deletedAt: null },
      { password: hashedNewPassword, updatedAt: new Date() }
    )

    return { message: 'Đổi mật khẩu thành công' }
  }
}
