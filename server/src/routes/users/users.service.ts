import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserProfileBodyDTO } from 'src/routes/users/user.dto';
import { isNotFoundPrismaError } from 'src/shared/helpers';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaServices: PrismaService) {}

  async getProfileById(id: number) {
    try {
      return await this.prismaServices.user.findUniqueOrThrow({
        where: { id },
      });
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException(`Người dùng có id: ${id} không tồn tại`);
      }
      throw error;
    }
  }

  async updateUserProfile(userId: number, body: UpdateUserProfileBodyDTO) {
    try {
      return this.prismaServices.user.update({
        where: {
          id: userId,
        },
        data: {
          avatar: body.avatar,
          name: body.name,
          phoneNumber: body.phoneNumber,
        },
      });
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException(
          `Người dùng có id: ${userId} không tồn tại`,
        );
      }
      throw error;
    }
  }
}
