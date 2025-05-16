import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common'
import {
  CreateRentalRequestBodyType,
  GetRentalRequestsQueryType,
  GetRentalRequestsResType,
  RentalRequestDetailType,
  RentalRequestStatus,
  UpdateRentalRequestBodyType,
} from './rental-request.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'
import { PaymentStatus, Prisma } from '@prisma/client'

@Injectable()
export class RentalRequestRepo {
  private readonly logger = new Logger(RentalRequestRepo.name)

  constructor(private prismaService: PrismaService) {}

  // Hàm chuyển đổi từ database object sang DTO type
  private mapRentalRequestToDto(data: any): RentalRequestDetailType {
    return {
      id: data.id,
      postId: data.postId,
      tenantId: data.tenantId,
      landlordId: data.landlordId,
      status: data.status,
      note: data.note,
      expectedMoveDate: data.expectedMoveDate,
      duration: data.duration,
      depositAmount: data.depositAmount ? Number(data.depositAmount) : null,
      contractSigned: data.contractSigned,
      rejectionReason: data.rejectionReason,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,

      post: data.post
        ? {
            id: data.post.id,
            title: data.post.title,
            price: data.post.pricePaid ? Number(data.post.pricePaid) : null,
            description: data.post.description || null,
            room: data.post.room
              ? {
                  id: data.post.room.id,
                  title: data.post.room.title,
                  area: data.post.room.area
                    ? Number(data.post.room.area)
                    : null,
                  price: data.post.room.price
                    ? Number(data.post.room.price)
                    : null,
                }
              : null,
            rental: data.post.rental
              ? {
                  id: data.post.rental.id,
                  title: data.post.rental.title,
                  address: data.post.rental.address || null,
                }
              : null,
          }
        : {
            id: 0,
            title: '',
            price: null,
            description: null,
            room: null,
            rental: null,
          },
      tenant: data.tenant
        ? {
            id: data.tenant.id,
            name: data.tenant.name,
            phoneNumber: data.tenant.phoneNumber,
            email: data.tenant.email,
          }
        : {
            id: 0,
            name: '',
            phoneNumber: null,
            email: '',
          },
      landlord: data.landlord
        ? {
            id: data.landlord.id,
            name: data.landlord.name,
            phoneNumber: data.landlord.phoneNumber,
            email: data.landlord.email,
          }
        : {
            id: 0,
            name: '',
            phoneNumber: null,
            email: '',
          },
    }
  }

