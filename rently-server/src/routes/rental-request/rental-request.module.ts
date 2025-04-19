import { Module } from '@nestjs/common'
import { RentalRequestController } from './rental-request.controller'
import { RentalRequestService } from './rental-request.service'
import { RentalRequestRepo } from './rental-request.repo'

@Module({
  controllers: [RentalRequestController],
  providers: [RentalRequestService, RentalRequestRepo],
})
export class RentalRequestModule {}
