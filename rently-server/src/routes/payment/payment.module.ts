import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { PaymentRepo } from 'src/routes/payment/paymemt.repo'
import { PAYMENT_QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { PaymentProducer } from 'src/routes/payment/payment.producer'
import { SharedPaymentRepository } from 'src/shared/repositories/shared-payment.repo'
import { EventsModule } from 'src/events/events.module'
import { PaymentConsumer } from 'src/routes/queues/payment.consumer'
import { NotificationModule } from 'src/routes/notification/notification.module'

@Module({
  imports: [
    BullModule.registerQueue({
      name: PAYMENT_QUEUE_NAME,
    }),
    EventsModule,
    NotificationModule,
  ],
  providers: [
    PaymentService,
    PaymentRepo,
    PaymentProducer,
    SharedPaymentRepository,
    PaymentConsumer,
  ],
  controllers: [PaymentController],
  exports: [SharedPaymentRepository],
})
export class PaymentModule {}
