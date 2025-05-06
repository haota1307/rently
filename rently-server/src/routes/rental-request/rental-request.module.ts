import { Module } from '@nestjs/common'
import { RentalRequestController } from './rental-request.controller'
import { RentalRequestService } from './rental-request.service'
import { RentalRequestRepo } from './rental-request.repo'
import { NotificationModule } from 'src/routes/notification/notification.module'

@Module({
  controllers: [RentalRequestController],
  providers: [RentalRequestService, RentalRequestRepo],
  imports: [NotificationModule],
})
export class RentalRequestModule {}
