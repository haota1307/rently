import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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

@Injectable()
export class RentalRequestRepo {
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
          }
        : {
            id: 0,
            title: '',
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
      throw new InternalServerErrorException(error.message)
    }
  }

  // Tạo yêu cầu thuê mới
  async create({
    data,
    tenantId,
  }: {
    data: CreateRentalRequestBodyType
    tenantId: number
  }): Promise<RentalRequestDetailType> {
    try {
      // Lấy landlordId từ post
      const post = await this.prismaService.rentalPost.findUnique({
        where: { id: data.postId },
        select: { landlordId: true },
      })

      if (!post) {
        throw new NotFoundException('Post not found')
      }

      const landlordId = post.landlordId

      // Tạo yêu cầu thuê
      const rentalRequest = await this.prismaService.rentalRequest.create({
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
      throw new InternalServerErrorException(error.message)
    }
  }

  // Cập nhật yêu cầu thuê
  async update({
    id,
    data,
  }: {
    id: number
    data: UpdateRentalRequestBodyType
  }): Promise<RentalRequestDetailType> {
    try {
      const rentalRequest = await this.prismaService.rentalRequest.update({
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
      throw new InternalServerErrorException(error.message)
    }
  }
}
