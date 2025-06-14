import { Injectable } from '@nestjs/common'
import { NotificationRepo } from './notification.repo'
import {
  CreateNotificationBodyType,
  GetNotificationsQueryType,
  NotificationTypeEnum,
} from './notification.schema'
import { NotificationGateway } from './notification.gateway'

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepo: NotificationRepo,
    private readonly notificationGateway: NotificationGateway
  ) {}

  async list(userId: number, query: GetNotificationsQueryType) {
    return this.notificationRepo.list(userId, query)
  }

  async create(data: CreateNotificationBodyType) {
    const notification = await this.notificationRepo.create(data)
    return notification
  }

  async markAsRead(id: number) {
    return this.notificationRepo.markAsRead(id)
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepo.markAllAsRead(userId)

    // Cập nhật count thông báo chưa đọc
    const unreadCount = await this.getUnreadCount(userId)
    this.notificationGateway.sendUnreadCountToUser(userId, unreadCount)

    return { message: 'Đã đánh dấu tất cả thông báo là đã đọc' }
  }

  async getUnreadCount(userId: number) {
    return this.notificationRepo.getUnreadCount(userId)
  }

  // Helper methods để tạo thông báo cho các sự kiện phổ biến

  async notifyPayment(userId: number, amount: number, description: string) {
    return this.create({
      userId,
      type: NotificationTypeEnum.PAYMENT,
      title: 'Thông báo thanh toán',
      message: `${description}: ${amount.toLocaleString('vi-VN')} VNĐ`,
      relatedType: 'payment',
    })
  }

  async notifyRentalRequest(
    landlordId: number,
    tenantName: string,
    rentalRequestId: number
  ) {
    return this.create({
      userId: landlordId,
      type: NotificationTypeEnum.RENTAL_REQUEST,
      title: 'Yêu cầu thuê mới',
      message: `${tenantName} đã gửi một yêu cầu thuê mới cho phòng của bạn`,
      relatedId: rentalRequestId,
      relatedType: 'rental_request',
    })
  }

  async notifyRentalRequestUpdate(
    tenantId: number,
    status: string,
    roomName: string,
    rentalRequestId: number
  ) {
    return this.create({
      userId: tenantId,
      type: NotificationTypeEnum.RENTAL_REQUEST,
      title: 'Cập nhật yêu cầu thuê',
      message: `Yêu cầu thuê phòng "${roomName}" của bạn đã được ${status === 'APPROVED' ? 'chấp nhận' : 'từ chối'}`,
      relatedId: rentalRequestId,
      relatedType: 'rental_request',
    })
  }

  async notifyNewMessage(
    receiverId: number,
    senderName: string,
    conversationId: number
  ) {
    return this.create({
      userId: receiverId,
      type: NotificationTypeEnum.INTERACTION,
      title: 'Tin nhắn mới',
      message: `Bạn có tin nhắn mới từ ${senderName}`,
      relatedId: conversationId,
      relatedType: 'conversation',
    })
  }

  async notifyNewComment(
    postOwnerId: number,
    commenterName: string,
    postId: number,
    postTitle: string
  ) {
    return this.create({
      userId: postOwnerId,
      type: NotificationTypeEnum.INTERACTION,
      title: 'Bình luận mới',
      message: `${commenterName} đã bình luận về bài đăng "${postTitle}"`,
      relatedId: postId,
      relatedType: 'post',
    })
  }

  async notifyViewingSchedule(
    userId: number,
    scheduledTime: Date,
    roomName: string,
    scheduleId: number
  ) {
    try {
      // Đảm bảo scheduledTime là đối tượng Date hợp lệ
      const dateObj =
        scheduledTime instanceof Date ? scheduledTime : new Date(scheduledTime)

      if (isNaN(dateObj.getTime())) {
        throw new Error(`Ngày giờ không hợp lệ: ${scheduledTime}`)
      }

      const formattedTime = new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(dateObj)

      return this.create({
        userId,
        type: NotificationTypeEnum.VIEWING_SCHEDULE,
        title: 'Lịch hẹn xem phòng',
        message: `Nhắc nhở: Bạn có lịch xem phòng "${roomName}" vào lúc ${formattedTime}`,
        relatedId: scheduleId,
        relatedType: 'viewing_schedule',
      })
    } catch (error) {
      console.error('Lỗi khi tạo thông báo lịch hẹn:', error)
      // Tạo thông báo không có thời gian cụ thể nếu xảy ra lỗi
      return this.create({
        userId,
        type: NotificationTypeEnum.VIEWING_SCHEDULE,
        title: 'Lịch hẹn xem phòng',
        message: `Bạn có lịch xem phòng "${roomName}" mới`,
        relatedId: scheduleId,
        relatedType: 'viewing_schedule',
      })
    }
  }

  // Helper methods cho thông báo liên quan đến hợp đồng
  async notifyContractTerminated(
    userId: number,
    contractNumber: string,
    contractId: number
  ) {
    return this.create({
      userId,
      type: NotificationTypeEnum.CONTRACT_TERMINATED,
      title: 'Hợp đồng đã chấm dứt',
      message: `Hợp đồng ${contractNumber} đã được chấm dứt.`,
      relatedId: contractId,
      relatedType: 'contract',
    })
  }

  async notifyContractExpired(
    userId: number,
    contractNumber: string,
    contractId: number
  ) {
    return this.create({
      userId,
      type: NotificationTypeEnum.CONTRACT_EXPIRED,
      title: 'Hợp đồng đã hết hạn',
      message: `Hợp đồng ${contractNumber} đã hết hạn.`,
      relatedId: contractId,
      relatedType: 'contract',
    })
  }

  async notifyContractRenewed(
    userId: number,
    contractNumber: string,
    endDate: Date,
    contractId: number
  ) {
    const formattedDate = new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(endDate instanceof Date ? endDate : new Date(endDate))

    return this.create({
      userId,
      type: NotificationTypeEnum.CONTRACT_RENEWED,
      title: 'Hợp đồng đã được gia hạn',
      message: `Hợp đồng ${contractNumber} đã được gia hạn đến ${formattedDate}.`,
      relatedId: contractId,
      relatedType: 'contract',
    })
  }

  async notifyContractSigned(
    userId: number,
    contractNumber: string,
    signerName: string,
    contractId: number
  ) {
    return this.create({
      userId,
      type: NotificationTypeEnum.CONTRACT_SIGNED,
      title: 'Hợp đồng đã được ký',
      message: `${signerName} đã ký hợp đồng ${contractNumber}.`,
      relatedId: contractId,
      relatedType: 'contract',
    })
  }
}
