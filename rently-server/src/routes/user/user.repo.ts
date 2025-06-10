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
      // Kiểm tra xem roleId có phải là chuỗi chứa dấu phẩy không
      if (
        typeof pagination.roleId === 'string' &&
        pagination.roleId.includes(',')
      ) {
        const roleIds = pagination.roleId
          .split(',')
          .map(id => parseInt(id.trim()))
        whereClause.roleId = { in: roleIds }
      } else {
        whereClause.roleId =
          typeof pagination.roleId === 'string'
            ? parseInt(pagination.roleId)
            : pagination.roleId
      }
    }

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

    return {
      data,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  async search(params: {
    query: string
    limit?: number
    page?: number
    excludeUserId?: number
    status?: string
  }): Promise<GetUsersResType> {
    const {
      query,
      limit = 10,
      page = 1,
      excludeUserId,
      status = 'ACTIVE',
    } = params

    const skip = (page - 1) * limit
    const take = limit

    // Tạo điều kiện where cho search
    const whereClause: any = {
      deletedAt: null,
      status,
      OR: [
        {
          name: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          email: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    }

    // Loại trừ người dùng nếu excludeUserId được cung cấp
    if (excludeUserId) {
      whereClause.id = {
        not: excludeUserId,
      }
    }

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

    return {
      data,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
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
