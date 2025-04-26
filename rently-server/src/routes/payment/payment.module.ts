import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { PaymentRepo } from 'src/routes/payment/paymemt.repo'
import { PAYMENT_QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { PaymentProducer } from 'src/routes/payment/payment.producer'
@Module({
  imports: [
    BullModule.registerQueue({
      name: PAYMENT_QUEUE_NAME,
    }),
  ],
  providers: [PaymentService, PaymentRepo, PaymentProducer],
  controllers: [PaymentController],
})
export class PaymentModule {}
