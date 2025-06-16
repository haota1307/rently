import { Injectable } from '@nestjs/common'
import { RoomRepo } from 'src/routes/room/room.repo'
import { NotFoundRecordException } from 'src/shared/error'
import {
  CreateRoomBodyType,
  CreateBulkRoomsBodyType,
  GetRoomsQueryType,
  UpdateRoomBodyType,
} from 'src/shared/models/shared-room.model'

@Injectable()
export class RoomService {
  constructor(private readonly roomRepo: RoomRepo) {}

  async list(query: GetRoomsQueryType) {
    return this.roomRepo.list(query)
  }

  async listMyRooms(userId: number, query: GetRoomsQueryType) {
    return this.roomRepo.list({ ...query, ownerId: userId })
  }

  async findById(id: number) {
    const room = await this.roomRepo.findById(id)
    if (!room) {
      throw NotFoundRecordException
    }
    return room
  }

  async create({
    data,
    landlordId,
  }: {
    data: CreateRoomBodyType
    landlordId: number
  }) {
    return this.roomRepo.create({ data, landlordId })
  }

  async update({ id, data }: { id: number; data: UpdateRoomBodyType }) {
    try {
      return await this.roomRepo.update({ id, data })
    } catch (error) {
      throw NotFoundRecordException
    }
  }

  async delete({ id }: { id: number }) {
    try {
      await this.roomRepo.delete({ id })
      return { message: 'Delete successfully' }
    } catch (error) {
      throw NotFoundRecordException
    }
  }

  async createBulkRooms({
    data,
    landlordId,
  }: {
    data: CreateBulkRoomsBodyType
    landlordId: number
  }) {
    return this.roomRepo.createBulkRooms({ data, landlordId })
  }
}
