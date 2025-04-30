import { Module } from '@nestjs/common'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { SharedPaymentRepository } from 'src/shared/repositories/shared-payment.repo'

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, SharedPaymentRepository],
})
export class ProfileModule {}
