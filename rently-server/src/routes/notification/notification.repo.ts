import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateNotificationBodyType,
  GetNotificationsQueryType,
  GetNotificationsResType,
  NotificationTypeEnum,
} from './notification.schema'

@Injectable()
export class NotificationRepo {
  constructor(private prismaService: PrismaService) {}

  async list(
    userId: number,
    pagination: GetNotificationsQueryType
  ): Promise<GetNotificationsResType> {
    try {
      const skip = (pagination.page - 1) * pagination.limit
      const take = pagination.limit

      const whereClause = {
        userId,
        ...(pagination.isRead !== undefined && { isRead: pagination.isRead }),
      }

      const [totalItems, rawData] = await Promise.all([
        this.prismaService.notification.count({
          where: whereClause,
        }),
        this.prismaService.notification.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ])

      // Chuyển đổi dữ liệu để phù hợp với kiểu NotificationTypeEnum
      const data = rawData.map(item => ({
        ...item,
        // Đảm bảo kiểu enum chính xác
        type: item.type as unknown as NotificationTypeEnum,
      }))

      return {
        data,
        totalItems,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(totalItems / pagination.limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async create(data: CreateNotificationBodyType) {
    try {
      console.log('NotificationRepo - Creating notification in DB:', data)

      // Đảm bảo dữ liệu phù hợp với schema Prisma
      const notification = await this.prismaService.notification.create({
        data: {
          userId: Number(data.userId),
          type: data.type,
          title: data.title,
          message: data.message,
          relatedId: data.relatedId ? Number(data.relatedId) : null,
          relatedType: data.relatedType || null,
          deepLink: data.deepLink || null,
        },
      })

      console.log(
        'NotificationRepo - Notification created in DB:',
        notification
      )
      return notification
    } catch (error) {
      console.error(
        'NotificationRepo - Error creating notification in DB:',
        error
      )
      throw new InternalServerErrorException(error.message)
    }
  }

  async markAsRead(id: number) {
    try {
      return await this.prismaService.notification.update({
        where: { id },
        data: { isRead: true },
      })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async markAllAsRead(userId: number) {
    try {
      return await this.prismaService.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async getUnreadCount(userId: number) {
    try {
      return await this.prismaService.notification.count({
        where: { userId, isRead: false },
      })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
