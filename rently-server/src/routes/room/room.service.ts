import { Injectable } from '@nestjs/common'
import { RoomRepo } from 'src/routes/room/room.repo'
import {
  CreateRoomBodyType,
  GetRoomsQueryType,
  UpdateRoomBodyType,
} from 'src/routes/room/room.model'
import { NotFoundRecordException } from 'src/shared/error'

@Injectable()
export class RoomService {
  constructor(private readonly roomRepo: RoomRepo) {}

  async list(query: GetRoomsQueryType) {
    return this.roomRepo.list(query)
  }

  async findById(id: number) {
    const room = await this.roomRepo.findById(id)
    if (!room) {
      throw NotFoundRecordException
    }
    return room
  }

  async create({ data }: { data: CreateRoomBodyType }) {
    return this.roomRepo.create({ data })
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
}
