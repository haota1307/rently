import { ZodSerializerDto } from 'nestjs-zod';
import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from 'src/routes/auth/auth.service';
import { IsPublic } from 'src/shared/decorators/auth.decorator';
import {
  LoginResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  SendOTPBodyDTO,
} from 'src/routes/auth/auth.dto';
import { MessageResDTO } from 'src/shared/dtos/response.dto';
import { LoginBodyType } from 'src/routes/auth/auth.model';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResDTO)
  register(@Body() body: RegisterBodyDTO) {
    return this.authService.register(body);
  }

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  sendOTP(@Body() body: SendOTPBodyDTO) {
    return this.authService.sendOTP(body);
  }

  @Post('login')
  @IsPublic()
  @ZodSerializerDto(LoginResDTO)
  login(@Body() body: LoginBodyType) {
    return this.authService.login(body);
  }
}
