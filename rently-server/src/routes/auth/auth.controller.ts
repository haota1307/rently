import { ZodSerializerDto } from 'nestjs-zod'
import { Response } from 'express'
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common'

import {
  ChangePasswordBodyDTO,
  ForgotPasswordBodyDTO,
  GetAuthorizationUrlDTO,
  LoginResDTO,
  LogoutBodyDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  SendOTPBodyDTO,
} from 'src/routes/auth/auth.dto'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { LoginBodyType } from 'src/routes/auth/auth.model'
import { GoogleService } from 'src/routes/auth/google.service'
import { AuthService } from 'src/routes/auth/auth.service'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import envConfig from 'src/shared/config'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { UserBlockedException } from 'src/routes/auth/auth.error'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService
  ) {}

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResDTO)
  register(@Body() body: RegisterBodyDTO) {
    return this.authService.register(body)
  }

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  sendOTP(@Body() body: SendOTPBodyDTO) {
    return this.authService.sendOTP(body)
  }

  @Post('login')
  @IsPublic()
  @ZodSerializerDto(LoginResDTO)
  login(@Body() body: LoginBodyType) {
    return this.authService.login(body)
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @ZodSerializerDto(RefreshTokenResDTO)
  async refreshToken(@Body() body: RefreshTokenBodyDTO) {
    return this.authService.refreshToken(body)
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDTO)
  logout(@Body() body: LogoutBodyDTO) {
    return this.authService.logout(body.refreshToken)
  }

  @Get('google-link')
  @IsPublic()
  @ZodSerializerDto(GetAuthorizationUrlDTO)
  getAuthorizationUrl() {
    return this.googleService.getAuthorizationUrl()
  }

  @Get('google/callback')
  @IsPublic()
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response
  ) {
    try {
      const data = await this.googleService.googleCallback({
        code,
        state,
      })

      return res.redirect(
        `${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?accessToken=${data?.accessToken}&refreshToken=${data?.refreshToken}`
      )
    } catch (error) {
      console.log('[DEBUG] Google callback error:', error)

      // Kiểm tra lỗi tài khoản bị khóa
      const isBlockedError =
        error === UserBlockedException ||
        (error instanceof Error && error.message === 'Error.UserBlocked')

      const message = isBlockedError
        ? 'Tài khoản của bạn đã bị khóa'
        : error instanceof Error
          ? error.message
          : 'Đã có lỗi xảy ra khi đăng nhập bằng google, vui lòng thử lại bằng cách khác'

      return res.redirect(
        `${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?error=${encodeURIComponent(message)}&blocked=${isBlockedError}`
      )
    }
  }

  @Post('forgot-password')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    return this.authService.forgotPassword(body)
  }

  @Put('change-password')
  @ZodSerializerDto(MessageResDTO)
  async changePassword(
    @Body() body: ChangePasswordBodyDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.authService.changePassword(userId, body)
  }
}
