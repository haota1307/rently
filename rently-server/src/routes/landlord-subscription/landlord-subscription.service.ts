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
import { Cron } from '@nestjs/schedule'
import { Logger } from '@nestjs/common'
import { EmailService } from 'src/shared/services/email.service'

@Injectable()
export class LandlordSubscriptionService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

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
    // Kiểm tra user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, balance: true },
    })

    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại')
    }

    // Kiểm tra xem người dùng đã có subscription active chưa
    const existingSubscription =
      await this.prisma.landlordSubscription.findFirst({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },
      })

    if (existingSubscription) {
      // Nếu đã có subscription, hiển thị thông báo lỗi
      throw new BadRequestException(
        'Bạn đã có gói subscription đang hoạt động. Vui lòng hủy gói hiện tại trước khi đăng ký gói mới.'
      )
    }

    let paymentId = undefined // Khởi tạo là undefined thay vì number | undefined

    // Lấy thông tin plan
    let planId = dto.planId
    if (!planId) {
      // Fallback to default plan if planId is not provided
      planId = dto.isFreeTrial ? 'free_trial' : 'monthly'
    }

    // Lấy thông tin plan từ cơ sở dữ liệu
    const plan = await this.getSubscriptionPlanById(planId)

    if (!plan) {
      throw new BadRequestException(`Gói subscription không tồn tại: ${planId}`)
    }

    // Kiểm tra nếu đây là gói dùng thử và người dùng đã từng dùng thử
    if (plan.isFreeTrial) {
      const hasUsedFreeTrial = await this.hasUserUsedFreeTrial(userId)
      if (hasUsedFreeTrial) {
        throw new BadRequestException(
          'Bạn đã sử dụng gói dùng thử miễn phí. Vui lòng chọn gói trả phí.'
        )
      }
    }

    // Tính toán ngày bắt đầu và kết thúc
    const startDate = new Date()
    let endDate = new Date()

    // Tính ngày kết thúc dựa trên duration và durationType của plan
    if (plan.durationType === 'days') {
      endDate.setDate(endDate.getDate() + plan.duration)
    } else if (plan.durationType === 'months') {
      endDate.setMonth(endDate.getMonth() + plan.duration)
    } else if (plan.durationType === 'years') {
      endDate.setFullYear(endDate.getFullYear() + plan.duration)
    } else {
      // Fallback nếu durationType không hợp lệ
      endDate.setMonth(endDate.getMonth() + 1) // Default: 1 tháng
    }

    // Chuẩn bị các dữ liệu cần thiết
    const subscriptionData = {
      userId,
      planType: dto.planType || 'BASIC',
      planId,
      startDate,
      endDate,
      amount: plan.price,
      isFreeTrial: plan.isFreeTrial || false,
      autoRenew: dto.autoRenew || true,
      status: SubscriptionStatus.ACTIVE,
    }

    let subscription
    let paymentTransaction

    // Thực hiện các thao tác trong transaction để đảm bảo tính nhất quán
    try {
      if (!plan.isFreeTrial) {
        // Kiểm tra số dư
        const price = Number(plan.price)
        if (user.balance < price) {
          throw new BadRequestException(
            `Số dư tài khoản không đủ để đăng ký gói. Cần ${price} VND, có ${user.balance} VND`
          )
        }

        // Sử dụng transaction để đảm bảo tính nhất quán của dữ liệu
        const result = await this.prisma.$transaction(async tx => {
          // 1. Tạo payment transaction
          const payment = await tx.paymentTransaction.create({
            data: {
              userId,
              gateway: 'internal',
              amountOut: price,
              transactionContent: `Thanh toán subscription: ${plan.name}`,
              referenceNumber: `SUB_${userId}_${Date.now()}`,
            },
          })

          // 2. Trừ tiền từ tài khoản
          await tx.user.update({
            where: { id: userId },
            data: {
              balance: {
                decrement: price,
              },
            },
          })

          // 3. Tạo subscription
          const newSubscription = await tx.landlordSubscription.create({
            data: subscriptionData,
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

          // 4. Tạo history trực tiếp trong transaction
          await tx.subscriptionHistory.create({
            data: {
              subscriptionId: newSubscription.id,
              action: 'CREATED',
              newStatus: SubscriptionStatus.ACTIVE,
              amount: Number(newSubscription.amount),
              note: plan.isFreeTrial
                ? `Tạo subscription miễn phí: ${plan.name}`
                : `Tạo subscription trả phí: ${plan.name} - Đã trừ ${plan.price.toLocaleString()} VND từ tài khoản`,
              planType: newSubscription.planType,
              planId,
            },
          })

          return {
            subscription: newSubscription,
            payment,
          }
        })

        subscription = result.subscription
        paymentTransaction = result.payment
      } else {
        // Với gói miễn phí, không cần transaction phức tạp
        // Tạo subscription
        subscription = await this.prisma.landlordSubscription.create({
          data: subscriptionData,
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

        // Ghi lại lịch sử trực tiếp
        await this.prisma.subscriptionHistory.create({
          data: {
            subscriptionId: subscription.id,
            action: 'CREATED',
            newStatus: SubscriptionStatus.ACTIVE,
            amount: Number(subscription.amount),
            note: `Tạo subscription miễn phí: ${plan.name}`,
            planType: subscription.planType,
            planId,
          },
        })
      }

      return subscription
    } catch (error) {
      console.error('Lỗi khi tạo subscription:', error)
      throw new BadRequestException(
        error.message || 'Không thể tạo subscription. Vui lòng thử lại.'
      )
    }
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
   * Cập nhật trạng thái tự động gia hạn subscription
   */
  async toggleAutoRenew(
    userId: number,
    autoRenew: boolean
  ): Promise<LandlordSubscription> {
    const subscription = await this.getActiveSubscription(userId)
    if (!subscription) {
      throw new NotFoundException('Không tìm thấy subscription đang hoạt động')
    }

    const updatedSubscription = await this.prisma.landlordSubscription.update({
      where: { id: subscription.id },
      data: {
        autoRenew,
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
      autoRenew ? 'AUTO_RENEW_ENABLED' : 'AUTO_RENEW_DISABLED',
      subscription.status,
      subscription.status,
      undefined,
      undefined,
      autoRenew
        ? 'Đã bật tự động gia hạn subscription'
        : 'Đã tắt tự động gia hạn subscription',
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
  @Cron('0 0 * * *') // Chạy vào 0 giờ sáng hàng ngày
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
   * Cron job để tự động gia hạn các subscription có autoRenew=true
   */
  @Cron('0 1 * * *') // Chạy vào 1 giờ sáng hàng ngày
  async autoRenewSubscriptions() {
    const logger = new Logger('AutoRenewSubscriptions')
    logger.log('Bắt đầu tự động gia hạn subscription...')

    // Lấy ngày hiện tại
    const now = new Date()

    // Lấy ngày sau 1 ngày (tự động gia hạn trước khi hết hạn 1 ngày)
    const oneDayLater = new Date(now)
    oneDayLater.setDate(oneDayLater.getDate() + 1)

    // Lấy danh sách subscription cần gia hạn (sắp hết hạn trong 1 ngày và có autoRenew=true)
    const subscriptionsToRenew =
      await this.prisma.landlordSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          autoRenew: true,
          endDate: {
            gte: now,
            lte: oneDayLater,
          },
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
          plan: true, // Lấy thêm thông tin về plan
        },
      })

    logger.log(
      `Tìm thấy ${subscriptionsToRenew.length} subscription cần tự động gia hạn`
    )

    // Lấy phí hàng tháng từ system setting
    const monthlyFee = await this.getSystemSetting(
      'landlord_subscription_monthly_fee',
      299000
    )

    // Xử lý từng subscription
    for (const subscription of subscriptionsToRenew) {
      try {
        // Kiểm tra số dư tài khoản
        if (!subscription.user || subscription.user.balance < monthlyFee) {
          logger.warn(
            `Không thể gia hạn subscription ID ${subscription.id} - Số dư không đủ: ${subscription.user?.balance || 0}`
          )

          // Ghi lại lịch sử về việc không thể gia hạn do số dư không đủ
          await this.createSubscriptionHistory(
            subscription.id,
            'AUTO_RENEW_FAILED',
            subscription.status,
            subscription.status,
            monthlyFee,
            undefined,
            'Không thể tự động gia hạn do số dư không đủ',
            undefined,
            undefined
          )

          continue
        }

        // Xử lý thanh toán và gia hạn
        logger.log(
          `Gia hạn subscription ID ${subscription.id} cho user ${subscription.userId}`
        )

        let newEndDate = new Date(subscription.endDate)
        let paymentId: number | null = null
        let newBalance = subscription.user.balance

        // Thực hiện giao dịch để đảm bảo tính nhất quán
        const result = await this.prisma.$transaction(async tx => {
          // Trừ tiền từ tài khoản
          const updatedUser = await tx.user.update({
            where: { id: subscription.userId },
            data: {
              balance: {
                decrement: monthlyFee,
              },
            },
            select: {
              balance: true,
            },
          })

          // Tạo payment transaction
          const payment = await tx.paymentTransaction.create({
            data: {
              userId: subscription.userId,
              gateway: 'internal',
              amountOut: monthlyFee,
              transactionContent: 'Tự động gia hạn subscription hàng tháng',
              referenceNumber: `AUTO_RENEW_${subscription.userId}_${Date.now()}`,
            },
          })

          // Cập nhật ngày hết hạn của subscription
          newEndDate.setMonth(newEndDate.getMonth() + 1)

          const updatedSubscription = await tx.landlordSubscription.update({
            where: { id: subscription.id },
            data: {
              endDate: newEndDate,
              amount: monthlyFee,
            },
          })

          // Ghi lại lịch sử
          await this.createSubscriptionHistory(
            subscription.id,
            'AUTO_RENEWED',
            subscription.status,
            SubscriptionStatus.ACTIVE,
            monthlyFee,
            payment.id,
            'Tự động gia hạn subscription hàng tháng',
            subscription.planType,
            subscription.planId
          )

          return {
            user: updatedUser,
            subscription: updatedSubscription,
            paymentId: payment.id,
          }
        })

        newBalance = result.user.balance
        paymentId = result.paymentId

        // Gửi email thông báo cho người dùng
        if (subscription.user.email) {
          try {
            await this.emailService.sendAutoRenewNotification({
              email: subscription.user.email,
              userName: subscription.user.name,
              planName: subscription.plan?.name || subscription.planType,
              amount: monthlyFee,
              newEndDate,
              autoRenewStatus: subscription.autoRenew,
              balance: newBalance,
            })

            logger.log(
              `Đã gửi email thông báo tự động gia hạn cho ${subscription.user.email}`
            )
          } catch (emailError) {
            logger.error(`Lỗi khi gửi email thông báo: ${emailError.message}`)
          }
        }
      } catch (error) {
        logger.error(
          `Lỗi khi tự động gia hạn subscription ID ${subscription.id}: ${error.message}`
        )
      }
    }

    logger.log('Kết thúc quá trình tự động gia hạn subscription')
    return subscriptionsToRenew.length
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

    try {
      // Tìm và cập nhật trạng thái các subscription SUSPENDED cũ của user này
      // để tránh xung đột ràng buộc duy nhất
      await this.prisma.landlordSubscription.updateMany({
        where: {
          userId: subscription.userId,
          status: SubscriptionStatus.SUSPENDED,
          id: { not: subscriptionId },
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
        },
      })

      const updatedSubscription = await this.prisma.landlordSubscription.update(
        {
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
        }
      )

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
    } catch (error) {
      console.error('Lỗi khi tạm dừng subscription:', error)
      throw new BadRequestException(
        'Không thể tạm dừng subscription. Vui lòng thử lại sau.'
      )
    }
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

    try {
      // Tìm và cập nhật trạng thái các subscription ACTIVE cũ của user này
      // để tránh xung đột ràng buộc duy nhất
      await this.prisma.landlordSubscription.updateMany({
        where: {
          userId: subscription.userId,
          status: SubscriptionStatus.ACTIVE,
          id: { not: subscriptionId },
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
        },
      })

      const updatedSubscription = await this.prisma.landlordSubscription.update(
        {
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
        }
      )

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
    } catch (error) {
      console.error('Lỗi khi kích hoạt lại subscription:', error)
      throw new BadRequestException(
        'Không thể kích hoạt lại subscription. Vui lòng thử lại sau.'
      )
    }
  }

  /**
   * [ADMIN] Hủy subscription
   */
  async adminCancelSubscription(subscriptionId: number, reason?: string) {
    const subscription = await this.getSubscriptionDetail(subscriptionId)

    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('Subscription đã được hủy')
    }

    try {
      // Tìm và cập nhật trạng thái các subscription CANCELED cũ của user này
      // để tránh xung đột ràng buộc duy nhất
      await this.prisma.landlordSubscription.updateMany({
        where: {
          userId: subscription.userId,
          status: SubscriptionStatus.CANCELED,
          id: { not: subscriptionId },
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
        },
      })

      const updatedSubscription = await this.prisma.landlordSubscription.update(
        {
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
        }
      )

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
    } catch (error) {
      console.error('Lỗi khi hủy subscription:', error)
      throw new BadRequestException(
        'Không thể hủy subscription. Vui lòng thử lại sau.'
      )
    }
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
    // Kiểm tra xem paymentId có hợp lệ không trước khi tạo history
    if (paymentId !== undefined && paymentId !== null) {
      try {
        // Kiểm tra xem payment transaction có tồn tại không
        const payment = await this.prisma.paymentTransaction.findUnique({
          where: { id: paymentId },
        })

        if (!payment) {
          console.warn(
            `PaymentTransaction with ID ${paymentId} not found. Setting paymentId to null.`
          )
          paymentId = undefined // Không tồn tại payment, set thành undefined để tránh lỗi FK
        }
      } catch (error) {
        console.error(`Error checking payment: ${error}`)
        paymentId = undefined
      }
    }

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
    try {
      // Lấy từ bảng SubscriptionPlan, chỉ lấy các gói đang active
      const plans = await this.prisma.subscriptionPlan.findMany({
        where: {
          isActive: true,
        },
      })
      return plans
    } catch (error) {
      console.error('Error fetching subscription plans:', error)
      // Fallback to default plans if database access fails
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
    return this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })
  }

  /**
   * [ADMIN] Thêm gói subscription mới
   */
  async addSubscriptionPlan(plan: any): Promise<any> {
    return this.prisma.subscriptionPlan.create({
      data: {
        ...plan,
        features: plan.features || [],
      },
    })
  }

  /**
   * [ADMIN] Cập nhật gói subscription
   */
  async updateSubscriptionPlan(planId: string, updatedPlan: any): Promise<any> {
    // Kiểm tra xem gói có tồn tại không
    const existingPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!existingPlan) {
      throw new NotFoundException(`Không tìm thấy gói với ID "${planId}"`)
    }

    // Cập nhật gói
    return this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        ...updatedPlan,
        features:
          updatedPlan.features !== undefined
            ? updatedPlan.features
            : existingPlan.features,
      },
    })
  }

  /**
   * [ADMIN] Xóa gói subscription
   */
  async deleteSubscriptionPlan(planId: string): Promise<any> {
    // Kiểm tra xem gói có tồn tại không
    const existingPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!existingPlan) {
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

    // Xóa gói
    return this.prisma.subscriptionPlan.delete({
      where: { id: planId },
    })
  }

  /**
   * [ADMIN] Lấy tất cả subscription plans (bao gồm cả inactive)
   */
  async getAllSubscriptionPlans(): Promise<any[]> {
    return this.prisma.subscriptionPlan.findMany()
  }

  /**
   * [ADMIN] Cập nhật danh sách subscription plans
   */
  async updateSubscriptionPlans(plans: any[]): Promise<any[]> {
    // Sử dụng transaction để cập nhật toàn bộ danh sách
    await this.prisma.$transaction(async tx => {
      // Xóa tất cả các plan hiện tại
      await tx.subscriptionPlan.deleteMany({})

      // Thêm lại danh sách plan mới
      for (const plan of plans) {
        await tx.subscriptionPlan.create({
          data: {
            ...plan,
            features: plan.features || [],
          },
        })
      }
    })

    // Trả về danh sách plans sau khi cập nhật
    return this.prisma.subscriptionPlan.findMany()
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
