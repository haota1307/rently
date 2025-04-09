import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateRoleUpgradeRequestBodyType,
  GetRoleUpgradeRequestParamsType,
  GetRoleUpgradeRequestsQueryType,
  UpdateRoleUpgradeRequestBodyType,
} from './role-upgrade-request.dto'

@Injectable()
export class RoleUpgradeRequestRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list(query: GetRoleUpgradeRequestsQueryType) {
    const { page = 1, limit = 10, status, userId } = query
    const skip = (page - 1) * Number(limit)

    const where = {
      ...(status && { status }),
      ...(userId && { userId }),
    }

    const [data, totalItems] = await Promise.all([
      this.prismaService.roleUpgradeRequest.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phoneNumber: true,
              status: true,
              balance: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.roleUpgradeRequest.count({ where }),
    ])

    return {
      data,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / Number(limit)),
    }
  }

  async findById(id: number) {
    return this.prismaService.roleUpgradeRequest.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phoneNumber: true,
            status: true,
            balance: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async create({
    data,
  }: {
    data: CreateRoleUpgradeRequestBodyType & { userId: number }
  }) {
    return this.prismaService.roleUpgradeRequest.create({
      data: {
        userId: data.userId,
        reason: data.reason,
        status: 'PENDING',
        frontImage: data.frontImage,
        backImage: data.backImage,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phoneNumber: true,
            status: true,
            balance: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async update({
    id,
    data,
    processedById,
  }: {
    id: number
    data: UpdateRoleUpgradeRequestBodyType
    processedById: number
  }) {
    return this.prismaService.roleUpgradeRequest.update({
      where: { id: Number(id) },
      data: {
        ...data,
        processedById,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phoneNumber: true,
            status: true,
            balance: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async findPendingRequestByUserId(userId: number) {
    return this.prismaService.roleUpgradeRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    })
  }

  async findLatestByUserId(userId: number) {
    return this.prismaService.roleUpgradeRequest.findFirst({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phoneNumber: true,
            status: true,
            balance: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async updateUserRole(userId: number, roleId: number) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { roleId },
    })
  }
}
