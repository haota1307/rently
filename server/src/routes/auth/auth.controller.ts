import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';

import { AuthService } from 'src/routes/auth/auth.service';
import {
  ChangePasswordDTO,
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  LogoutResDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
} from 'src/routes/auth/auth.dto';
import { Auth } from 'src/shared/decorators/auth.decorator';
import { AuthType, ConditionGuard } from 'src/shared/constants/auth.constant';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterBodyDTO) {
    return new RegisterResDTO(await this.authService.register(body));
  }

  @Post('login')
  async login(@Body() body: LoginBodyDTO) {
    return new LoginResDTO(await this.authService.login(body));
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: RefreshTokenBodyDTO) {
    return new RefreshTokenResDTO(
      await this.authService.refreshToken(body.refreshToken),
    );
  }

  @Post('logout')
  @Auth([AuthType.Bearer], { condition: ConditionGuard.And })
  async logout(@Body() body: LogoutBodyDTO) {
    return new LogoutResDTO(await this.authService.logout(body.refreshToken));
  }

  @Put('change-password')
  @Auth([AuthType.Bearer], { condition: ConditionGuard.And })
  async changePassword(
    @ActiveUser('userId') userId: number,
    @Body() body: ChangePasswordDTO,
  ) {
    return this.authService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword,
    );
  }
}