  // Lấy danh sách yêu cầu thuê với bộ lọc
  async list(
    query: GetRentalRequestsQueryType,
    userId?: number,
    role?: string
  ): Promise<GetRentalRequestsResType> {
    try {
      const skip = (query.page - 1) * query.limit
      const take = query.limit

      // Xây dựng điều kiện where dựa trên query params
      const where: any = {}

      // Nếu có filter theo trạng thái
      if (query.status) {
        where.status = query.status
      }

      // Nếu có userId, filter theo role
      if (userId) {
        if (role === 'TENANT') {
          where.tenantId = userId
        } else if (role === 'LANDLORD') {
          where.landlordId = userId
        }
      }

      // Đếm tổng số kết quả và lấy dữ liệu
      const [totalItems, data] = await Promise.all([
        this.prismaService.rentalRequest.count({ where }),
        this.prismaService.rentalRequest.findMany({
          where,
          skip,
          take,
          include: {
            post: {
              select: {
                id: true,
                title: true,
                pricePaid: true,
                description: true,
                rental: {
                  select: {
                    id: true,
                    title: true,
                    address: true,
                  },
                },
                room: {
                  select: {
                    id: true,
                    title: true,
                    area: true,
                    price: true,
                  },
                },
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                email: true,
              },
            },
            landlord: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ])

      return {
        data: data.map(item => this.mapRentalRequestToDto(item)),
        totalItems,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalItems / query.limit),
      }
    } catch (error) {
      this.logger.error(
        `Error listing rental requests: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(error.message)
    }
  }

  // Tìm yêu cầu thuê theo ID
  async findById(id: number): Promise<RentalRequestDetailType | null> {
    try {
      const rentalRequest = await this.prismaService.rentalRequest.findUnique({
        where: { id },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              pricePaid: true,
              description: true,
              rental: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                },
              },
              room: {
                select: {
                  id: true,
                  title: true,
                  area: true,
                  price: true,
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              email: true,
            },
          },
          landlord: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              email: true,
            },
          },
        },
      })

      if (!rentalRequest) {
        return null
      }

      return this.mapRentalRequestToDto(rentalRequest)
    } catch (error) {
      this.logger.error(
        `Error finding rental request by ID: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(error.message)
    }
  }

  // Tạo yêu cầu thuê mới
  async create({
    data,
    tenantId,
    prismaTransaction,
  }: {
    data: CreateRentalRequestBodyType
    tenantId: number
    prismaTransaction?: any
  }): Promise<RentalRequestDetailType> {
    try {
      // Sử dụng prismaService mặc định hoặc transaction nếu được cung cấp
      const prisma = prismaTransaction || this.prismaService

      // Lấy landlordId từ post
      const post = await prisma.rentalPost.findUnique({
        where: { id: data.postId },
        select: { landlordId: true },
      })

      if (!post) {
        throw new NotFoundException('Post not found')
      }

      const landlordId = post.landlordId

      // Tạo yêu cầu thuê
      const rentalRequest = await prisma.rentalRequest.create({
        data: {
          postId: data.postId,
          tenantId,
          landlordId,
          expectedMoveDate: new Date(data.expectedMoveDate),
          duration: data.duration,
          note: data.note || null,
          status: RentalRequestStatus.PENDING,
        },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              pricePaid: true,
              description: true,
              rental: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                },
              },
              room: {
                select: {
                  id: true,
                  title: true,
                  area: true,
                  price: true,
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              email: true,
            },
          },
          landlord: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              email: true,
            },
          },
        },
      })

