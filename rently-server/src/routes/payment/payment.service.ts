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
    const description = `SEVQR NAP${payment.id}`

    // Tạo URL QR code
    const qrCodeUrl = `https://qr.sepay.vn/img?acc=${this.bankAccount}&bank=${this.bankName}&amount=${payment.amount}&des=${description}`

    return {
      qrCodeUrl,
      paymentCode: `SEVQR NAP${payment.id}`,
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

  /**
   * Lấy danh sách giao dịch thanh toán
   * @param query Các tham số lọc và phân trang
   * @returns Danh sách giao dịch
   */
  async getTransactions(query: any) {
    const transactions = await this.paymentRepo.getTransactions(query)

    return {
      status: 200,
      error: null,
      messages: {
        success: true,
      },
      transactions: transactions.map(t => ({
        id: t.id.toString(),
        bank_brand_name: this.bankName,
        account_number: this.bankAccount,
        transaction_date:
          t.transaction?.transactionDate.toISOString() ||
          t.createdAt.toISOString(),
        amount_out: t.transaction?.amountOut.toString() || '0',
        amount_in: t.transaction?.amountIn.toString() || t.amount.toString(),
        accumulated: t.transaction?.accumulated.toString() || '0',
        transaction_content: t.transaction?.transactionContent || t.description,
        reference_number: t.transaction?.referenceNumber || null,
        code: t.transaction?.code || `NAP${t.id}`,
        sub_account: t.transaction?.subAccount || null,
        bank_account_id: '1',
        user: {
          id: t.user?.id.toString(),
          name: t.user?.name || 'Không rõ',
          email: t.user?.email || '',
          phoneNumber: t.user?.phoneNumber || '',
        },
      })),
    }
  }

  /**
   * Lấy chi tiết một giao dịch
   * @param id ID của giao dịch
   * @returns Chi tiết giao dịch
   */
  async getTransactionDetail(id: number) {
    const transaction = await this.paymentRepo.getPaymentById(id)

    if (!transaction) {
      throw new NotFoundException(`Không tìm thấy giao dịch với ID ${id}`)
    }

    return {
      status: 200,
      error: null,
      messages: {
        success: true,
      },
      transaction: {
        id: transaction.id.toString(),
        bank_brand_name: this.bankName,
        account_number: this.bankAccount,
        transaction_date:
          transaction.transaction?.transactionDate.toISOString() ||
          transaction.createdAt.toISOString(),
        amount_out: transaction.transaction?.amountOut.toString() || '0',
        amount_in:
          transaction.transaction?.amountIn.toString() ||
          transaction.amount.toString(),
        accumulated: transaction.transaction?.accumulated.toString() || '0',
        transaction_content:
          transaction.transaction?.transactionContent ||
          transaction.description,
        reference_number: transaction.transaction?.referenceNumber || null,
        code: transaction.transaction?.code || `NAP${transaction.id}`,
        sub_account: transaction.transaction?.subAccount || null,
        bank_account_id: '1',
      },
    }
  }

  /**
   * Đếm số lượng giao dịch
   * @param query Các tham số lọc
   * @returns Số lượng giao dịch
   */
  async countTransactions(query: any) {
    const count = await this.paymentRepo.countTransactions(query)

    return {
      status: 200,
      error: null,
      messages: {
        success: true,
      },
      count_transactions: count,
    }
  }
}
