import { Module } from '@nestjs/common'
import { RentalController } from 'src/routes/rental/rental.controller'
import { RentalRepo } from 'src/routes/rental/rental.repo'
import { RentalService } from 'src/routes/rental/rental.service'

@Module({
  controllers: [RentalController],
  providers: [RentalService, RentalRepo],
})
export class RentalModule {}
