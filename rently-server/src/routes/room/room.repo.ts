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
      const [totalItems, data] = await Promise.all([
        this.prismaService.room.count(),
        this.prismaService.room.findMany({
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
      })
      return room ? this.formatRoom(room) : null
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async create({ data }: { data: CreateRoomBodyType }): Promise<RoomType> {
    try {
      const room = await this.prismaService.room.create({
        data,
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
      const room = await this.prismaService.room.update({
        where: { id },
        data,
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