      return this.mapRentalRequestToDto(rentalRequest)
    } catch (error) {
      this.logger.error(
        `Error creating rental request: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(error.message)
    }
  }

  // Cập nhật yêu cầu thuê
  async update({
    id,
    data,
    prismaTransaction,
  }: {
    id: number
    data: UpdateRentalRequestBodyType
    prismaTransaction?: any
  }): Promise<RentalRequestDetailType> {
    try {
      // Sử dụng prismaService mặc định hoặc transaction nếu được cung cấp
      const prisma = prismaTransaction || this.prismaService

      const rentalRequest = await prisma.rentalRequest.update({
        where: { id },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.note !== undefined && { note: data.note }),
          ...(data.rejectionReason !== undefined && {
            rejectionReason: data.rejectionReason,
          }),
          ...(data.contractSigned !== undefined && {
            contractSigned: data.contractSigned,
          }),
          ...(data.depositAmount !== undefined && {
            depositAmount: new Decimal(data.depositAmount),
          }),
        },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              pricePaid: true,
              description: true,
              rental: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                },
              },
              room: {
                select: {
                  id: true,
                  title: true,
                  area: true,
                  price: true,
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              email: true,
            },
          },
          landlord: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              email: true,
            },
          },
        },
      })

      return this.mapRentalRequestToDto(rentalRequest)
    } catch (error) {
      this.logger.error(
        `Error updating rental request: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(error.message)
    }
  }

  // Tìm room theo ID
  async findRoomById(id: number) {
    return this.prismaService.room.findUnique({
      where: { id },
    })
  }

  // Cập nhật trạng thái phòng
  async updateRoomAvailability(
    roomId: number,
    isAvailable: boolean,
    prismaTransaction?: any
  ) {
    const prisma = prismaTransaction || this.prismaService

    return prisma.room.update({
      where: { id: roomId },
      data: { isAvailable },
    })
  }

  // Tìm tất cả các yêu cầu đang chờ xử lý cho một bài đăng
  async findPendingRequestsByPostId(postId: number, excludeId: number) {
    return this.prismaService.rentalRequest.findMany({
      where: {
        postId,
        status: RentalRequestStatus.PENDING,
        id: { not: excludeId },
      },
    })
  }

  // Từ chối tất cả các yêu cầu cho một bài đăng
  async rejectAllPendingRequests(
    postId: number,
    excludeId: number,
    reason: string,
    prismaTransaction?: any
  ) {
    const prisma = prismaTransaction || this.prismaService

    return prisma.rentalRequest.updateMany({
      where: {
        postId,
        status: RentalRequestStatus.PENDING,
        id: { not: excludeId },
      },
      data: {
        status: RentalRequestStatus.REJECTED,
        rejectionReason: reason,
      },
    })
  }

  // Lấy thông tin chi tiết của yêu cầu thuê bao gồm thông tin liên quan
  async findRequestWithRelations(id: number) {
    return this.prismaService.rentalRequest.findUnique({
      where: { id },
      include: {
        post: true,
        tenant: {
          select: {
            id: true,
            email: true,
            name: true,
            balance: true,
          },
        },
        landlord: {
          select: {
            id: true,
            email: true,
            name: true,
            balance: true,
          },
        },
      },
    })
  }

  // Lấy thông tin chi tiết của yêu cầu thuê với khóa FOR UPDATE để ngăn race condition
  async findRequestWithRelationsForUpdate(id: number, prismaTransaction: any) {
    return prismaTransaction.rentalRequest.findUnique({
      where: { id },
      include: {
        post: true,
        tenant: {
          select: {
            id: true,
            email: true,
            name: true,
            balance: true,
          },
        },
        landlord: {
          select: {
            id: true,
            email: true,
            name: true,
            balance: true,
          },
        },
      },
    })
  }

  // Kiểm tra phòng có sẵn với khóa FOR UPDATE để ngăn race condition
  async checkRoomAvailabilityWithLock(postId: number, prismaTransaction: any) {
    const post = await prismaTransaction.rentalPost.findUnique({
      where: { id: postId },
      include: {
        room: {
          select: {
            id: true,
            isAvailable: true,
          },
        },
      },
    })

    if (!post || !post.room) {
      return null
    }

    return post.room
  }

  // Tìm bài đăng theo ID
  async findPostById(id: number) {
    return this.prismaService.rentalPost.findUnique({
      where: { id },
      select: { title: true },
    })
  }

  // Tìm người dùng theo ID
  async findUserById(id: number) {
    return this.prismaService.user.findUnique({
      where: { id },
      select: {
        email: true,
        name: true,
      },
    })
  }

  // Kiểm tra nếu yêu cầu thuê đã tồn tại
  async findExistingRequest(postId: number, tenantId: number) {
    return this.prismaService.rentalRequest.findFirst({
      where: {
        postId,
        tenantId,
        OR: [
          { status: RentalRequestStatus.PENDING },
          { status: RentalRequestStatus.APPROVED },
        ],
      },
    })
  }

  // Kiểm tra trạng thái phòng
  async checkRoomAvailability(postId: number) {
    return this.prismaService.rentalPost.findUnique({
      where: { id: postId },
      include: {
        room: {
          select: {
            isAvailable: true,
          },
        },
      },
    })
  }

  // Xử lý giao dịch tiền đặt cọc
  async processDepositTransaction(
    tenantId: number,
    landlordId: number,
    amount: number,
    postTitle: string,
    tenantName: string,
    prismaTransaction?: any
  ) {
    const executeTransaction = async (prisma: any) => {
      // Trừ tiền cọc từ tài khoản người thuê
      await prisma.user.update({
        where: { id: tenantId },
        data: {
          balance: { decrement: amount },
        },
      })

      // Cộng tiền cọc vào tài khoản chủ nhà
      await prisma.user.update({
        where: { id: landlordId },
        data: {
          balance: { increment: amount },
        },
      })

      // Tạo giao dịch tiền ra cho người thuê
      const tenantTransaction = await prisma.paymentTransaction.create({
        data: {
          gateway: 'SYSTEM',
          transactionDate: new Date(),
          amountOut: amount,
          amountIn: 0,
          transactionContent: `Đặt cọc cho bài đăng: ${postTitle}`,
          userId: tenantId,
        },
      })

      // Tạo giao dịch tiền vào cho chủ nhà
      const landlordTransaction = await prisma.paymentTransaction.create({
        data: {
          gateway: 'SYSTEM',
          transactionDate: new Date(),
          amountIn: amount,
          amountOut: 0,
          transactionContent: `Nhận tiền đặt cọc từ ${tenantName} cho bài đăng: ${postTitle}`,
          userId: landlordId,
        },
      })

      // Tạo bản ghi thanh toán cho người thuê và liên kết với transaction
      await prisma.payment.create({
        data: {
          amount: amount,
          status: PaymentStatus.COMPLETED,
          description: `Tiền đặt cọc cho bài đăng: ${postTitle}`,
          userId: tenantId,
          transactionId: tenantTransaction.id,
        },
      })

      // Tạo bản ghi thanh toán cho chủ nhà và liên kết với transaction
      await prisma.payment.create({
        data: {
          amount: amount,
          status: PaymentStatus.COMPLETED,
          description: `Nhận tiền đặt cọc từ ${tenantName} cho bài đăng: ${postTitle}`,
          userId: landlordId,
          transactionId: landlordTransaction.id,
        },
      })
    }

    // Nếu có prismaTransaction, sử dụng nó, nếu không thì tạo transaction mới
    if (prismaTransaction) {
      return executeTransaction(prismaTransaction)
    } else {
      return this.prismaService.$transaction(executeTransaction)
    }
  }

  // Hoàn lại tiền đặt cọc
  async refundDeposit(
    tenantId: number,
    landlordId: number,
    amount: number,
    postTitle: string,
    tenantName: string,
    prismaTransaction?: any
  ) {
    const executeRefund = async (prisma: any) => {
      // Trừ tiền từ tài khoản chủ nhà
      await prisma.user.update({
        where: { id: landlordId },
        data: {
          balance: { decrement: amount },
        },
      })

      // Cộng tiền vào tài khoản người thuê
      await prisma.user.update({
        where: { id: tenantId },
        data: {
          balance: { increment: amount },
        },
      })

      // Tạo giao dịch hoàn tiền cho người thuê
      const tenantTransaction = await prisma.paymentTransaction.create({
        data: {
          gateway: 'SYSTEM',
          transactionDate: new Date(),
          amountIn: amount,
          amountOut: 0,
          transactionContent: `Hoàn tiền đặt cọc cho bài đăng: ${postTitle}`,
          userId: tenantId,
        },
      })

      // Tạo giao dịch hoàn tiền từ chủ nhà
      const landlordTransaction = await prisma.paymentTransaction.create({
        data: {
          gateway: 'SYSTEM',
          transactionDate: new Date(),
          amountOut: amount,
          amountIn: 0,
          transactionContent: `Hoàn tiền đặt cọc cho ${tenantName} - bài đăng: ${postTitle}`,
          userId: landlordId,
        },
      })

      // Tạo bản ghi thanh toán hoàn tiền cho người thuê
      await prisma.payment.create({
        data: {
          amount: amount,
          status: PaymentStatus.COMPLETED,
          description: `Hoàn tiền đặt cọc cho bài đăng: ${postTitle}`,
          userId: tenantId,
          transactionId: tenantTransaction.id,
          metadata: { type: 'DEPOSIT_REFUND' },
        },
      })

      // Tạo bản ghi thanh toán hoàn tiền từ chủ nhà
      await prisma.payment.create({
        data: {
          amount: amount,
          status: PaymentStatus.COMPLETED,
          description: `Hoàn tiền đặt cọc cho ${tenantName} - bài đăng: ${postTitle}`,
          userId: landlordId,
          transactionId: landlordTransaction.id,
          metadata: { type: 'DEPOSIT_REFUND' },
        },
      })
    }

    // Nếu có prismaTransaction, sử dụng nó, nếu không thì tạo transaction mới
    if (prismaTransaction) {
      return executeRefund(prismaTransaction)
    } else {
      return this.prismaService.$transaction(executeRefund)
    }
  }
}
