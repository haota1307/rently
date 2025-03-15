import { Injectable } from '@nestjs/common'
import {
  GetUsersQueryType,
  GetUsersResType,
} from 'src/routes/users/users.model'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(pagination: GetUsersQueryType): Promise<GetUsersResType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit

    const where: any = { deletedAt: null }

    if (pagination.role) {
      where.roleId = Number(pagination.role)
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.user.count({ where }),
      this.prismaService.user.findMany({
        where,
        skip,
        take,
        include: { role: true },
      }),
    ])

    return {
      data,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  async findById(id: number): Promise<UserType | null> {
    return this.prismaService.user.findUnique({
      where: { id },
      include: { role: true },
    })
  }

  async updateUser(id: number, data: Partial<UserType>): Promise<UserType> {
    return this.prismaService.user.update({
      where: { id },
      data,
      include: { role: true },
    })
  }

  async deleteUser(id: number): Promise<UserType> {
    return this.prismaService.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
