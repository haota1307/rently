import { Injectable, NotFoundException } from '@nestjs/common'
import { PaymentStatus } from 'src/shared/constants/payment.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class SharedPaymentRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async cancelPayment(paymentId: number) {
    const payment = await this.prismaService.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        user: true,
      },
    })

    if (!payment) {
      throw new NotFoundException('Không tìm thấy thanh toán')
    }

    // Chỉ hủy thanh toán khi nó đang ở trạng thái PENDING
    if (payment.status === PaymentStatus.PENDING) {
      await this.prismaService.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status: PaymentStatus.CANCELED,
        },
      })
    }

    return { message: 'Đã hủy thanh toán' }
  }

  async cancelWithdraw(withdrawId: number) {
    const withdraw = await this.prismaService.payment.findUnique({
      where: {
        id: withdrawId,
      },
      include: {
        user: true,
      },
    })

    if (!withdraw) {
      throw new NotFoundException('Không tìm thấy yêu cầu rút tiền')
    }

    // Kiểm tra xem có phải là yêu cầu rút tiền không
    const withdrawData = withdraw as any
    if (!withdrawData.metadata || !withdrawData.metadata.isWithdraw) {
      throw new NotFoundException(
        'Giao dịch này không phải là yêu cầu rút tiền'
      )
    }

    // Chỉ hủy yêu cầu rút tiền khi nó đang ở trạng thái PENDING
    if (withdraw.status === PaymentStatus.PENDING) {
      // Hoàn tiền lại cho người dùng
      await this.prismaService.$transaction(async prisma => {
        // Cập nhật trạng thái thanh toán
        await prisma.payment.update({
          where: { id: withdrawId },
          data: {
            status: PaymentStatus.CANCELED,
            description: `${withdraw.description} - Bị hủy tự động do quá thời gian xử lý`,
          },
        })

        // Hoàn lại tiền cho người dùng
        await prisma.user.update({
          where: { id: withdraw.userId },
          data: {
            balance: { increment: withdraw.amount },
          },
        })
      })
    }

    return { message: 'Đã hủy yêu cầu rút tiền' }
  }

  async getPaymentDetail(paymentId: number) {
    const payment = await this.prismaService.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance: true,
          },
        },
        transaction: true,
      },
    })

    if (!payment) {
      throw new NotFoundException('Không tìm thấy thanh toán')
    }

    return payment
  }

  async getUserPaymentHistory(userId: number) {
    return this.prismaService.payment.findMany({
      where: {
        userId,
      },
      include: {
        transaction: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}
