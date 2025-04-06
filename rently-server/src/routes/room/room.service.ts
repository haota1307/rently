import { Injectable } from '@nestjs/common'
import { RoomRepo } from 'src/routes/room/room.repo'

import { NotFoundRecordException } from 'src/shared/error'
import {
  CreateRoomBodyType,
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

  async create({ data }: { data: CreateRoomBodyType }) {
    console.log('Creating room with data:', JSON.stringify(data, null, 2))
    return this.roomRepo.create({ data })
  }

  async update({ id, data }: { id: number; data: UpdateRoomBodyType }) {
    try {
      console.log('Updating room with data:', JSON.stringify(data, null, 2))
      return await this.roomRepo.update({ id, data })
    } catch (error) {
      console.error('Error updating room:', error)
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
}
