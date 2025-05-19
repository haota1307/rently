import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { parse } from 'date-fns'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { PaymentStatus } from '@prisma/client'
import { PrismaService } from 'src/shared/services/prisma.service'

// Định nghĩa PREFIX_PAYMENT_CODE nếu không có file constant
const PREFIX_PAYMENT_SEPAY = 'SEVQR'
const PREFIX_PAYMENT_CODE = 'NAP'

@Injectable()
export class PaymentRepo {
  constructor(private readonly prismaService: PrismaService) {}

  // Biến lưu trữ các giao dịch đã xử lý gần đây để tránh xử lý trùng lặp
  private recentlyProcessedWithdraws: Map<number, number> = new Map()

  async receiver(
    body: WebhookPaymentBodyType
  ): Promise<{ message: string; paymentId: number }> {
    // 1. Thêm thông tin giao dịch vào DB
    let amountIn = 0
    let amountOut = 0
    if (body.transferType === 'in') {
      amountIn = body.transferAmount
    } else if (body.transferType === 'out') {
      amountOut = body.transferAmount
    }

    // 2. Kiểm tra nội dung chuyển khoản để xác định payment và người dùng
    const paymentId = body.code
      ? Number(body.code.split(PREFIX_PAYMENT_CODE)[1])
      : Number(body.content?.split(PREFIX_PAYMENT_CODE)[1])

    if (isNaN(paymentId)) {
      throw new BadRequestException(
        'Không thể lấy payment ID từ nội dung chuyển khoản'
      )
    }

    const payment = await this.prismaService.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        user: true,
        transaction: true,
      },
    })

    if (!payment) {
      throw new BadRequestException(
        `Không tìm thấy thông tin thanh toán với id ${paymentId}`
      )
    }

    // Kiểm tra nếu thanh toán đã hoàn thành
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new ConflictException(
        `Thanh toán #${paymentId} đã được xử lý thành công trước đó`
      )
    }

    // Kiểm tra số tiền có khớp không
    if (payment.amount !== body.transferAmount) {
      throw new BadRequestException(
        `Số tiền không khớp, dự kiến ${payment.amount} nhưng nhận được ${body.transferAmount}`
      )
    }

    const paymentTransaction =
      await this.prismaService.paymentTransaction.findUnique({
        where: {
          id: body.id,
        },
      })

    if (paymentTransaction) {
      throw new BadRequestException(
        `Giao dịch đã được xử lý trước đó với id ${body.id}`
      )
    }

    // Ghi lại thông tin giao dịch
    const transaction = await this.prismaService.paymentTransaction.create({
      data: {
        id: body.id,
        gateway: body.gateway,
        transactionDate: parse(
          body.transactionDate,
          'yyyy-MM-dd HH:mm:ss',
          new Date()
        ),
        accountNumber: body.accountNumber || '',
        subAccount: body.subAccount,
        amountIn,
        amountOut,
        accumulated: body.accumulated,
        code: body.code,
        transactionContent: body.content,
        referenceNumber: body.referenceCode,
        body: body.description,
        userId: payment.userId,
      },
    })

    // 3. Cập nhật trạng thái thanh toán và cộng tiền vào tài khoản người dùng
    await this.prismaService.$transaction(async prisma => {
      // Cập nhật trạng thái thanh toán
      await prisma.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status: PaymentStatus.COMPLETED,
          transactionId: transaction.id,
        },
      })

      // Cộng tiền vào tài khoản người dùng
      await prisma.user.update({
        where: {
          id: payment.userId,
        },
        data: {
          balance: {
            increment: payment.amount,
          },
        },
      })
    })

    return {
      message: 'Nạp tiền thành công',
      paymentId,
    }
  }

  async getPaymentById(paymentId: number) {
    return this.prismaService.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        user: true,
        transaction: true,
      },
    })
  }

  async createPaymentRequest(
    userId: number,
    amount: number,
    description?: string
  ): Promise<{ paymentCode: string; payment: any }> {
    // Tạo một yêu cầu thanh toán mới
    const payment = await this.prismaService.payment.create({
      data: {
        amount,
        status: PaymentStatus.PENDING,
        description: description || 'Nạp tiền vào tài khoản',
        userId,
      },
      include: {
        user: true,
      },
    })

    // Tạo mã thanh toán
    const paymentCode = `${PREFIX_PAYMENT_CODE}${payment.id}`

    return {
      paymentCode,
      payment,
    }
  }

  /**
   * Lấy danh sách giao dịch thanh toán
   * @param query Các tham số lọc và phân trang
   * @returns Danh sách giao dịch
   */
  async getTransactions(query: any) {
    // Xây dựng điều kiện lọc
    const where: any = {}
    const transactionWhere: any = {}

    // Nếu có tham số userId, lọc theo userId
    if (query.userId) {
      where.userId = parseInt(query.userId, 10)
    }

    if (query.status) {
      where.status = query.status
    }

    // Nếu có từ ngày đến ngày, lọc theo ngày tạo
    if (query.startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(query.startDate),
      }
    }

    if (query.endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(query.endDate + 'T23:59:59.999Z'),
      }
    }

    // Xử lý filter tiền vào/tiền ra
    if (query.amount_in === 'true') {
      transactionWhere.amountIn = {
        gt: 0,
      }
    }

    if (query.amount_out === 'true') {
      transactionWhere.amountOut = {
        gt: 0,
      }
    }

    // Lọc theo nội dung giao dịch (NAP|RUT)
    if (query.transaction_content) {
      const contentFilters = query.transaction_content
        .split('|')
        .map((content: string) => ({
          OR: [
            {
              transactionContent: {
                contains: content,
              },
            },
            {
              description: {
                contains: content,
              },
            },
          ],
        }))

      // Thêm điều kiện OR cho nhiều loại giao dịch
      if (contentFilters.length > 0) {
        transactionWhere.OR = contentFilters
      }
    }

    // Giới hạn số lượng bản ghi
    const limit = query.limit ? parseInt(query.limit, 10) : 20

    // Sử dụng prisma transaction where khi có điều kiện
    const transactionInclude =
      Object.keys(transactionWhere).length > 0
        ? { where: transactionWhere }
        : true

    return this.prismaService.payment.findMany({
      where,
      include: {
        user: true,
        transaction: transactionInclude,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
  }

  /**
   * Đếm số lượng giao dịch
   * @param query Các tham số lọc
   * @returns Số lượng giao dịch
   */
  async countTransactions(query: any) {
    // Xây dựng điều kiện lọc
    const where: any = {}

    // Nếu có tham số userId, lọc theo userId
    if (query.userId) {
      where.userId = parseInt(query.userId, 10)
    }

    // Nếu có từ ngày đến ngày, lọc theo ngày tạo
    if (query.transaction_date_min) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(query.transaction_date_min),
      }
    }

    if (query.transaction_date_max) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(query.transaction_date_max),
      }
    }

    return this.prismaService.payment.count({
      where,
    })
  }

  // Thêm phương thức tạo yêu cầu rút tiền
  async createWithdrawRequest(
    userId: number,
    amount: number,
    bankName: string,
    bankAccountNumber: string,
    bankAccountName: string,
    description?: string
  ) {
    // Kiểm tra số dư tài khoản
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new BadRequestException('Không tìm thấy thông tin người dùng')
    }

    if (user.balance < amount) {
      throw new BadRequestException(
        `Số dư không đủ để thực hiện yêu cầu rút tiền. Số dư hiện tại: ${user.balance}, yêu cầu rút: ${amount}`
      )
    }

    // Tạo một yêu cầu rút tiền mới
    const paymentData: any = {
      amount,
      status: PaymentStatus.PENDING,
      description:
        description ||
        `Yêu cầu rút tiền về tài khoản ${bankAccountNumber} - ${bankName}`,
      userId,
      metadata: {
        bankName,
        bankAccountNumber,
        bankAccountName,
        isWithdraw: true,
      },
    }

    const payment = await this.prismaService.payment.create({
      data: paymentData,
      include: {
        user: true,
      },
    })

    // Tạm thời trừ tiền từ tài khoản người dùng để đảm bảo không bị rút quá số dư
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: amount },
      },
    })

    // Tạo một giao dịch tạm thời
    const transaction = await this.prismaService.paymentTransaction.create({
      data: {
        gateway: 'SYSTEM',
        transactionDate: new Date(),
        accountNumber: bankAccountNumber,
        subAccount: null,
        amountIn: 0,
        amountOut: amount,
        accumulated: user.balance - amount,
        code: `RUT${payment.id}`,
        transactionContent: `CT DEN:${bankAccountNumber} SEVQR RUT${payment.id}`,
        referenceNumber: null,
        body:
          description ||
          `Yêu cầu rút tiền về tài khoản ${bankAccountNumber} - ${bankName}`,
        userId,
      },
    })

    // Cập nhật transaction cho payment
    await this.prismaService.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: transaction.id,
      },
    })

    return payment
  }

  // Phương thức để admin xử lý yêu cầu rút tiền
  async processWithdrawRequest(
    paymentId: number,
    status: 'COMPLETED' | 'REJECTED',
    rejectionReason?: string
  ) {
    const payment = await this.prismaService.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        transaction: true,
      },
    })

    if (!payment) {
      throw new BadRequestException(
        `Không tìm thấy yêu cầu rút tiền với ID ${paymentId}`
      )
    }

    // Kiểm tra xem có phải yêu cầu rút tiền không
    const paymentData = payment as any // Cast để truy cập field metadata
    if (!paymentData.metadata || !paymentData.metadata.isWithdraw) {
      throw new BadRequestException(
        `Giao dịch này không phải là yêu cầu rút tiền`
      )
    }

    // Kiểm tra trạng thái hiện tại
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException(
        `Yêu cầu rút tiền #${paymentId} đã được xử lý trước đó`
      )
    }

    // Xử lý theo trạng thái mới
    if (status === 'COMPLETED') {
      // Đã hoàn thành rút tiền - không cần thực hiện gì thêm vì tiền đã bị trừ khi tạo yêu cầu
      await this.prismaService.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
        },
      })

      return {
        message: `Yêu cầu rút tiền #${paymentId} đã được xử lý thành công`,
        paymentId,
      }
    } else if (status === 'REJECTED') {
      // Từ chối yêu cầu rút tiền - hoàn lại tiền cho người dùng
      await this.prismaService.$transaction(async prisma => {
        // Cập nhật trạng thái thanh toán
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.CANCELED,
            description: `${payment.description} - Bị từ chối: ${rejectionReason || 'Không có lý do'}`,
          },
        })

        // Hoàn lại tiền cho người dùng
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            balance: { increment: payment.amount },
          },
        })
      })

      return {
        message: `Yêu cầu rút tiền #${paymentId} đã bị từ chối, tiền đã được hoàn lại`,
        paymentId,
      }
    }

    throw new BadRequestException('Trạng thái không hợp lệ')
  }

  /**
   * Kiểm tra xem yêu cầu rút tiền đã được xử lý gần đây chưa
   * @param withdrawId ID của yêu cầu rút tiền
   * @returns true nếu đã xử lý gần đây, false nếu chưa
   */
  async checkDuplicateWithdrawProcessing(withdrawId: number): Promise<boolean> {
    // Kiểm tra xem giao dịch này đã được xử lý gần đây chưa (trong 10 giây)
    const now = Date.now()
    const lastProcessed = this.recentlyProcessedWithdraws.get(withdrawId)

    if (lastProcessed && now - lastProcessed < 10000) {
      console.log(
        `Giao dịch rút tiền #${withdrawId} đã được xử lý gần đây, bỏ qua để tránh trùng lặp`
      )
      return true
    }

    return false
  }

  /**
   * Đánh dấu yêu cầu rút tiền đang được xử lý
   * @param withdrawId ID của yêu cầu rút tiền
   */
  async markWithdrawAsProcessing(withdrawId: number): Promise<void> {
    // Đánh dấu giao dịch này đã được xử lý
    const now = Date.now()
    this.recentlyProcessedWithdraws.set(withdrawId, now)

    // Giới hạn kích thước map để tránh rò rỉ bộ nhớ
    if (this.recentlyProcessedWithdraws.size > 100) {
      const entriesToDelete = [...this.recentlyProcessedWithdraws.entries()]
        .sort((a, b) => a[1] - b[1])
        .slice(0, this.recentlyProcessedWithdraws.size - 100)

      entriesToDelete.forEach(([key]) =>
        this.recentlyProcessedWithdraws.delete(key)
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
    try {
      // Kiểm tra xem yêu cầu rút tiền có tồn tại không
      const payment = await this.getPaymentById(withdrawId)

      if (!payment) {
        throw new NotFoundException(
          `Không tìm thấy yêu cầu rút tiền với ID ${withdrawId}`
        )
      }

      // Kiểm tra xem có phải yêu cầu rút tiền không
      const paymentData = payment as any
      if (!paymentData.metadata || !paymentData.metadata.isWithdraw) {
        throw new BadRequestException(
          `Giao dịch này không phải là yêu cầu rút tiền`
        )
      }

      // Kiểm tra số tiền chuyển khoản
      if (webhookData.transferAmount !== payment.amount) {
        console.warn(
          `Cảnh báo: Số tiền chuyển khoản (${webhookData.transferAmount}) không khớp với số tiền yêu cầu (${payment.amount})`
        )
        // Không báo lỗi ở đây, vì có thể admin đã chuyển khác số tiền yêu cầu
      }

      // Kiểm tra trạng thái hiện tại
      if (payment.status === PaymentStatus.COMPLETED) {
        return {
          message: `Yêu cầu rút tiền #${withdrawId} đã được xử lý trước đó`,
          paymentId: withdrawId,
          userId: payment.userId,
        }
      }

      // Ghi nhận giao dịch từ webhook
      let amountIn = 0
      let amountOut = 0

      if (webhookData.transferType === 'in') {
        amountIn = webhookData.transferAmount
      } else if (webhookData.transferType === 'out') {
        amountOut = webhookData.transferAmount
      }

      // Tạo giao dịch mới nếu cần, hoặc cập nhật giao dịch hiện tại
      if (!payment.transactionId) {
        const transaction = await this.prismaService.paymentTransaction.create({
          data: {
            id: webhookData.id,
            gateway: webhookData.gateway,
            transactionDate: parse(
              webhookData.transactionDate,
              'yyyy-MM-dd HH:mm:ss',
              new Date()
            ),
            accountNumber: webhookData.accountNumber || '',
            subAccount: webhookData.subAccount,
            amountIn,
            amountOut,
            accumulated: webhookData.accumulated,
            code: webhookData.code,
            transactionContent: `CT DEN:${paymentData.metadata.bankAccountNumber} SEVQR RUT${withdrawId}`,
            referenceNumber: webhookData.referenceCode,
            body: webhookData.description,
            userId: payment.userId,
          },
        })

        // Cập nhật transaction ID cho payment
        await this.prismaService.payment.update({
          where: { id: withdrawId },
          data: {
            transactionId: transaction.id,
          },
        })
      }

      // Cập nhật trạng thái thanh toán
      await this.prismaService.payment.update({
        where: { id: withdrawId },
        data: {
          status: PaymentStatus.COMPLETED,
        },
      })

      return {
        message: `Xác nhận chuyển khoản thành công cho yêu cầu rút tiền #${withdrawId}`,
        paymentId: withdrawId,
        userId: payment.userId,
      }
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Không thể xác nhận giao dịch chuyển khoản'
      )
    }
  }
}
