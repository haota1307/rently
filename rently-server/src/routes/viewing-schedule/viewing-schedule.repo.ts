import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  CreateViewingScheduleBodyType,
  GetViewingSchedulesQueryType,
  GetViewingSchedulesResType,
  UpdateViewingScheduleBodyType,
  ViewingScheduleType,
} from './viewing-schedule.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class ViewingScheduleRepo {
  constructor(private prismaService: PrismaService) {}

  async create(
    body: CreateViewingScheduleBodyType,
    tenantId: number
  ): Promise<any> {
    try {
      // Lấy thông tin bài đăng để lấy landlordId
      const post = await this.prismaService.rentalPost.findUnique({
        where: { id: body.postId },
        select: { landlordId: true },
      })

      if (!post) {
        throw new Error('Post not found')
      }

      // Xử lý ngày giờ an toàn
      let viewingDate: Date
      try {
        viewingDate = new Date(body.viewingDate)
        if (isNaN(viewingDate.getTime())) {
          throw new Error(`Ngày giờ không hợp lệ: ${body.viewingDate}`)
        }
      } catch (error) {
        throw new Error(
          `Không thể chuyển đổi chuỗi ngày giờ: ${body.viewingDate}. Lỗi: ${error.message}`
        )
      }

      const viewingSchedule = await this.prismaService.viewingSchedule.create({
        data: {
          postId: body.postId,
          tenantId,
          landlordId: post.landlordId,
          viewingDate,
          note: body.note,
          status: 'PENDING',
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
        },
      })

      return this.mapViewingScheduleToDto(viewingSchedule)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async update(id: number, body: UpdateViewingScheduleBodyType): Promise<any> {
    try {
      // Xử lý ngày giờ rescheduledDate an toàn nếu có
      let rescheduledDate: Date | null = null
      if (body.rescheduledDate) {
        try {
          rescheduledDate = new Date(body.rescheduledDate)
          if (isNaN(rescheduledDate.getTime())) {
            throw new Error(
              `Ngày giờ đặt lại không hợp lệ: ${body.rescheduledDate}`
            )
          }
        } catch (error) {
          throw new Error(
            `Không thể chuyển đổi chuỗi ngày giờ đặt lại: ${body.rescheduledDate}. Lỗi: ${error.message}`
          )
        }
      }

      const viewingSchedule = await this.prismaService.viewingSchedule.update({
        where: { id },
        data: {
          status: body.status,
          rescheduledDate,
          note: body.note,
          requireTenantConfirmation: body.requireTenantConfirmation,
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
        },
      })

      return this.mapViewingScheduleToDto(viewingSchedule)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async list(
    query: GetViewingSchedulesQueryType,
    userId: number,
    role: string
  ): Promise<GetViewingSchedulesResType> {
    try {
      // Đảm bảo page và limit luôn có giá trị
      const page = query.page || 1
      const limit = query.limit || 10
      // Đảm bảo skip và take là số nguyên
      const skip = (page - 1) * limit
      const take = Number(limit)

      const whereClause: any = {
        ...(role === 'CLIENT' ? { tenantId: userId } : { landlordId: userId }),
        ...(query.status ? { status: query.status } : {}),
      }

      const [totalItems, data] = await Promise.all([
        this.prismaService.viewingSchedule.count({ where: whereClause }),
        this.prismaService.viewingSchedule.findMany({
          skip,
          take,
          where: whereClause,
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
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ])

      return {
        data: data.map(this.mapViewingScheduleToDto),
        totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
      }
    } catch (error) {
      console.error('Error in listing viewing schedules:', error)
      throw new InternalServerErrorException(error.message)
    }
  }

  async findById(id: number): Promise<any> {
    try {
      const viewingSchedule =
        await this.prismaService.viewingSchedule.findUnique({
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
          },
        })

      if (!viewingSchedule) {
        throw new Error('Viewing schedule not found')
      }

      return this.mapViewingScheduleToDto(viewingSchedule)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async findOneByIdAndUserId(
    id: number,
    userId: number
  ): Promise<ViewingScheduleType | null> {
    try {
      const viewingSchedule =
        await this.prismaService.viewingSchedule.findFirst({
          where: {
            id,
            OR: [{ tenantId: userId }, { landlordId: userId }],
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
          },
        })

      if (!viewingSchedule) {
        return null
      }

      return this.mapViewingScheduleToDto(viewingSchedule)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  // Hàm chuyển đổi từ ViewingSchedule từ Prisma sang DTO
  private mapViewingScheduleToDto(viewingSchedule: any): ViewingScheduleType {
    return {
      id: viewingSchedule.id,
      postId: viewingSchedule.postId,
      tenantId: viewingSchedule.tenantId,
      landlordId: viewingSchedule.landlordId,
      viewingDate: viewingSchedule.viewingDate.toISOString(),
      status: viewingSchedule.status,
      rescheduledDate: viewingSchedule.rescheduledDate
        ? viewingSchedule.rescheduledDate.toISOString()
        : null,
      note: viewingSchedule.note,
      requireTenantConfirmation:
        viewingSchedule.requireTenantConfirmation || false,
      createdAt: viewingSchedule.createdAt.toISOString(),
      updatedAt: viewingSchedule.updatedAt.toISOString(),
      post: {
        id: viewingSchedule.post.id,
        title: viewingSchedule.post.title,
      },
      tenant: {
        id: viewingSchedule.tenant.id,
        name: viewingSchedule.tenant.name,
        phoneNumber: viewingSchedule.tenant.phoneNumber,
        email: viewingSchedule.tenant.email,
      },
    }
  }
}
