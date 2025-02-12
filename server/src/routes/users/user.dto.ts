import { Exclude } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class GetMyProfileResDTO {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  phoneNumber: String | null;

  @Exclude()
  password: string;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<GetMyProfileResDTO>) {
    Object.assign(this, partial);
  }
}
export class GetProfileByIdResDTO extends GetMyProfileResDTO {
  constructor(partial: Partial<GetProfileByIdResDTO>) {
    super(partial as Partial<GetMyProfileResDTO>);

    // Xoá balance sau khi gán
    delete (this as any).balance;
  }
}

export class UpdateUserProfileBodyDTO {
  @IsString({ message: 'Tên phải là một chuỗi' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Ảnh đại diện phải là một chuỗi' })
  avatar: string | null;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là một chuỗi' })
  phoneNumber: string | null;
}

export class UpdateUserProfileResDTO extends GetMyProfileResDTO {
  constructor(partial: Partial<GetProfileByIdResDTO>) {
    super(partial as Partial<GetMyProfileResDTO>);

    // Xoá balance sau khi gán
    delete (this as any).balance;
  }
}
