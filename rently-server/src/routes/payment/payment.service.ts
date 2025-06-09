import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common'
import { PaymentRepo } from 'src/routes/payment/paymemt.repo'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { PaymentProducer } from 'src/routes/payment/payment.producer'
import envConfig from 'src/shared/config'
import { PaymentStatus } from '@prisma/client'
import { EventsGateway } from 'src/events/events.gateway'
import { PrismaService } from 'src/shared/services/prisma.service'
import axios from 'axios'
import { parse } from 'date-fns'
import { NotificationService } from 'src/routes/notification/notification.service'

@Injectable()
export class PaymentService {
  private bankAccount: string
  private bankName: string
  private bankAccountName: string
  private readonly logger = new Logger(PaymentService.name)

  constructor(
    private readonly paymentRepo: PaymentRepo,
    private readonly paymentProducer: PaymentProducer,
    private readonly eventsGateway: EventsGateway,
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService
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

        // Lấy userId từ thông tin thanh toán
        const userId = payment.userId // Thay thế bằng cách lấy userId thực tế

        // Thêm gửi thông báo sau khi xác nhận thanh toán
        await this.notificationService.notifyPayment(
          userId,
          payment.amount,
          'Thanh toán đã được xác nhận'
        )
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

    // Thêm gửi thông báo sau khi tạo yêu cầu thanh toán
    await this.notificationService.notifyPayment(
      userId,
      amount,
      'Yêu cầu thanh toán mới'
    )

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
   * Tạo QR code cho việc rút tiền
   * @param withdrawId ID của yêu cầu rút tiền
   * @returns URL đến QR code và thông tin chuyển khoản
   */
  async generateWithdrawQrCode(withdrawId: number) {
    // Lấy thông tin yêu cầu rút tiền
    const withdrawRequest = await this.paymentRepo.getPaymentById(withdrawId)

    if (!withdrawRequest) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu rút tiền với ID ${withdrawId}`
      )
    }

    // Kiểm tra xem có phải yêu cầu rút tiền không
    const paymentData = withdrawRequest as any
    if (!paymentData.metadata || !paymentData.metadata.isWithdraw) {
      throw new BadRequestException(
        `Giao dịch này không phải là yêu cầu rút tiền`
      )
    }

    // Kiểm tra trạng thái
    if (withdrawRequest.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Yêu cầu rút tiền #${withdrawId} không ở trạng thái chờ xử lý`
      )
    }

    // Trích xuất thông tin chuyển khoản từ metadata
    const bankName = paymentData.metadata.bankName || ''
    const bankAccountNumber = paymentData.metadata.bankAccountNumber || ''
    const bankAccountName = paymentData.metadata.bankAccountName || ''

    // Tạo nội dung chuyển khoản (kèm mã yêu cầu rút tiền)
    const transferContent = `SEVQR #RUT${withdrawId}`

    // Tạo URL QR code cho SePay
    const qrCodeUrl = `https://qr.sepay.vn/img?acc=${bankAccountNumber}&bank=${bankName}&amount=${withdrawRequest.amount}&des=${transferContent}`

