import { Exclude } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

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

export class GetProfileByIdBodyDTO {
  @IsString()
  userId: number;
}

export class GetProfileByIdResDTO extends GetMyProfileResDTO {
  constructor(partial: Partial<GetProfileByIdResDTO>) {
    // Gọi constructor cha
    super(partial as Partial<GetMyProfileResDTO>);

    // Xoá balance sau khi gán
    delete (this as any).balance;
  }
}
