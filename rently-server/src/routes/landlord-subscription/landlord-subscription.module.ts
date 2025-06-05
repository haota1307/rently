import { Module } from '@nestjs/common'
import { LandlordSubscriptionController } from 'src/routes/landlord-subscription/landlord-subscription.controller'
import { LandlordSubscriptionService } from 'src/routes/landlord-subscription/landlord-subscription.service'
import { PrismaService } from 'src/shared/services/prisma.service'

@Module({
  controllers: [LandlordSubscriptionController],
  providers: [LandlordSubscriptionService, PrismaService],
  exports: [LandlordSubscriptionService],
})
export class LandlordSubscriptionModule {}
