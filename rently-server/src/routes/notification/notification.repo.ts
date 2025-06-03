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
        type: item.type as any as NotificationTypeEnum,
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

      // Map giá trị string thành đúng kiểu enum Prisma
      let typeValue: any
      if (typeof data.type === 'string') {
        // Xử lý kiểu string trực tiếp
        switch (data.type) {
          case 'CONTRACT_RENEWED':
            typeValue = 'CONTRACT_RENEWED'
            break
          case 'CONTRACT_TERMINATED':
            typeValue = 'CONTRACT_TERMINATED'
            break
          case 'CONTRACT_EXPIRED':
            typeValue = 'CONTRACT_EXPIRED'
            break
          case 'CONTRACT_SIGNED':
            typeValue = 'CONTRACT_SIGNED'
            break
          case 'PAYMENT':
            typeValue = 'PAYMENT'
            break
          case 'INTERACTION':
            typeValue = 'INTERACTION'
            break
          case 'RENTAL_REQUEST':
            typeValue = 'RENTAL_REQUEST'
            break
          case 'VIEWING_SCHEDULE':
            typeValue = 'VIEWING_SCHEDULE'
            break
          case 'POST':
            typeValue = 'POST'
            break
          case 'SYSTEM':
            typeValue = 'SYSTEM'
            break
          default:
            // Giá trị mặc định nếu không khớp
            typeValue = 'SYSTEM'
        }
      } else {
        // Nếu là enum, lấy giá trị string tương ứng
        typeValue = data.type
      }

      // Đảm bảo dữ liệu phù hợp với schema Prisma
      const notification = await this.prismaService.notification.create({
        data: {
          userId: Number(data.userId),
          type: typeValue,
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
