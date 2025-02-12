import { Exclude } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';
import { Match } from 'src/shared/decorators/custom-validator.decorator';

export class LoginBodyDTO {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là một chuỗi' })
  @Length(6, 20, { message: 'Mật khẩu phải từ 6 đến 20 ký tự' })
  password: string;
}

export class LoginResDTO {
  accessToken: string;
  refreshToken: string;

  constructor(partial: Partial<LoginResDTO>) {
    Object.assign(this, partial);
  }
}

export class RegisterBodyDTO extends LoginBodyDTO {
  @IsString({ message: 'Tên phải là một chuỗi' })
  name: string;

  @IsString({ message: 'Xác nhận mật khẩu phải là một chuỗi' })
  @Match('password', { message: 'Mật khẩu xác nhận không khớp' })
  confirmPassword: string;
}

export class RegisterResDTO {
  id: number;
  email: string;
  name: string;

  @Exclude()
  password: string;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RegisterResDTO>) {
    Object.assign(this, partial);
  }
}

export class RefreshTokenBodyDTO {
  @IsString({ message: 'Refresh token phải là một chuỗi' })
  refreshToken: string;
}

export class RefreshTokenResDTO extends LoginResDTO {}

export class LogoutBodyDTO extends RefreshTokenBodyDTO {}

export class LogoutResDTO {
  @IsString({ message: 'Message phải là một chuỗi' })
  message: string;

  constructor(partial: Partial<LogoutResDTO>) {
    Object.assign(this, partial);
  }
}
