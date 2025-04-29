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
import axios from 'axios'

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
   * Chuyển đổi dữ liệu từ model sang response
   * @private
   */
  private mapToTransactionResponse(t: any) {
    return {
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
      status: t.status,
      user: t.user
        ? {
            id: t.user.id.toString(),
            name: t.user.name || 'Không rõ',
            email: t.user.email || '',
            phoneNumber: t.user.phoneNumber || '',
          }
        : undefined,
    }
  }

  /**
   * Tạo response chuẩn
   * @private
   */
  private createSuccessResponse(data: any) {
    return {
      status: 200,
      error: null,
      messages: {
        success: true,
      },
      ...data,
    }
  }

  /**
   * Lấy danh sách giao dịch thanh toán
   * @param query Các tham số lọc và phân trang
   * @returns Danh sách giao dịch
   */
  async getTransactions(query: any) {
    const transactions = await this.paymentRepo.getTransactions(query)

    const mappedTransactions = transactions.map(t =>
      this.mapToTransactionResponse(t)
    )

    return this.createSuccessResponse({ transactions: mappedTransactions })
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

    const mapped = this.mapToTransactionResponse(transaction)
    return this.createSuccessResponse({ transaction: mapped })
  }

  /**
   * Đếm số lượng giao dịch
   * @param query Các tham số lọc
   * @returns Số lượng giao dịch
   */
  async countTransactions(query: any) {
    const count = await this.paymentRepo.countTransactions(query)
    return this.createSuccessResponse({ count_transactions: count })
  }

  /**
   * Lấy thống kê tổng tiền vào/ra
   * @param query Các tham số lọc
   * @returns Tổng tiền vào/ra và số dư
   */
  async getTransactionSummary(query: any) {
    // Lấy danh sách giao dịch
    const transactions = await this.paymentRepo.getTransactions({
      ...query,
      // Chỉ lấy các giao dịch thành công
      status: PaymentStatus.COMPLETED,
    })

    // Tính tổng tiền vào và tiền ra
    let totalIncome = 0
    let totalExpense = 0

    transactions.forEach(t => {
      if (t.transaction) {
        if (t.transaction.amountIn > 0) {
          totalIncome += t.transaction.amountIn
        }
        if (t.transaction.amountOut > 0) {
          totalExpense += t.transaction.amountOut
        }
      } else if (t.amount > 0 && t.status === PaymentStatus.COMPLETED) {
        // Nếu là thanh toán thành công không có transaction, coi là tiền vào
        totalIncome += t.amount
      }
    })

    // Tính balance từ accumulated trong bankInfo
    let balance = 0
    try {
      const bankInfoResponse = await this.getBankInfo()
      if (bankInfoResponse.bankInfo && bankInfoResponse.bankInfo.accumulated) {
        balance = parseFloat(bankInfoResponse.bankInfo.accumulated)
      } else {
        // Nếu không có accumulated, tính balance từ income và expense
        balance = totalIncome - totalExpense
      }
    } catch (error) {
      console.error('Error getting bank info:', error)
      balance = totalIncome - totalExpense
    }

    return this.createSuccessResponse({
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
    })
  }

  /**
   * Lấy thông tin tài khoản ngân hàng từ SePay API
   * @returns Thông tin tài khoản ngân hàng
   */
  async getBankInfo() {
    try {
      // Gọi API SePay để lấy thông tin tài khoản
      const response = await axios.get(
        `https://my.sepay.vn/userapi/bankaccounts/details/${envConfig.SEPAY_BANK_ACCOUNT_ID}`,
        {
          headers: {
            Authorization: `Bearer ${envConfig.SEPAY_API_KEY}`,
          },
        }
      )

      if (response.data?.status !== 200 || !response.data?.bankaccount) {
        throw new Error('Không thể lấy thông tin tài khoản ngân hàng từ SePay')
      }

      const bankAccount = response.data.bankaccount

      // Chuyển đổi dữ liệu theo định dạng mong muốn
      return this.createSuccessResponse({
        bankInfo: {
          id: bankAccount.id,
          bankName: bankAccount.bank_short_name,
          bankFullName: bankAccount.bank_full_name,
          accountNumber: bankAccount.account_number,
          accountName: bankAccount.account_holder_name,
          accumulated: bankAccount.accumulated,
          lastTransaction: bankAccount.last_transaction,
          label: bankAccount.label,
        },
      })
    } catch (error) {
      console.error('Error calling SePay API:', error)

      // Nếu API SePay lỗi, trả về dữ liệu từ cấu hình
      return this.createSuccessResponse({
        bankInfo: {
          id: envConfig.SEPAY_BANK_ACCOUNT_ID,
          bankName: this.bankName,
          bankFullName: this.bankName,
          accountNumber: this.bankAccount,
          accountName: this.bankAccountName,
          accumulated: '0',
          lastTransaction: new Date().toISOString(),
          label: 'RENTLY',
        },
      })
    }
  }
}
