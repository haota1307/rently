import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateRoomBillType,
  UpdateRoomBillType,
} from 'src/shared/models/shared-room-bill.model'
import { Prisma } from '@prisma/client'

@Injectable()
export class RoomBillRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRoomBillType & { createdById: number }) {
    return this.prisma.roomUtilityBill.create({
      data,
      include: {
        room: true,
      },
    })
  }

  async update(id: number, data: UpdateRoomBillType) {
    return this.prisma.roomUtilityBill.update({
      where: { id },
      data,
      include: {
        room: true,
      },
    })
  }

  async findById(id: number) {
    return this.prisma.roomUtilityBill.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            rental: true,
          },
        },
      },
    })
  }

  async list(params: {
    roomId?: number
    isPaid?: boolean
    billingMonth?: Date
    page: number
    limit: number
    landlordId?: number
  }) {
    const { page, limit, isPaid, billingMonth, roomId, landlordId } = params
    const skip = (page - 1) * limit

    const where: Prisma.RoomUtilityBillWhereInput = {}

    if (roomId) {
      where.roomId = roomId
    }

    if (isPaid !== undefined) {
      where.isPaid = isPaid
    }

    if (billingMonth) {
      const startOfMonth = new Date(billingMonth)
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const endOfMonth = new Date(billingMonth)
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      endOfMonth.setDate(0)
      endOfMonth.setHours(23, 59, 59, 999)

      where.billingMonth = {
        gte: startOfMonth,
        lte: endOfMonth,
      }
    }

    if (landlordId) {
      where.room = {
        rental: {
          landlordId,
        },
      }
    }

    const [data, totalItems] = await Promise.all([
      this.prisma.roomUtilityBill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          room: {
            include: {
              rental: true,
            },
          },
        },
      }),
      this.prisma.roomUtilityBill.count({ where }),
    ])

    return {
      data,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  async delete(id: number) {
    return this.prisma.roomUtilityBill.delete({
      where: { id },
    })
  }

  async markAsSent(id: number) {
    return this.prisma.roomUtilityBill.update({
      where: { id },
      data: { emailSent: true },
    })
  }

  async findActiveContractByRoomId(roomId: number) {
    const now = new Date()
    // Cho phép tạo hóa đơn cho hợp đồng sắp bắt đầu trong vòng 24 giờ
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    return this.prisma.rentalContract.findFirst({
      where: {
        roomId: roomId,
        startDate: { lte: tomorrow }, // Thay vì chỉ kiểm tra <= now
        endDate: { gte: now },
        status: 'ACTIVE',
      },
    })
  }

  async findUserById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })
  }

  async findRoomById(roomId: number) {
    return this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        rental: true,
      },
    })
  }

  async findRentedRoomsByLandlord(landlordId: number) {
    const now = new Date()

    return this.prisma.room.findMany({
      where: {
        rental: {
          landlordId: landlordId,
        },
        RentalContract: {
          some: {
            status: 'ACTIVE',
            startDate: { lte: now },
            endDate: { gte: now },
          },
        },
      },
      include: {
        rental: true,
        RentalContract: {
          where: {
            status: 'ACTIVE',
            startDate: { lte: now },
            endDate: { gte: now },
          },
          include: {
            User_RentalContract_tenantIdToUser: {
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
          take: 1,
        },
      },
    })
  }

  async findLatestBillByRoom(roomId: number) {
    return this.prisma.roomUtilityBill.findFirst({
      where: {
        roomId: roomId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}
