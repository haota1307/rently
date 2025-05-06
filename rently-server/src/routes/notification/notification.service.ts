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

    // Gửi thông báo realtime đến client - đảm bảo userId là number
    this.notificationGateway.sendNotificationToUser(
      Number(data.userId),
      notification
    )

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
      deepLink: '/tai-khoan/lich-su-thanh-toan',
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
      deepLink: `/quan-ly/yeu-cau-thue/${rentalRequestId}`,
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
      deepLink: `/tai-khoan/yeu-cau-thue/${rentalRequestId}`,
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
      deepLink: `/tin-nhan/${conversationId}`,
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
      deepLink: `/bai-dang/${postId}`,
    })
  }

  async notifyViewingSchedule(
    userId: number,
    scheduledTime: Date,
    roomName: string,
    scheduleId: number
  ) {
    const formattedTime = new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(scheduledTime)

    return this.create({
      userId,
      type: NotificationTypeEnum.VIEWING_SCHEDULE,
      title: 'Lịch hẹn xem phòng',
      message: `Nhắc nhở: Bạn có lịch xem phòng "${roomName}" vào lúc ${formattedTime}`,
      relatedId: scheduleId,
      relatedType: 'viewing_schedule',
      deepLink: `/tai-khoan/lich-hen/${scheduleId}`,
    })
  }
}
