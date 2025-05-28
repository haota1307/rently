import { Module } from '@nestjs/common'
import { RoomBillController } from './room-bill.controller'
import { RoomBillService } from './room-bill.service'
import { RoomBillRepository } from './room-bill.repo'
import { SharedModule } from 'src/shared/shared.module'

@Module({
  imports: [SharedModule],
  controllers: [RoomBillController],
  providers: [RoomBillService, RoomBillRepository],
  exports: [RoomBillService],
})
export class RoomBillModule {}
