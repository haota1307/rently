import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common'
import { parse } from 'date-fns'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { PaymentStatus } from '@prisma/client'
import { PrismaService } from 'src/shared/services/prisma.service'

// Định nghĩa PREFIX_PAYMENT_CODE nếu không có file constant
const PREFIX_PAYMENT_CODE = 'NAP'

@Injectable()
export class PaymentRepo {
  constructor(private readonly prismaService: PrismaService) {}

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
}
