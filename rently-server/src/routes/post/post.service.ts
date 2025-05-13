import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import {
  CreatePostBodyType,
  GetPostsQueryType,
  UpdatePostBodyType,
  RentalPostStatus,
  UpdatePostStatusType,
} from 'src/routes/post/post.model'
import { PostRepo } from 'src/routes/post/post.repo'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RoleName } from 'src/shared/constants/role.constant'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SystemSettingRepository } from 'src/shared/repositories/system-setting.repo'

import { NotFoundRecordException } from 'src/shared/error'

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name)

  constructor(
    private readonly rentalPostRepo: PostRepo,
    private readonly prismaService: PrismaService,
    private readonly systemSettingRepo: SystemSettingRepository
  ) {}

  private async getPostFee(): Promise<number> {
    try {
      const setting = await this.systemSettingRepo.findByKey('post_price')
      if (setting) {
        return parseInt(setting.value, 10)
      }
      return 10000
    } catch (error) {
      this.logger.error('Lỗi khi lấy giá đăng bài:', error)
      return 10000
    }
  }

  private async getPostDuration(): Promise<number> {
    try {
      const setting =
        await this.systemSettingRepo.findByKey('post_duration_days')
      if (setting) {
        return parseInt(setting.value, 10)
      }
      return 30
    } catch (error) {
      this.logger.error('Lỗi khi lấy thời hạn đăng bài:', error)
      return 30
    }
  }

  async list(pagination: GetPostsQueryType) {
    return this.rentalPostRepo.list(pagination)
  }

  async listByUserId(query: GetPostsQueryType, userId: number) {
    return this.rentalPostRepo.listByUserId(query, userId)
  }

  async findById(id: number) {
    const rentalPost = await this.rentalPostRepo.findById(id)
    if (!rentalPost) {
      throw NotFoundRecordException
    }
    return rentalPost
  }

  async create({
    data,
    landlordId,
  }: {
    data: CreatePostBodyType
    landlordId: number
  }) {
    const postFee = await this.getPostFee()

    const user = await this.prismaService.user.findUnique({
      where: { id: landlordId },
      include: {
        role: true,
      },
    })

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng')
    }

    const isAdmin = user.role?.name === RoleName.Admin

    if (!isAdmin) {
      if (user.balance < postFee) {
        throw new BadRequestException(
          `Số dư tài khoản không đủ để đăng bài. Cần ít nhất ${postFee} VNĐ. Vui lòng nạp thêm tiền vào tài khoản.`
        )
      }
    }

    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const startDate = new Date(data.startDate)
    startDate.setHours(0, 0, 0, 0)

    if (startDate > currentDate) {
      data.status = RentalPostStatus.INACTIVE
      this.logger.log(
        `Bài đăng được đặt trạng thái INACTIVE vì ngày bắt đầu (${startDate.toISOString()}) > ngày hiện tại (${currentDate.toISOString()})`
      )
    }

    const postDuration = await this.getPostDuration()

    if (!data.endDate) {
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + postDuration)
      data.endDate = endDate
    }

    const result = await this.prismaService.$transaction(async prisma => {
      if (!isAdmin) {
        await prisma.user.update({
          where: { id: landlordId },
          data: {
            balance: { decrement: postFee },
          },
        })

        await prisma.payment.create({
          data: {
            amount: postFee,
            status: 'COMPLETED',
            description: 'Phí đăng bài',
            userId: landlordId,
          },
        })
      }

      return this.rentalPostRepo.create({ data, landlordId })
    })

    return result
  }

  async update({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdatePostBodyType
    updatedById: number
  }) {
    try {
      return await this.rentalPostRepo.update({ id, data })
    } catch (error) {
      throw NotFoundRecordException
    }
  }

  async delete(id: number, userId: number) {
    const post = await this.rentalPostRepo.findById(id)

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng')
    }

    if (post.landlordId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bài đăng này')
    }

    await this.rentalPostRepo.delete({ id })

    return {
      message: 'Xóa bài đăng thành công',
    }
  }

  async updateStatus({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdatePostStatusType
    updatedById: number
  }) {
    const post = await this.rentalPostRepo.findById(id)
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng')
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: updatedById },
      include: { role: true },
    })

    if (
      post.landlordId !== updatedById &&
      user?.role?.name !== RoleName.Admin
    ) {
      throw new ForbiddenException('Bạn không có quyền cập nhật bài đăng này')
    }

    await this.prismaService.rentalPost.update({
      where: { id },
      data: { status: data.status as any },
    })

    return {
      message: `Cập nhật trạng thái bài đăng thành ${data.status} thành công`,
    }
  }

  async getSimilarByPrice(postId: number, limit: number = 4) {
    const post = await this.rentalPostRepo.findById(postId)

    if (!post || !post.room) {
      return {
        data: [],
        totalItems: 0,
        page: 1,
        limit,
        totalPages: 0,
      }
    }

    const originalPrice = post.room.price
    const minPrice = Math.floor(originalPrice * 0.8)
    const maxPrice = Math.ceil(originalPrice * 1.2)

    return this.rentalPostRepo.getSimilarByPrice({
      postId,
      minPrice,
      maxPrice,
      limit,
    })
  }

  async getSameRental(
    rentalId: number,
    excludePostId: number,
    limit: number = 4
  ) {
    return this.rentalPostRepo.getSameRental({
      rentalId,
      excludePostId,
      limit,
    })
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateExpiredPosts() {
    try {
      this.logger.log('Bắt đầu cập nhật trạng thái các bài đăng đã hết hạn')

      const now = new Date()

      const result = await this.prismaService.rentalPost.updateMany({
        where: {
          endDate: {
            lt: now,
          },
          status: 'ACTIVE',
        },
        data: {
          status: 'INACTIVE',
        },
      })

      if (result.count > 0) {
        this.logger.log(
          `Đã cập nhật ${result.count} bài đăng hết hạn thành INACTIVE (thời gian hiện tại: ${now.toISOString()})`
        )
      } else {
        const expiredPostsCount = await this.prismaService.rentalPost.count({
          where: {
            endDate: {
              lt: now,
            },
          },
        })

        this.logger.debug(
          `Không có bài đăng nào được cập nhật (thời gian hiện tại: ${now.toISOString()}). ` +
            `Tổng số bài đăng đã hết hạn: ${expiredPostsCount}`
        )
      }
    } catch (error) {
      this.logger.error(
        `Lỗi khi cập nhật bài đăng hết hạn: ${error.message}`,
        error.stack
      )
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async activateScheduledPosts() {
    try {
      this.logger.log('Bắt đầu kích hoạt các bài đăng đến thời điểm bắt đầu')

      const now = new Date()

      const result = await this.prismaService.rentalPost.updateMany({
        where: {
          startDate: {
            lte: now,
          },
          endDate: {
            gt: now,
          },
          status: 'INACTIVE',
        },
        data: {
          status: 'ACTIVE',
        },
      })

      if (result.count > 0) {
        this.logger.log(
          `Đã kích hoạt ${result.count} bài đăng thành ACTIVE (thời gian hiện tại: ${now.toISOString()})`
        )
      }
    } catch (error) {
      this.logger.error(
        `Lỗi khi kích hoạt bài đăng: ${error.message}`,
        error.stack
      )
    }
  }
}
