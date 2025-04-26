import { Injectable } from '@nestjs/common'
import { PaymentRepo } from 'src/routes/payment/paymemt.repo'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepo: PaymentRepo) {}

  receiver(body: WebhookPaymentBodyType) {
    return this.paymentRepo.receiver(body)
  }

  createPaymentRequest(userId: number, amount: number, description?: string) {
    return this.paymentRepo.createPaymentRequest(userId, amount, description)
  }
}
