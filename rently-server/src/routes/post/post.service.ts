import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import {
  CreatePostBodyType,
  CreateBulkPostsBodyType,
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

    // Kiểm tra phòng đã có bài đăng active/inactive chưa
    const existingPost = await this.prismaService.rentalPost.findFirst({
      where: {
        roomId: data.roomId,
        status: { in: [RentalPostStatus.ACTIVE, RentalPostStatus.INACTIVE] },
      },
      include: {
        room: { select: { title: true } },
      },
    })

    if (existingPost) {
      throw new BadRequestException(
        `Phòng "${existingPost.room.title}" đã có bài đăng đang hoạt động. Mỗi phòng chỉ được có một bài đăng cùng lúc.`
      )
    }

    // Kiểm tra room có thuộc về landlord không
    const room = await this.prismaService.room.findFirst({
      where: {
        id: data.roomId,
        rental: {
          landlordId: landlordId,
        },
      },
    })

    if (!room) {
      throw new BadRequestException(
        'Phòng không tồn tại hoặc không thuộc về bạn'
      )
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

  async createBulk({
    data,
    landlordId,
  }: {
    data: CreateBulkPostsBodyType
    landlordId: number
  }) {
    const { roomIds, baseName, rentalId, ...postData } = data
    const postFee = await this.getPostFee()

    // Kiểm tra user và balance
    const user = await this.prismaService.user.findUnique({
      where: { id: landlordId },
      include: { role: true },
    })

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng')
    }

    const isAdmin = user.role?.name === RoleName.Admin
    const totalPostFee = postFee * roomIds.length

    if (!isAdmin && user.balance < totalPostFee) {
      throw new BadRequestException(
        `Số dư tài khoản không đủ để đăng ${roomIds.length} bài. Cần ít nhất ${totalPostFee} VNĐ. Vui lòng nạp thêm tiền vào tài khoản.`
      )
    }

    // Kiểm tra rental thuộc về landlord
    const rental = await this.prismaService.rental.findFirst({
      where: {
        id: rentalId,
        landlordId: landlordId,
      },
    })

    if (!rental) {
      throw new NotFoundException(
        'Nhà trọ không tồn tại hoặc không thuộc về bạn'
      )
    }

    // Kiểm tra tất cả rooms có tồn tại và thuộc về rental không
    const rooms = await this.prismaService.room.findMany({
      where: {
        id: { in: roomIds },
        rentalId: rentalId,
      },
    })

    if (rooms.length !== roomIds.length) {
      throw new BadRequestException(
        'Một số phòng không tồn tại hoặc không thuộc về nhà trọ được chọn'
      )
    }

    // Kiểm tra phòng đã có bài đăng chưa
    const existingPosts = await this.prismaService.rentalPost.findMany({
      where: {
        roomId: { in: roomIds },
        status: { in: [RentalPostStatus.ACTIVE, RentalPostStatus.INACTIVE] },
      },
    })

    if (existingPosts.length > 0) {
      const occupiedRoomIds = existingPosts.map(post => post.roomId)
      const occupiedRooms = rooms
        .filter(room => occupiedRoomIds.includes(room.id))
        .map(room => room.title)

      throw new BadRequestException(
        `Các phòng sau đã có bài đăng: ${occupiedRooms.join(', ')}`
      )
    }

    // Xử lý ngày tháng
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    const startDate = new Date(postData.startDate)
    startDate.setHours(0, 0, 0, 0)

    let status = postData.status || RentalPostStatus.ACTIVE
    if (startDate > currentDate) {
      status = RentalPostStatus.INACTIVE
    }

    const postDuration = await this.getPostDuration()
    if (!postData.endDate) {
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + postDuration)
      postData.endDate = endDate
    }

    // Xử lý payment trong transaction
    await this.prismaService.$transaction(async prisma => {
      if (!isAdmin) {
        await prisma.user.update({
          where: { id: landlordId },
          data: { balance: { decrement: totalPostFee } },
        })

        const payment = await prisma.payment.create({
          data: {
            amount: totalPostFee,
            status: 'COMPLETED',
            description: `Phí đăng ${roomIds.length} bài`,
            userId: landlordId,
          },
        })

        // Tạo paymentTransaction để ghi nhận giao dịch
        await prisma.paymentTransaction.create({
          data: {
            userId: landlordId,
            gateway: 'internal',
            amountOut: totalPostFee,
            transactionContent: `Thanh toán phí đăng ${roomIds.length} bài`,
            referenceNumber: `POST_FEE_${landlordId}_${Date.now()}`,
            payment: { connect: { id: payment.id } },
            code: 'POST_FEE',
          },
        })
      }
    })

    // Tạo bài đăng cho từng phòng
    const createdPosts: any[] = []
    for (const roomId of roomIds) {
      const room = rooms.find(r => r.id === roomId)
      if (room) {
        const rentalName = rental.title
        const title = `${baseName} ${room.title} - ${rentalName}`

        const createData = {
          title,
          description: postData.description,
          startDate: postData.startDate,
          endDate: postData.endDate,
          pricePaid: room.price?.toNumber() || 0, // Lấy giá từ phòng
          deposit: postData.deposit || 0,
          status,
          roomId,
          rentalId,
        } as CreatePostBodyType

        const post = await this.rentalPostRepo.create({
          data: createData,
          landlordId,
        })
        createdPosts.push(post)
      }
    }

    return {
      message: `Tạo thành công ${createdPosts.length} bài đăng`,
      createdPosts: createdPosts,
      totalCreated: createdPosts.length,
    }
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

  /**
   * Lấy danh sách bài đăng gần vị trí người dùng
   */
  async getNearbyPosts({
    lat,
    lng,
    limit = 5,
  }: {
    lat: number
    lng: number
    limit?: number
  }) {
    try {
      // Sử dụng Haversine formula để tính khoảng cách
      // Lưu ý: Prisma không hỗ trợ trực tiếp địa lý, nên cần tính toán trực tiếp
      interface NearbyPost {
        id: number
        title: string
        price: string | number
        address: string
        area: number
        distance: number
      }

      const nearbyPosts = await this.prismaService.$queryRaw<NearbyPost[]>`
        SELECT 
          rp.id, 
          rp.title, 
          room.price, 
          r.address,
          room.area,
          (
            6371 * acos(
              cos(radians(${lat})) * 
              cos(radians(CAST(r.lat AS FLOAT))) * 
              cos(radians(CAST(r.lng AS FLOAT)) - radians(${lng})) + 
              sin(radians(${lat})) * 
              sin(radians(CAST(r.lat AS FLOAT)))
            )
          ) AS distance
        FROM "RentalPost" rp
        INNER JOIN "Rental" r ON rp."rentalId" = r.id
        INNER JOIN "Room" room ON rp."roomId" = room.id
        WHERE rp.status = 'ACTIVE'
        ORDER BY distance
        LIMIT ${limit}
      `

      // Lấy chi tiết cho các bài đăng
      const postIds = nearbyPosts.map(post => post.id)
      const postsDetails = await Promise.all(
        postIds.map(id => this.findById(id))
      )

      // Kết hợp dữ liệu
      const results = nearbyPosts.map(postWithDistance => {
        const details = postsDetails.find(p => p?.id === postWithDistance.id)

        // Lấy hình ảnh từ bài đăng chi tiết
        const images =
          details?.room?.roomImages?.map(img => ({
            url: img.imageUrl,
            order: img.order,
          })) || []

        // Lấy tiện ích
        const roomAmenities = details?.room?.roomAmenities || []
        const amenities = roomAmenities.map(ra => ra.amenity.name)

        return {
          id: postWithDistance.id,
          title: postWithDistance.title,
          price: Number(postWithDistance.price),
          address: postWithDistance.address,
          area: Number(postWithDistance.area),
          distance: Number(postWithDistance.distance),
          images,
          amenities,
          status: details?.status || 'ACTIVE',
        }
      })

      return {
        data: results,
        totalItems: results.length,
      }
    } catch (error) {
      console.error('Error getting nearby posts:', error)
      throw new Error('Failed to get nearby posts')
    }
  }
}
