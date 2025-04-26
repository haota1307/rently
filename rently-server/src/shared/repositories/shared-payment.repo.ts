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
