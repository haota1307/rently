import { Injectable, InternalServerErrorException } from '@nestjs/common'

import { PrismaService } from 'src/shared/services/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'
import {
  CreateRoomBodyType,
  GetRoomsQueryType,
  GetRoomsResType,
  RoomType,
  UpdateRoomBodyType,
} from 'src/shared/models/shared-room.model'

@Injectable()
export class RoomRepo {
  constructor(private prismaService: PrismaService) {}

  // Helper: chuyển đổi các trường cần thiết (chỉ cần chuyển price từ Decimal sang number)
  private formatRoom = (room: any): RoomType => {
    return {
      ...room,
      price: (room.price as Decimal).toNumber(),
    } as RoomType
  }

  async list(query: GetRoomsQueryType): Promise<GetRoomsResType> {
    try {
      const skip = (query.page - 1) * query.limit
      const take = query.limit
      const where: any = {}

      if (query.title) {
        where.title = { contains: query.title, mode: 'insensitive' }
      }

      // Lọc theo trạng thái
      if (query.status) {
        if (query.status === 'available') {
          where.isAvailable = true
        } else if (query.status === 'rented') {
          where.isAvailable = false
        }
      }

      // Lọc theo khoảng giá
      if (query.priceRange) {
        if (query.priceRange === 'under-3m') {
          where.price = { lt: 3000000 }
        } else if (query.priceRange === '3m-5m') {
          where.price = { gte: 3000000, lte: 5000000 }
        } else if (query.priceRange === 'over-5m') {
          where.price = { gt: 5000000 }
        }
      }

      // Lọc theo khoảng diện tích
      if (query.areaRange) {
        if (query.areaRange === 'under-20') {
          where.area = { lt: 20 }
        } else if (query.areaRange === '20-25') {
          where.area = { gte: 20, lte: 25 }
        } else if (query.areaRange === 'over-25') {
          where.area = { gt: 25 }
        }
      }

      if (query.ownerId) {
        const rentals = await this.prismaService.rental.findMany({
          where: { landlordId: query.ownerId },
          select: { id: true },
        })

        const rentalIds = rentals.map(rental => rental.id)

        if (rentalIds.length === 0) {
          return {
            data: [],
            totalItems: 0,
            page: query.page,
            limit: query.limit,
            totalPages: 0,
          }
        }

        where.rentalId = { in: rentalIds }
      }

      const [totalItems, data] = await Promise.all([
        this.prismaService.room.count({ where }),
        this.prismaService.room.findMany({
          where,
          skip,
          take,
        }),
      ])

      return {
        data: data.map(this.formatRoom),
        totalItems,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalItems / query.limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async findById(id: number): Promise<RoomType | null> {
    try {
      const room = await this.prismaService.room.findUnique({
        where: { id },
        include: {
          roomAmenities: {
            include: {
              amenity: true,
            },
          },
        },
      })
      return room ? this.formatRoom(room) : null
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async create({ data }: { data: CreateRoomBodyType }): Promise<RoomType> {
    try {
      const { amenityIds, ...roomData } = data

      const room = await this.prismaService.room.create({
        data: {
          ...roomData,
          ...(amenityIds &&
            amenityIds.length > 0 && {
              roomAmenities: {
                create: amenityIds.map(amenityId => ({
                  amenity: { connect: { id: amenityId } },
                })),
              },
            }),
        },
      })
      return this.formatRoom(room)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async update({
    id,
    data,
  }: {
    id: number
    data: UpdateRoomBodyType
  }): Promise<RoomType> {
    try {
      const { amenityIds, ...roomData } = data

      // Nếu có amenityIds, xóa tất cả liên kết hiện tại và tạo mới
      if (amenityIds) {
        // Xóa tất cả room amenities hiện tại
        await this.prismaService.roomAmenity.deleteMany({
          where: { roomId: id },
        })

        // Tạo mới roomAmenities nếu có amenityIds
        if (amenityIds.length > 0) {
          await this.prismaService.roomAmenity.createMany({
            data: amenityIds.map(amenityId => ({
              roomId: id,
              amenityId,
            })),
          })
        }
      }

      const room = await this.prismaService.room.update({
        where: { id },
        data: roomData,
      })
      return this.formatRoom(room)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async delete({ id }: { id: number }): Promise<RoomType> {
    try {
      const room = await this.prismaService.room.delete({
        where: { id },
      })
      return this.formatRoom(room)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
