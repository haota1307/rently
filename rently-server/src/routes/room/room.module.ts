import { Module } from '@nestjs/common'
import { RoomController } from 'src/routes/room/room.controller'
import { RoomService } from 'src/routes/room/room.service'
import { RoomRepo } from 'src/routes/room/room.repo'

@Module({
  controllers: [RoomController],
  providers: [RoomService, RoomRepo],
  exports: [RoomService, RoomRepo],
})
export class RoomModule {}