    return this.createSuccessResponse({
      qrCodeData: {
        qrCodeUrl,
        withdrawId,
        amount: withdrawRequest.amount,
        transferContent,
        recipientInfo: {
          bankName,
          bankAccountNumber,
          bankAccountName,
        },
      },
    })
  }

  /**
   * Lấy mã ngân hàng từ tên ngân hàng
   * @private
   */
  private getBankCodeFromName(bankName: string): string {
    const bankCodes: Record<string, string> = {
      CAKE: 'CAKE', // Cake by VPBank
      VietinBank: 'ICB',
      Vietcombank: 'VCB',
      BIDV: 'BIDV',
      Agribank: 'AGR',
      Techcombank: 'TCB',
      MBBank: 'MB',
      ACB: 'ACB',
      VPBank: 'VPB',
      TPBank: 'TPB',
      VIB: 'VIB',
      SHB: 'SHB',
      OCB: 'OCB',
      MSB: 'MSB',
      SCB: 'SCB',
      SeABank: 'SEAB',
      VietCapitalBank: 'VCCB',
      Eximbank: 'EIB',
      HDBank: 'HDB',
      LienVietPostBank: 'LPB',
      PVcomBank: 'PVCB',
      SaigonBank: 'SGB',
      BacABank: 'BAB',
      PGBank: 'PGB',
      VietABank: 'VAB',
      NamABank: 'NAB',
      KienLongBank: 'KLB',
      ABBank: 'ABB',
      GPBank: 'GPB',
      OceanBank: 'OJB',
      BaoVietBank: 'BVB',
      MOMO: 'MOMO',
      ZaloPay: 'ZALOPAY',
    }

    // Tìm mã ngân hàng từ tên hoặc trả về mã mặc định
    for (const [key, value] of Object.entries(bankCodes)) {
      if (bankName.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }

    return 'ICB' // Mặc định là VietinBank nếu không tìm thấy
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
   * Tạo yêu cầu rút tiền mới
   */
  async createWithdrawRequest(
    userId: number,
    amount: number,
    bankName: string,
    bankAccountNumber: string,
    bankAccountName: string,
    description?: string
  ) {
    try {
      const payment = await this.paymentRepo.createWithdrawRequest(
        userId,
        amount,
        bankName,
        bankAccountNumber,
        bankAccountName,
        description
      )

      // Thêm yêu cầu rút tiền vào hàng đợi hủy tự động sau 15 phút
      await this.paymentProducer.cancelWithdrawJob(payment.id)

      // Truy cập metadata một cách an toàn bằng cách cast
      const paymentData = payment as any
      const metadata = paymentData.metadata

      // Thông báo cho người dùng qua WebSocket
      this.eventsGateway.notifyPaymentStatusUpdated(userId, {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        description: payment.description || '',
      })

      return this.createSuccessResponse({
        withdrawRequest: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          description: payment.description,
          userId: payment.userId,
          bankName: metadata?.bankName || '',
          bankAccountNumber: metadata?.bankAccountNumber || '',
          bankAccountName: metadata?.bankAccountName || '',
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        },
      })
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Không thể tạo yêu cầu rút tiền'
      )
    }
  }

  /**
   * Xử lý yêu cầu rút tiền (dành cho admin)
   */
  async processWithdrawRequest(
    paymentId: number,
    status: 'COMPLETED' | 'REJECTED',
    rejectionReason?: string
  ) {
    try {
      // Xóa công việc khỏi hàng đợi vì admin đã xử lý thủ công
      await this.paymentProducer.removeCancelWithdrawJob(paymentId)

      const result = await this.paymentRepo.processWithdrawRequest(
        paymentId,
        status,
        rejectionReason
      )

      // Lấy thông tin người dùng để thông báo
      const payment = await this.paymentRepo.getPaymentById(paymentId)

      if (payment && payment.userId) {
        // Thông báo cho người dùng
        this.eventsGateway.notifyPaymentStatusUpdated(payment.userId, {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          description: payment.description || '',
        })

        // Thông báo cho phòng admin - chỉ gửi 1 sự kiện duy nhất
        this.eventsGateway.notifyAdmins('withdraw-confirm', {
          withdrawId: payment.id,
          status: payment.status,
          amount: payment.amount,
          description: payment.description || '',
          timestamp: new Date().toISOString(),
        })
      }

      return result
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Không thể xử lý yêu cầu rút tiền'
      )
    }
  }

  /**
   * Xác nhận giao dịch rút tiền đã hoàn thành
   * @param withdrawId ID của yêu cầu rút tiền
   * @param webhookData Dữ liệu webhook từ cổng thanh toán
   * @returns Thông tin về giao dịch đã xử lý
   */
  async confirmWithdrawTransaction(
    withdrawId: number,
    webhookData: WebhookPaymentBodyType
  ) {
    const payment = await this.paymentRepo.getPaymentById(withdrawId)

    if (!payment) {
      throw new NotFoundException(
        `Không tìm thấy giao dịch với ID ${withdrawId}`
      )
    }

    // Kiểm tra và ngăn chặn xử lý trùng lặp
    const isDuplicate =
      await this.paymentRepo.checkDuplicateWithdrawProcessing(withdrawId)
    if (isDuplicate) {
      return {
        message: `Yêu cầu rút tiền #${withdrawId} đã được xử lý trước đó`,
        status: 'success',
        duplicate: true,
      }
    }

    if (payment.amount !== webhookData.transferAmount) {
      throw new BadRequestException(
        `Số tiền không khớp, dự kiến ${payment.amount} nhưng nhận được ${webhookData.transferAmount}`
      )
    }

    // Xóa yêu cầu rút tiền khỏi hàng đợi hủy tự động
    await this.paymentProducer.removeCancelWithdrawJob(withdrawId)

    // Đánh dấu đã xử lý giao dịch này
    await this.paymentRepo.markWithdrawAsProcessing(withdrawId)

    // Xử lý xác nhận rút tiền trong database
    const result = await this.paymentRepo.confirmWithdrawTransaction(
      withdrawId,
      webhookData
    )

    // Thông báo qua WebSocket cho người dùng
    if (result.userId) {
      this.eventsGateway.notifyPaymentStatusUpdated(result.userId, {
        id: withdrawId,
        status: 'COMPLETED',
        amount: payment.amount,
        description: payment.description || '',
        timestamp: new Date().toISOString(),
      })
    }

    // Thông báo cho admin room để cập nhật trạng thái trên trang quản lý
    this.eventsGateway.notifyAdmins('withdraw-confirm', {
      withdrawId: withdrawId,
      status: 'COMPLETED',
      amount: payment.amount,
      description: payment.description || '',
      timestamp: new Date().toISOString(),
    })

    return result
  }

  /**
   * Map dữ liệu transaction sang response format
   * @param t Transaction record
   * @private
   */
  private mapToTransactionResponse(t: any) {
    // Xác định loại giao dịch để tạo code phù hợp
    let transactionCode = t.code || ''
    if (!transactionCode) {
      const transactionContent = t.transactionContent || t.description || ''
      if (
        transactionContent.includes('NAP') ||
        transactionContent.includes('Nạp tiền')
      ) {
        transactionCode = `NAP${t.id}`
      } else if (
        transactionContent.includes('RUT') ||
        transactionContent.includes('Rút tiền')
      ) {
        transactionCode = `RUT${t.id}`
      } else if (transactionContent.includes('Phí đăng bài')) {
        transactionCode = `PHI${t.id}`
      } else if (transactionContent.includes('Đặt cọc')) {
        transactionCode = `COC${t.id}`
      } else if (transactionContent.includes('Thanh toán subscription')) {
        transactionCode = `SUB${t.id}`
      } else {
        transactionCode = `TRANS${t.id}`
      }
    }

    return {
      id: t.id.toString(),
      bank_brand_name: this.bankName,
      account_number: this.bankAccount,
      transaction_date: t.transactionDate.toISOString(),
      amount_out: t.amountOut.toString() || '0',
      amount_in: t.amountIn.toString() || '0',
      accumulated: t.accumulated.toString() || '0',
      transaction_content: t.transactionContent || '',
      reference_number: t.referenceNumber || null,
      code: transactionCode,
      sub_account: t.subAccount || null,
      bank_account_id: '1',
      status: t.payment?.status || 'COMPLETED',
      user: t.user
        ? {
            id: t.user.id.toString(),
            name: t.user.name || 'Không rõ',
            email: t.user.email || '',
            phoneNumber: t.user.phoneNumber || '',
          }
        : undefined,
      payment: t.payment
        ? {
            id: t.payment.id,
            status: t.payment.status,
            amount: t.payment.amount,
            metadata: t.payment.metadata,
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
    const transactions = await this.paymentRepo.getTransactions(query)

    console.log({ transactions })

    // Tính tổng tiền vào và tiền ra
    let totalIncome = 0
    let totalExpense = 0

    transactions.forEach(t => {
      const transactionContent = t.transactionContent || ''

      if (
        transactionContent.includes('SEVQR NAP') &&
        t.amountIn &&
        t.amountIn > 0
      ) {
        totalIncome += t.amountIn
      } else if (
        (transactionContent.includes('RUT') ||
          transactionContent.includes('Rút tiền')) &&
        !transactionContent.includes('Phí') &&
        t.amountOut &&
        t.amountOut > 0
      ) {
        totalExpense += t.amountOut
      }

      // Không tính các loại giao dịch khác vào thống kê tài chính tổng thể
    })

    const balance = totalIncome - totalExpense

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

  /**
   * Xử lý thanh toán thành công
   */
  async handleSuccessfulPayment(
    userId: number,
    amount: number,
    description: string
  ) {
    try {
      // Xử lý logic thanh toán của bạn

      // Gửi thông báo
      await this.notificationService.notifyPayment(userId, amount, description)

      return { success: true }
    } catch (error) {
      this.logger.error(`Error in handleSuccessfulPayment: ${error.message}`)
      throw error
    }
  }
}
