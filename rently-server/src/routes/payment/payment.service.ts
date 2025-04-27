import { Injectable } from '@nestjs/common'
import { PaymentRepo } from 'src/routes/payment/paymemt.repo'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { PaymentProducer } from 'src/routes/payment/payment.producer'

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepo: PaymentRepo,
    private paymentProducer: PaymentProducer
  ) {}

  async receiver(body: WebhookPaymentBodyType) {
    const { message, paymentId } = await this.paymentRepo.receiver(body)

    await this.paymentProducer.removeCancelPaymentJob(paymentId)

    return message
  }

  async createPaymentRequest(
    userId: number,
    amount: number,
    description?: string
  ) {
    const result = await this.paymentRepo.createPaymentRequest(
      userId,
      amount,
      description
    )

    await this.paymentProducer.cancelPaymentJob(result.payment.id)

    return result
  }
}
