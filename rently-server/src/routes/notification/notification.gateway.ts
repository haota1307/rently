import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'

interface UserSocketMapping {
  [userId: number]: string[] // Mảng socketIds
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger = new Logger(NotificationGateway.name)
  private userSocketMap: UserSocketMapping = {}

  constructor() {}

  handleConnection(client: Socket) {
    try {
      this.logger.debug(`Client connected: ${client.id}`)

      // Khi client kết nối, không xác thực ngay, chờ client tự join room
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const userId = client.data.userId

      if (userId && this.userSocketMap[userId]) {
        // Xóa socketId khỏi map
        this.userSocketMap[userId] = this.userSocketMap[userId].filter(
          socketId => socketId !== client.id
        )

        // Nếu không còn socket nào, xóa user khỏi map
        if (this.userSocketMap[userId].length === 0) {
          delete this.userSocketMap[userId]
        }
      }

      this.logger.debug(`Client disconnected: ${client.id}`)
    } catch (error) {
      this.logger.error(`Error handling disconnection: ${error.message}`)
    }
  }

  // Cho phép client tự tham gia vào room của họ
  @SubscribeMessage('joinNotificationRoom')
  handleJoinRoom(client: Socket, payload: { userId: number }) {
    try {
      const { userId } = payload
      if (!userId) {
        return { success: false, message: 'User ID không hợp lệ' }
      }

      // Lưu userId vào socket data
      client.data.userId = userId

      // Thêm socket vào map
      if (!this.userSocketMap[userId]) {
        this.userSocketMap[userId] = []
      }
      this.userSocketMap[userId].push(client.id)

      // Join vào room của user
      client.join(`user:${userId}`)

      this.logger.debug(`Client ${client.id} joined room for user ${userId}`)

      return { success: true }
    } catch (error) {
      this.logger.error(`Error joining room: ${error.message}`)
      return { success: false, message: error.message }
    }
  }

  // Phương thức này sẽ được gọi từ NotificationService để gửi thông báo đến người dùng
  sendNotificationToUser(userId: number, notification: any) {
    this.server.to(`user:${userId}`).emit('newNotification', notification)
  }

  // Gửi số lượng thông báo chưa đọc đến người dùng
  sendUnreadCountToUser(userId: number, count: number) {
    this.server.to(`user:${userId}`).emit('unreadCount', { count })
  }

  // Đăng ký sự kiện nhận từ client
  @SubscribeMessage('readNotification')
  handleReadNotification(client: Socket, notificationId: number) {
    // Logic để đánh dấu thông báo đã đọc sẽ được xử lý ở controller
    // Đây chỉ là một sự kiện được ghi lại
    this.logger.debug(
      `User ${client.data.userId} read notification ${notificationId}`
    )
  }
}
