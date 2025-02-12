import { Injectable, NotFoundException } from '@nestjs/common';
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
}
