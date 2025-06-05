import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { LandlordSubscription, SubscriptionStatus } from '@prisma/client'
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/landlord-subscription.dto'

@Injectable()
export class LandlordSubscriptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Kiểm tra xem user đã từng sử dụng free trial chưa
   */
  async hasUserUsedFreeTrial(userId: number): Promise<boolean> {
    const freeTrialSubscription =
      await this.prisma.landlordSubscription.findFirst({
        where: {
          userId,
          isFreeTrial: true,
        },
      })

    return !!freeTrialSubscription
  }

  /**
   * Tạo subscription mới cho landlord với hỗ trợ dynamic plans
   */
  async createSubscription(
    userId: number,
    dto: CreateSubscriptionDto
  ): Promise<LandlordSubscription> {
    // Kiểm tra xem user có subscription active không
    const existingSubscription = await this.getActiveSubscription(userId)
    if (existingSubscription) {
      throw new BadRequestException('User đã có subscription đang hoạt động')
    }

    // Lấy thông tin plan từ planId hoặc fallback sang cách cũ
    let plan: any = null
    let planId: string | null = null

    if (dto.planId) {
      plan = await this.getSubscriptionPlanById(dto.planId)
      if (!plan) {
        throw new BadRequestException('Gói subscription không tồn tại')
      }
      planId = dto.planId
    } else {
      // Fallback: Tạo plan từ thông tin cũ
      const monthlyFee = await this.getSystemSetting(
        'landlord_subscription_monthly_fee',
        299000
      )
      const freeTrialDays = await this.getSystemSetting(
        'landlord_subscription_free_trial_days',
        30
      )

      plan = {
        id: dto.isFreeTrial ? 'free_trial' : 'basic_monthly',
        name: dto.isFreeTrial ? 'Dùng thử miễn phí' : 'Gói cơ bản',
        price: dto.isFreeTrial ? 0 : monthlyFee,
        duration: dto.isFreeTrial ? freeTrialDays : 1,
        durationType: dto.isFreeTrial ? 'days' : 'months',
        isFreeTrial: dto.isFreeTrial || false,
      }
      planId = plan.id
    }

    // Nếu user yêu cầu free trial, kiểm tra xem đã từng dùng chưa
    if (plan.isFreeTrial) {
      const hasUsedFreeTrial = await this.hasUserUsedFreeTrial(userId)
      if (hasUsedFreeTrial) {
        throw new BadRequestException(
          'Bạn đã sử dụng gói dùng thử miễn phí. Vui lòng chọn gói trả phí.'
        )
      }
    }

    const startDate = new Date()
    const endDate = new Date()

    // Tính ngày kết thúc dựa trên plan
    if (plan.durationType === 'days') {
      endDate.setDate(startDate.getDate() + plan.duration)
    } else if (plan.durationType === 'months') {
      endDate.setMonth(startDate.getMonth() + plan.duration)
    } else if (plan.durationType === 'years') {
      endDate.setFullYear(startDate.getFullYear() + plan.duration)
    }

    let paymentId: number | undefined = undefined

    // Nếu không phải free trial, cần xử lý thanh toán
    if (!plan.isFreeTrial && plan.price > 0) {
      // Kiểm tra số dư tài khoản
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true, name: true, email: true },
      })

      if (!user) {
        throw new NotFoundException('Không tìm thấy thông tin người dùng')
      }

      if (user.balance < plan.price) {
        throw new BadRequestException(
          `Số dư tài khoản không đủ. Cần ${plan.price.toLocaleString()} VND, hiện có ${user.balance.toLocaleString()} VND. Vui lòng nạp tiền trước khi đăng ký.`
        )
      }

      // Sử dụng transaction để đảm bảo tính nhất quán
      const paymentResult = await this.prisma.$transaction(async tx => {
        // Trừ tiền từ tài khoản
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              decrement: plan.price,
            },
          },
        })

        // Tạo payment transaction
        const payment = await tx.paymentTransaction.create({
          data: {
            userId,
            gateway: 'internal',
            amountOut: plan.price,
            transactionContent: `Thanh toán ${plan.name}`,
            referenceNumber: `SUB_${userId}_${Date.now()}`,
          },
        })

        return payment
      })

      paymentId = paymentResult.id
    }

    const subscription = await this.prisma.landlordSubscription.create({
      data: {
        userId,
        planType: dto.planType || 'BASIC',
        planId,
        startDate,
        endDate,
        amount: plan.price,
        isFreeTrial: plan.isFreeTrial || false,
        autoRenew: dto.autoRenew || true,
        status: SubscriptionStatus.ACTIVE,
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
      },
    })

    // Ghi lại lịch sử
    await this.createSubscriptionHistory(
      subscription.id,
      'CREATED',
      undefined,
      SubscriptionStatus.ACTIVE,
      Number(subscription.amount),
      paymentId,
      plan.isFreeTrial
        ? `Tạo subscription miễn phí: ${plan.name}`
        : `Tạo subscription trả phí: ${plan.name} - Đã trừ ${plan.price.toLocaleString()} VND từ tài khoản`,
      subscription.planType,
      planId
    )

    return subscription
  }

  /**
   * Gia hạn subscription
   */
  async renewSubscription(
    userId: number,
    paymentId?: number
  ): Promise<LandlordSubscription> {
    const subscription = await this.getActiveSubscription(userId)
    if (!subscription) {
      throw new NotFoundException('Không tìm thấy subscription đang hoạt động')
    }

    const monthlyFee = await this.getSystemSetting(
      'landlord_subscription_monthly_fee',
      299000
    )

    // Kiểm tra số dư và xử lý thanh toán nếu chưa có paymentId
    let finalPaymentId = paymentId
    if (!paymentId) {
      // Kiểm tra số dư tài khoản
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      })

      if (!user) {
        throw new NotFoundException('Không tìm thấy thông tin người dùng')
      }

      if (user.balance < monthlyFee) {
        throw new BadRequestException(
          `Số dư tài khoản không đủ để gia hạn. Cần ${monthlyFee.toLocaleString()} VND, hiện có ${user.balance.toLocaleString()} VND. Vui lòng nạp tiền trước khi gia hạn.`
        )
      }

      // Xử lý thanh toán
      const paymentResult = await this.prisma.$transaction(async tx => {
        // Trừ tiền từ tài khoản
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              decrement: monthlyFee,
            },
          },
        })

        // Tạo payment transaction
        const payment = await tx.paymentTransaction.create({
          data: {
            userId,
            gateway: 'internal',
            amountOut: monthlyFee,
            transactionContent: 'Gia hạn subscription hàng tháng',
            referenceNumber: `RENEW_${userId}_${Date.now()}`,
          },
        })

        return payment
      })

      finalPaymentId = paymentResult.id
    }

    const newEndDate = new Date(subscription.endDate)
    newEndDate.setMonth(newEndDate.getMonth() + 1)

    const updatedSubscription = await this.prisma.landlordSubscription.update({
      where: { id: subscription.id },
      data: {
        endDate: newEndDate,
        amount: monthlyFee,
        isFreeTrial: false,
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
      },
    })

    // Ghi lại lịch sử
    await this.createSubscriptionHistory(
      subscription.id,
      'RENEWED',
      subscription.status,
      SubscriptionStatus.ACTIVE,
      monthlyFee,
      finalPaymentId,
      finalPaymentId === paymentId
        ? 'Gia hạn subscription (thanh toán bên ngoài)'
        : `Gia hạn subscription - Đã trừ ${monthlyFee.toLocaleString()} VND từ tài khoản`,
      undefined, // planType
      undefined // planId
    )

    return updatedSubscription
  }

  /**
   * Tạm dừng subscription
   */
  async suspendSubscription(
    userId: number,
    reason?: string
  ): Promise<LandlordSubscription> {
    const subscription = await this.getActiveSubscription(userId)
    if (!subscription) {
      throw new NotFoundException('Không tìm thấy subscription đang hoạt động')
    }

    const updatedSubscription = await this.prisma.landlordSubscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.SUSPENDED,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Ghi lại lịch sử
    await this.createSubscriptionHistory(
      subscription.id,
      'SUSPENDED',
      subscription.status,
      SubscriptionStatus.SUSPENDED,
      undefined,
      undefined,
      reason || 'Tạm dừng subscription',
      undefined,
      undefined
    )

    return updatedSubscription
  }

  /**
   * Hủy subscription
   */
  async cancelSubscription(
    userId: number,
    reason?: string
  ): Promise<LandlordSubscription> {
    const subscription = await this.getActiveSubscription(userId)
    if (!subscription) {
      throw new NotFoundException('Không tìm thấy subscription đang hoạt động')
    }

    const updatedSubscription = await this.prisma.landlordSubscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELED,
        autoRenew: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Ghi lại lịch sử
    await this.createSubscriptionHistory(
      subscription.id,
      'CANCELED',
      subscription.status,
      SubscriptionStatus.CANCELED,
      undefined,
      undefined,
      reason || 'Hủy subscription',
      undefined,
      undefined
    )

    return updatedSubscription
  }

  /**
   * Lấy subscription active của user
   */
  async getActiveSubscription(
    userId: number
  ): Promise<LandlordSubscription | null> {
    return this.prisma.landlordSubscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Kiểm tra xem landlord có quyền truy cập trang cho thuê không
   */
  async checkLandlordAccess(userId: number): Promise<{
    hasAccess: boolean
    subscription?: LandlordSubscription
    message?: string
    canUseFreeTrialAgain?: boolean
    hasUsedFreeTrial?: boolean
  }> {
    const subscriptionEnabled = await this.getSystemSetting(
      'landlord_subscription_enabled',
      true
    )

    // Kiểm tra lịch sử free trial
    const hasUsedFreeTrial = await this.hasUserUsedFreeTrial(userId)

    // Nếu subscription bị tắt, cho phép truy cập
    if (!subscriptionEnabled) {
      return {
        hasAccess: true,
        hasUsedFreeTrial,
        canUseFreeTrialAgain: !hasUsedFreeTrial,
      }
    }

    const subscription = await this.getActiveSubscription(userId)

    if (!subscription) {
      return {
        hasAccess: false,
        message:
          'Bạn cần đăng ký gói subscription để sử dụng tính năng cho thuê',
        hasUsedFreeTrial,
        canUseFreeTrialAgain: !hasUsedFreeTrial,
      }
    }

    // Kiểm tra hết hạn
    const now = new Date()
    const gracePeriodDays = await this.getSystemSetting(
      'landlord_subscription_grace_period_days',
      7
    )
    const gracePeriodEnd = new Date(subscription.endDate)
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays)

    if (now > gracePeriodEnd) {
      // Cập nhật status thành EXPIRED
      await this.prisma.landlordSubscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.EXPIRED },
      })

      return {
        hasAccess: false,
        subscription,
        message:
          'Subscription đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng',
        hasUsedFreeTrial,
        canUseFreeTrialAgain: !hasUsedFreeTrial,
      }
    }

    if (subscription.status === SubscriptionStatus.SUSPENDED) {
      return {
        hasAccess: false,
        subscription,
        message: 'Subscription đã bị tạm dừng. Vui lòng liên hệ admin',
        hasUsedFreeTrial,
        canUseFreeTrialAgain: !hasUsedFreeTrial,
      }
    }

    return {
      hasAccess: true,
      subscription,
      hasUsedFreeTrial,
      canUseFreeTrialAgain: !hasUsedFreeTrial,
    }
  }

  /**
   * Lấy lịch sử subscription
   */
  async getSubscriptionHistory(userId: number, subscriptionId?: number) {
    const whereClause: any = {}

    if (subscriptionId) {
      whereClause.subscriptionId = subscriptionId
    } else {
      // Lấy tất cả subscription của user
      const subscriptions = await this.prisma.landlordSubscription.findMany({
        where: { userId },
        select: { id: true },
      })
      whereClause.subscriptionId = {
        in: subscriptions.map(s => s.id),
      }
    }

    return this.prisma.subscriptionHistory.findMany({
      where: whereClause,
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Cron job để kiểm tra và cập nhật subscription hết hạn
   */
  async checkExpiredSubscriptions() {
    const now = new Date()

    const expiredSubscriptions =
      await this.prisma.landlordSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          endDate: {
            lt: now,
          },
        },
      })

    for (const subscription of expiredSubscriptions) {
      await this.prisma.landlordSubscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.EXPIRED },
      })

      // Ghi lại lịch sử
      await this.createSubscriptionHistory(
        subscription.id,
        'EXPIRED',
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.EXPIRED,
        undefined,
        undefined,
        'Subscription hết hạn (auto-check)',
        undefined,
        undefined
      )
    }

    return expiredSubscriptions.length
  }

  /**
   * Kiểm tra xem user có đủ điều kiện đăng ký subscription không
   */
  async checkSubscriptionEligibility(userId: number): Promise<{
    canSubscribe: boolean
    canUseFreeTrialAgain: boolean
    hasActiveSubscription: boolean
    message?: string
  }> {
    // Kiểm tra subscription hiện tại
    const activeSubscription = await this.getActiveSubscription(userId)

    if (activeSubscription) {
      return {
        canSubscribe: false,
        canUseFreeTrialAgain: false,
        hasActiveSubscription: true,
        message: 'Bạn đã có subscription đang hoạt động',
      }
    }

    // Kiểm tra lịch sử free trial
    const hasUsedFreeTrial = await this.hasUserUsedFreeTrial(userId)

    return {
      canSubscribe: true,
      canUseFreeTrialAgain: !hasUsedFreeTrial,
      hasActiveSubscription: false,
      message: hasUsedFreeTrial
        ? 'Bạn đã sử dụng gói dùng thử miễn phí. Chỉ có thể đăng ký gói trả phí.'
        : 'Bạn có thể đăng ký gói miễn phí hoặc trả phí.',
    }
  }

  // ============ ADMIN METHODS ============

  /**
   * [ADMIN] Lấy danh sách tất cả subscription với phân trang và lọc
   */
  async getAllSubscriptions(filters: {
    page?: number
    limit?: number
    search?: string
    status?: string
    planType?: string
  }) {
    const { page = 1, limit = 10, search, status, planType } = filters

    const skip = (page - 1) * limit
    const whereClause: any = {}

    // Filter by search (name or email)
    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    // Filter by status
    if (status) {
      whereClause.status = status
    }

    // Filter by plan type
    if (planType) {
      whereClause.planType = planType
    }

    const [data, totalItems] = await Promise.all([
      this.prisma.landlordSubscription.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.landlordSubscription.count({
        where: whereClause,
      }),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    return {
      data,
      totalItems,
      totalPages,
      currentPage: page,
    }
  }

  /**
   * [ADMIN] Lấy thống kê subscription
   */
  async getSubscriptionStats() {
    const [
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      suspendedSubscriptions,
      canceledSubscriptions,
      freeTrialUsers,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.landlordSubscription.count(),
      this.prisma.landlordSubscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.landlordSubscription.count({
        where: { status: SubscriptionStatus.EXPIRED },
      }),
      this.prisma.landlordSubscription.count({
        where: { status: SubscriptionStatus.SUSPENDED },
      }),
      this.prisma.landlordSubscription.count({
        where: { status: SubscriptionStatus.CANCELED },
      }),
      this.prisma.landlordSubscription.count({
        where: { isFreeTrial: true },
      }),
      this.prisma.landlordSubscription.aggregate({
        where: {
          status: SubscriptionStatus.ACTIVE,
          isFreeTrial: false,
        },
        _sum: {
          amount: true,
        },
      }),
    ])

    return {
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      suspendedSubscriptions,
      canceledSubscriptions,
      freeTrialUsers,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      revenueGrowth: 0, // TODO: Calculate growth
      subscriptionGrowth: 0, // TODO: Calculate growth
    }
  }

  /**
   * [ADMIN] Lấy chi tiết subscription
   */
  async getSubscriptionDetail(subscriptionId: number) {
    const subscription = await this.prisma.landlordSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!subscription) {
      throw new NotFoundException('Không tìm thấy subscription')
    }

    return subscription
  }

  /**
   * [ADMIN] Tạm dừng subscription
   */
  async adminSuspendSubscription(subscriptionId: number, reason?: string) {
    const subscription = await this.getSubscriptionDetail(subscriptionId)

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        'Chỉ có thể tạm dừng subscription đang hoạt động'
      )
    }

    const updatedSubscription = await this.prisma.landlordSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.SUSPENDED,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Ghi lại lịch sử
    await this.createSubscriptionHistory(
      subscriptionId,
      'ADMIN_SUSPENDED',
      subscription.status,
      SubscriptionStatus.SUSPENDED,
      undefined,
      undefined,
      reason || 'Admin tạm dừng subscription',
      undefined,
      undefined
    )

    return updatedSubscription
  }

  /**
   * [ADMIN] Kích hoạt lại subscription
   */
  async adminReactivateSubscription(subscriptionId: number) {
    const subscription = await this.getSubscriptionDetail(subscriptionId)

    if (subscription.status !== SubscriptionStatus.SUSPENDED) {
      throw new BadRequestException(
        'Chỉ có thể kích hoạt lại subscription đang tạm dừng'
      )
    }

    const updatedSubscription = await this.prisma.landlordSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Ghi lại lịch sử
    await this.createSubscriptionHistory(
      subscriptionId,
      'ADMIN_REACTIVATED',
      subscription.status,
      SubscriptionStatus.ACTIVE,
      undefined,
      undefined,
      'Admin kích hoạt lại subscription',
      undefined,
      undefined
    )

    return updatedSubscription
  }

  /**
   * [ADMIN] Hủy subscription
   */
  async adminCancelSubscription(subscriptionId: number, reason?: string) {
    const subscription = await this.getSubscriptionDetail(subscriptionId)

    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('Subscription đã được hủy')
    }

    const updatedSubscription = await this.prisma.landlordSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELED,
        autoRenew: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Ghi lại lịch sử
    await this.createSubscriptionHistory(
      subscriptionId,
      'ADMIN_CANCELED',
      subscription.status,
      SubscriptionStatus.CANCELED,
      undefined,
      undefined,
      reason || 'Admin hủy subscription',
      undefined,
      undefined
    )

    return updatedSubscription
  }

  /**
   * [ADMIN] Gia hạn subscription (admin override)
   */
  async adminRenewSubscription(subscriptionId: number, months: number = 1) {
    const subscription = await this.getSubscriptionDetail(subscriptionId)

    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('Không thể gia hạn subscription đã hủy')
    }

    const monthlyFee = await this.getSystemSetting(
      'landlord_subscription_monthly_fee',
      299000
    )

    const newEndDate = new Date(subscription.endDate)
    newEndDate.setMonth(newEndDate.getMonth() + months)

    const updatedSubscription = await this.prisma.landlordSubscription.update({
      where: { id: subscriptionId },
      data: {
        endDate: newEndDate,
        status: SubscriptionStatus.ACTIVE,
        isFreeTrial: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Ghi lại lịch sử
    await this.createSubscriptionHistory(
      subscriptionId,
      'ADMIN_RENEWED',
      subscription.status,
      SubscriptionStatus.ACTIVE,
      monthlyFee * months,
      undefined,
      `Admin gia hạn subscription ${months} tháng`,
      undefined,
      undefined
    )

    return updatedSubscription
  }

  /**
   * [ADMIN] Lấy lịch sử subscription
   */
  async getAdminSubscriptionHistory(
    subscriptionId: number,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit

    const [data, totalItems] = await Promise.all([
      this.prisma.subscriptionHistory.findMany({
        where: {
          subscriptionId,
        },
        include: {
          subscription: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          payment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.subscriptionHistory.count({
        where: {
          subscriptionId,
        },
      }),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    return {
      data,
      totalItems,
      totalPages,
      currentPage: page,
    }
  }

  /**
   * Hàm tiện ích để tạo subscription history
   */
  private async createSubscriptionHistory(
    subscriptionId: number,
    action: string,
    previousStatus?: SubscriptionStatus,
    newStatus?: SubscriptionStatus,
    amount?: number,
    paymentId?: number,
    note?: string,
    planType?: string | null,
    planId?: string | null
  ) {
    return this.prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        action,
        previousStatus,
        newStatus,
        amount,
        paymentId,
        note,
        planType,
        planId,
      },
    })
  }

  /**
   * Lấy tất cả gói subscription có sẵn
   */
  async getAvailableSubscriptionPlans(): Promise<any[]> {
    const plansJson = await this.getSystemSetting('subscription_plans', '[]')

    try {
      const plans = JSON.parse(plansJson)
      // Chỉ trả về các gói đang active
      return plans.filter((plan: any) => plan.isActive === true)
    } catch (error) {
      console.error('Error parsing subscription plans:', error)
      // Fallback to default plans if JSON is invalid
      return [
        {
          id: 'free_trial',
          name: 'Dùng thử miễn phí',
          price: 0,
          duration: 30,
          durationType: 'days',
          isFreeTrial: true,
          isActive: true,
        },
        {
          id: 'basic_monthly',
          name: 'Gói cơ bản',
          price: 299000,
          duration: 1,
          durationType: 'months',
          isFreeTrial: false,
          isActive: true,
        },
      ]
    }
  }

  /**
   * Lấy thông tin gói subscription theo ID
   */
  async getSubscriptionPlanById(planId: string): Promise<any | null> {
    const plans = await this.getAvailableSubscriptionPlans()
    return plans.find(plan => plan.id === planId) || null
  }

  /**
   * [ADMIN] Cập nhật danh sách subscription plans
   */
  async updateSubscriptionPlans(plans: any[]): Promise<any[]> {
    // Validate plans
    const validatedPlans = plans.map((plan, index) => {
      if (!plan.id || !plan.name || plan.price < 0) {
        throw new BadRequestException(
          `Plan tại vị trí ${index} có dữ liệu không hợp lệ`
        )
      }
      return plan
    })

    // Update SystemSetting
    await this.prisma.systemSetting.upsert({
      where: { key: 'subscription_plans' },
      update: {
        value: JSON.stringify(validatedPlans),
      },
      create: {
        key: 'subscription_plans',
        value: JSON.stringify(validatedPlans),
        type: 'json',
        group: 'PRICING',
        description: 'Cấu hình các gói subscription cho landlord',
      },
    })

    return validatedPlans
  }

  /**
   * [ADMIN] Thêm gói subscription mới
   */
  async addSubscriptionPlan(newPlan: any): Promise<any[]> {
    const currentPlans = await this.getAvailableSubscriptionPlans()

    // Kiểm tra trùng ID
    if (currentPlans.some(plan => plan.id === newPlan.id)) {
      throw new ConflictException(`Gói với ID "${newPlan.id}" đã tồn tại`)
    }

    const updatedPlans = [...currentPlans, newPlan]
    return this.updateSubscriptionPlans(updatedPlans)
  }

  /**
   * [ADMIN] Cập nhật gói subscription
   */
  async updateSubscriptionPlan(
    planId: string,
    updatedPlan: any
  ): Promise<any[]> {
    const currentPlans = await this.getAvailableSubscriptionPlans()

    const planIndex = currentPlans.findIndex(plan => plan.id === planId)
    if (planIndex === -1) {
      throw new NotFoundException(`Không tìm thấy gói với ID "${planId}"`)
    }

    currentPlans[planIndex] = {
      ...currentPlans[planIndex],
      ...updatedPlan,
      id: planId,
    }
    return this.updateSubscriptionPlans(currentPlans)
  }

  /**
   * [ADMIN] Xóa gói subscription
   */
  async deleteSubscriptionPlan(planId: string): Promise<any[]> {
    const currentPlans = await this.getAvailableSubscriptionPlans()

    const planIndex = currentPlans.findIndex(plan => plan.id === planId)
    if (planIndex === -1) {
      throw new NotFoundException(`Không tìm thấy gói với ID "${planId}"`)
    }

    // Kiểm tra xem có subscription nào đang sử dụng plan này không
    const subscriptionsUsingPlan = await this.prisma.landlordSubscription.count(
      {
        where: {
          planId,
          status: 'ACTIVE',
        },
      }
    )

    if (subscriptionsUsingPlan > 0) {
      throw new ConflictException(
        `Không thể xóa gói này vì có ${subscriptionsUsingPlan} subscription đang sử dụng`
      )
    }

    currentPlans.splice(planIndex, 1)
    return this.updateSubscriptionPlans(currentPlans)
  }

  /**
   * [ADMIN] Lấy tất cả subscription plans (bao gồm cả inactive)
   */
  async getAllSubscriptionPlans(): Promise<any[]> {
    const plansJson = await this.getSystemSetting('subscription_plans', '[]')

    try {
      return JSON.parse(plansJson)
    } catch (error) {
      console.error('Error parsing subscription plans:', error)
      return []
    }
  }

  /**
   * Hàm tiện ích để lấy system setting
   */
  private async getSystemSetting(key: string, defaultValue: any) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    })

    if (!setting) return defaultValue

    switch (setting.type) {
      case 'boolean':
        return setting.value === 'true'
      case 'number':
        return parseInt(setting.value, 10)
      case 'json':
        try {
          return JSON.parse(setting.value)
        } catch {
          return defaultValue
        }
      default:
        return setting.value
    }
  }
}
