import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from 'src/routes/auth/auth.service';

import {
  RegisterBodyDTO,
  RegisterResDTO,
  SendOTPBodyDTO,
} from 'src/routes/auth/auth.dto';
import { ZodSerializerDto } from 'nestjs-zod';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ZodSerializerDto(RegisterResDTO)
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body);
  }

  @Post('otp')
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return await this.authService.sendOTP(body);
  }

  // @Post('login')
  // async login(@Body() body: LoginBodyDTO) {
  //   return new LoginResDTO(await this.authService.login(body));
  // }

  // @Post('refresh-token')
  // @HttpCode(HttpStatus.OK)
  // async refreshToken(@Body() body: RefreshTokenBodyDTO) {
  //   return new RefreshTokenResDTO(
  //     await this.authService.refreshToken(body.refreshToken),
  //   );
  // }

  // @Post('logout')
  // @Auth([AuthType.Bearer], { condition: ConditionGuard.And })
  // async logout(@Body() body: LogoutBodyDTO) {
  //   return new LogoutResDTO(await this.authService.logout(body.refreshToken));
  // }

  // @Put('change-password')
  // @Auth([AuthType.Bearer], { condition: ConditionGuard.And })
  // async changePassword(
  //   @ActiveUser('userId') userId: number,
  //   @Body() body: ChangePasswordDTO,
  // ) {
  //   return this.authService.changePassword(
  //     userId,
  //     body.currentPassword,
  //     body.newPassword,
  //   );
  // }

  // @Put('verify-otp')
  // async verifyOtp(@Body() body: VerifyOtpDTO) {
  //   return this.authService.verifyOtp(body);
  // }

  // @Post('resend-otp')
  // async resendOtp(@Body() body: ResendOtpDTO) {
  //   return this.authService.resendOtp(body);
  // }
}
