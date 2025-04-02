import { Injectable } from '@nestjs/common'
import {
  CreateUserBodyType,
  GetUsersQueryType,
  GetUsersResType,
} from 'src/routes/user/user.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { UserType } from 'src/shared/models/shared-user.model'
import { Prisma } from '@prisma/client'

@Injectable()
export class UserRepo {
  constructor(private prismaService: PrismaService) {}

  async list(pagination: GetUsersQueryType): Promise<GetUsersResType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit

    console.log('Received query params:', pagination)

    // Tạo điều kiện where cho filter
    const whereClause: any = {
      deletedAt: null,
    }

    // Thêm điều kiện tìm kiếm theo tên
    if (pagination.name) {
      whereClause.name = {
        contains: pagination.name,
        mode: Prisma.QueryMode.insensitive,
      }
    }

    // Thêm điều kiện lọc theo trạng thái
    if (pagination.status) {
      whereClause.status = pagination.status
    }

    // Thêm điều kiện lọc theo roleId
    if (pagination.roleId) {
      whereClause.roleId = parseInt(pagination.roleId.toString())
    }

    console.log('Final where clause:', JSON.stringify(whereClause, null, 2))

    const [totalItems, data] = await Promise.all([
      this.prismaService.user.count({
        where: whereClause,
      }),
      this.prismaService.user.findMany({
        where: whereClause,
        skip,
        take,
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ])

    console.log(`Found ${data.length} users out of ${totalItems} total`)

    return {
      data,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  create({
    createdById,
    data,
  }: {
    createdById: number | null
    data: CreateUserBodyType
  }): Promise<UserType> {
    return this.prismaService.user.create({
      data: {
        ...data,
        createdById,
      },
    })
  }

  delete(
    {
      id,
      deletedById,
    }: {
      id: number
      deletedById: number
    },
    isHard?: boolean
  ): Promise<UserType> {
    return isHard
      ? this.prismaService.user.delete({
          where: {
            id,
          },
        })
      : this.prismaService.user.update({
          where: {
            id,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            deletedById,
          },
        })
  }
}
