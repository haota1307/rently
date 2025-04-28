import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PaymentRepo } from 'src/routes/payment/paymemt.repo'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { PaymentProducer } from 'src/routes/payment/payment.producer'
import envConfig from 'src/shared/config'
import { PaymentStatus } from '@prisma/client'
import { EventsGateway } from 'src/events/events.gateway'

@Injectable()
export class PaymentService {
  private bankAccount: string
  private bankName: string
  private bankAccountName: string

  constructor(
    private readonly paymentRepo: PaymentRepo,
    private readonly paymentProducer: PaymentProducer,
    private readonly eventsGateway: EventsGateway
  ) {
    // Lấy thông tin tài khoản từ config
    this.bankAccount = envConfig.BANK_ACCOUNT
    this.bankName = envConfig.BANK_NAME
    this.bankAccountName = envConfig.BANK_ACCOUNT_NAME
  }

  async receiver(body: WebhookPaymentBodyType) {
    const result = await this.paymentRepo.receiver(body)

    if (result.paymentId) {
      await this.paymentProducer.removeCancelPaymentJob(result.paymentId)

      const payment = await this.paymentRepo.getPaymentById(result.paymentId)

      if (payment && payment.status === PaymentStatus.COMPLETED) {
        this.eventsGateway.notifyPaymentStatusUpdated(payment.userId, {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          description: payment.description || undefined,
        })
      }
    }

    return result
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

  /**
   * Tạo QR code cho thanh toán
   * @param paymentId ID của thanh toán
   * @returns URL đến QR code
   */
  async generateQrCode(paymentId: number) {
    // Lấy thông tin thanh toán
    const payment = await this.paymentRepo.getPaymentById(paymentId)

    if (!payment) {
      throw new NotFoundException(
        `Không tìm thấy thanh toán với ID ${paymentId}`
      )
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Thanh toán #${paymentId} không ở trạng thái chờ thanh toán`
      )
    }

    // Tạo nội dung chuyển khoản (kèm mã thanh toán)
    const description = `NAP${payment.id}`

    // Tạo URL QR code
    const qrCodeUrl = `https://qr.sepay.vn/img?acc=${this.bankAccount}&bank=${this.bankName}&amount=${payment.amount}&des=${description}`

    return {
      qrCodeUrl,
      paymentCode: `NAP${payment.id}`,
      amount: payment.amount,
      bankInfo: {
        bankName: this.bankName,
        accountNumber: this.bankAccount,
        accountName: this.bankAccountName,
      },
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán
   * @param paymentId ID của thanh toán
   * @returns Thông tin thanh toán hiện tại
   */
  async checkPaymentStatus(paymentId: number) {
    const payment = await this.paymentRepo.getPaymentById(paymentId)

    if (!payment) {
      throw new NotFoundException(
        `Không tìm thấy thanh toán với ID ${paymentId}`
      )
    }

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      description: payment.description,
      userId: payment.userId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }
  }
}
