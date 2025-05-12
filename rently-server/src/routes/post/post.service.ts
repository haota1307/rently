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
} from 'src/routes/post/post.model'
import { PostRepo } from 'src/routes/post/post.repo'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RoleName } from 'src/shared/constants/role.constant'
import { Cron, CronExpression } from '@nestjs/schedule'

import { NotFoundRecordException } from 'src/shared/error'

@Injectable()
export class PostService {
  private POST_FEE = 10000 // Phí đăng bài: 10,000 VNĐ
  private readonly logger = new Logger(PostService.name)

  constructor(
    private readonly rentalPostRepo: PostRepo,
    private readonly prismaService: PrismaService
  ) {}

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
    // Kiểm tra thông tin người dùng, bao gồm số dư và vai trò
    const user = await this.prismaService.user.findUnique({
      where: { id: landlordId },
      include: {
        role: true,
      },
    })

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng')
    }

    // Kiểm tra xem người dùng có phải là admin hay không
    const isAdmin = user.role?.name === RoleName.Admin

    // Chỉ kiểm tra số dư và trừ phí nếu không phải là admin
    if (!isAdmin) {
      // Kiểm tra xem số dư có đủ để trừ phí đăng bài không
      if (user.balance < this.POST_FEE) {
        throw new BadRequestException(
          `Số dư tài khoản không đủ để đăng bài. Cần ít nhất ${this.POST_FEE} VNĐ. Vui lòng nạp thêm tiền vào tài khoản.`
        )
      }
    }

    // Kiểm tra ngày bắt đầu bài đăng
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0) // Đặt giờ về đầu ngày để so sánh chỉ theo ngày

    const startDate = new Date(data.startDate)
    startDate.setHours(0, 0, 0, 0)

    // Nếu ngày bắt đầu lớn hơn ngày hiện tại, thiết lập trạng thái là INACTIVE
    if (startDate > currentDate) {
      data.status = RentalPostStatus.INACTIVE
      this.logger.log(
        `Bài đăng được đặt trạng thái INACTIVE vì ngày bắt đầu (${startDate.toISOString()}) > ngày hiện tại (${currentDate.toISOString()})`
      )
    }

    // Thực hiện transaction để đảm bảo tính nhất quán của dữ liệu
    const result = await this.prismaService.$transaction(async prisma => {
      // Nếu không phải admin thì trừ phí và tạo bản ghi thanh toán
      if (!isAdmin) {
        // Trừ phí từ tài khoản người dùng
        await prisma.user.update({
          where: { id: landlordId },
          data: {
            balance: { decrement: this.POST_FEE },
          },
        })

        // Tạo bản ghi thanh toán
        await prisma.payment.create({
          data: {
            amount: this.POST_FEE,
            status: 'COMPLETED',
            description: 'Phí đăng bài',
            userId: landlordId,
          },
        })
      }

      // Tạo bài đăng mới
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
  }

  async getSimilarByPrice(postId: number, limit: number = 4) {
    // Lấy thông tin bài đăng
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

    // Tính toán phạm vi giá (+/- 20%)
    const originalPrice = post.room.price
    const minPrice = Math.floor(originalPrice * 0.8) // 20% thấp hơn
    const maxPrice = Math.ceil(originalPrice * 1.2) // 20% cao hơn

    // Lấy các bài đăng có giá tương tự
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
    // Lấy các bài đăng khác từ cùng một nhà trọ
    return this.rentalPostRepo.getSameRental({
      rentalId,
      excludePostId,
      limit,
    })
  }

  /**
   * Cron job chạy mỗi phút để cập nhật trạng thái các bài đăng đã hết hạn
   * Chỉ xử lý các bài đăng mà endDate nhỏ hơn thời gian hiện tại và vẫn còn ACTIVE
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async updateExpiredPosts() {
    try {
      this.logger.log('Bắt đầu cập nhật trạng thái các bài đăng đã hết hạn')

      // Lấy thời gian hiện tại UTC
      const now = new Date()

      // Tìm và cập nhật các bài đăng đã hết hạn và có trạng thái ACTIVE
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

      // Log chi tiết hơn để debug
      if (result.count > 0) {
        this.logger.log(
          `Đã cập nhật ${result.count} bài đăng hết hạn thành INACTIVE (thời gian hiện tại: ${now.toISOString()})`
        )
      } else {
        // Log thêm thông tin để debug
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

  /**
   * Cron job chạy mỗi phút để kích hoạt các bài đăng có startDate đến thời điểm hiện tại
   * Chỉ xử lý các bài đăng mà startDate <= thời gian hiện tại và status là INACTIVE
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async activateScheduledPosts() {
    try {
      this.logger.log('Bắt đầu kích hoạt các bài đăng đến thời điểm bắt đầu')

      // Lấy thời gian hiện tại
      const now = new Date()

      // Tìm và cập nhật các bài đăng có startDate <= thời gian hiện tại và có trạng thái INACTIVE
      const result = await this.prismaService.rentalPost.updateMany({
        where: {
          startDate: {
            lte: now,
          },
          endDate: {
            gt: now, // Đảm bảo bài đăng chưa hết hạn
          },
          status: 'INACTIVE',
        },
        data: {
          status: 'ACTIVE',
        },
      })

      // Log chi tiết kết quả
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
