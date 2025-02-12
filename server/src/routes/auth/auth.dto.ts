import { Decimal } from '@prisma/client/runtime/library';
import { Exclude, Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginBodyDTO {
  @IsEmail()
  email: string;

  @IsString()
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

  @IsString()
  // @Match('password', { message: 'Mật khẩu không khớp' })
  confirmPassword: string;
}

export class UserDTO {
  id: number;
  email: string;
  name: string;

  @Exclude()
  password: string;

  @Transform(({ value }) =>
    Decimal.isDecimal(value) ? value.toNumber() : value,
  )
  balance: number;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserDTO>) {
    Object.assign(this, partial);
  }
}

export class RegisterResDTO {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;

  constructor(partial: Partial<RegisterResDTO>) {
    this.user = new UserDTO(partial.user as UserDTO);
    this.accessToken = partial.accessToken as string;
    this.refreshToken = partial.refreshToken as string;
  }
}
