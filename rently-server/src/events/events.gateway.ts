import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger, UnauthorizedException } from '@nestjs/common'
import { TokenService } from 'src/shared/services/token.service'
import { TypingMessage } from './dto/typing-message.dto'
import { Interval } from '@nestjs/schedule'

// Giới hạn kích thước cho dữ liệu
const MAX_RECENT_EVENTS = 50
const MAX_MESSAGE_SIZE = 10000 // 10KB
const CLEANUP_INTERVAL = 60000 // 1 phút
const EVENT_EXPIRE_TIME = 10000 // 10 giây

interface SocketWithUser extends Socket {
  user?: {
    id: number
    role: string
  }
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server
  private logger: Logger = new Logger('EventsGateway')
  private userSocketMap: Map<number, string[]> = new Map() // userId -> socketIds[]
  private recentEvents: Map<string, { timestamp: number; data: any }> =
    new Map()
  private roomLastActivity: Map<string, number> = new Map() // roomId -> lastActivityTimestamp

  constructor(private readonly tokenService: TokenService) {}

  afterInit() {
    this.logger.log('Initialized')
  }

  async handleConnection(client: SocketWithUser) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1]

      if (!token) {
        this.logger.warn('Connection attempt without token')
        client.disconnect()
        return
      }

      const decoded = await this.tokenService.verifyAccessToken(token)
      if (!decoded) {
        this.logger.warn('Invalid token provided')
        client.disconnect()
        return
      }

      // Attach user info to socket
      client.user = {
        id: decoded.userId,
        role: decoded.roleName,
      }

      // Add to user-socket mapping
      if (!this.userSocketMap.has(decoded.userId)) {
        this.userSocketMap.set(decoded.userId, [])
      }
      const userSockets = this.userSocketMap.get(decoded.userId)
      if (userSockets) {
        userSockets.push(client.id)
      }

      this.logger.log(
        `Client connected: ${client.id} (User: ${decoded.userId})`
      )
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: SocketWithUser) {
    if (client.user) {
      const { id } = client.user
      const sockets = this.userSocketMap.get(id) || []

      // Remove this socket from the user's list
      const updatedSockets = sockets.filter(socketId => socketId !== client.id)

      if (updatedSockets.length === 0) {
        this.userSocketMap.delete(id)
      } else {
        this.userSocketMap.set(id, updatedSockets)
      }

      this.logger.log(`Client disconnected: ${client.id} (User: ${id})`)
    } else {
      this.logger.log(`Client disconnected: ${client.id} (Unknown user)`)
    }
  }

  // Định kỳ dọn dẹp bộ nhớ
  @Interval(CLEANUP_INTERVAL)
  cleanupResources() {
    this.cleanupRecentEvents()
    this.cleanupInactiveRooms()
    this.logger.log(`Memory cleanup completed: ${new Date().toISOString()}`)
  }

  // Dọn dẹp recent events
  private cleanupRecentEvents() {
    const now = Date.now()
    let deletedCount = 0

    // Xóa sự kiện cũ hơn EVENT_EXPIRE_TIME
    for (const [key, value] of this.recentEvents.entries()) {
      if (now - value.timestamp > EVENT_EXPIRE_TIME) {
        this.recentEvents.delete(key)
        deletedCount++
      }
    }

    // Nếu vẫn có quá nhiều, xóa theo thứ tự thời gian
    if (this.recentEvents.size > MAX_RECENT_EVENTS) {
      const keysToDelete = [...this.recentEvents.keys()]
        .sort(
          (a, b) =>
            (this.recentEvents.get(a)?.timestamp || 0) -
            (this.recentEvents.get(b)?.timestamp || 0)
        )
        .slice(0, this.recentEvents.size - MAX_RECENT_EVENTS)

      keysToDelete.forEach(key => {
        this.recentEvents.delete(key)
        deletedCount++
      })
    }

    if (deletedCount > 0) {
      this.logger.log(`Cleaned up ${deletedCount} recent events`)
    }
  }

  // Dọn dẹp rooms không hoạt động
  private cleanupInactiveRooms() {
    const now = Date.now()
    let deletedCount = 0

    for (const [roomId, lastActivity] of this.roomLastActivity.entries()) {
      if (now - lastActivity > 3600000) {
        // 1 giờ không hoạt động
        const room = this.server.sockets.adapter.rooms.get(roomId)
        if (!room || room.size === 0) {
          this.roomLastActivity.delete(roomId)
          deletedCount++
        }
      }
    }

    if (deletedCount > 0) {
      this.logger.log(`Cleaned up ${deletedCount} inactive rooms`)
    }
  }

  // Cập nhật hoạt động cho room
  private updateRoomActivity(roomId: string) {
    this.roomLastActivity.set(roomId, Date.now())
  }

  // Giới hạn kích thước dữ liệu
  private limitDataSize(data: any): any {
    if (!data) return data

    // Nếu là chuỗi, giới hạn độ dài
    if (typeof data === 'string' && data.length > MAX_MESSAGE_SIZE) {
      return data.substring(0, MAX_MESSAGE_SIZE)
    }

    // Nếu là object, xử lý đệ quy
    if (typeof data === 'object' && data !== null) {
      const result = Array.isArray(data) ? [] : {}

      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          if (
            key === 'content' &&
            typeof data[key] === 'string' &&
            data[key].length > MAX_MESSAGE_SIZE
          ) {
            result[key] = data[key].substring(0, MAX_MESSAGE_SIZE)
          } else {
            result[key] = this.limitDataSize(data[key])
          }
        }
      }

      return result
    }

    return data
  }

  @SubscribeMessage('registerUser')
  handleRegisterUser(
    @MessageBody() userId: number | string | { userId: number },
    @ConnectedSocket() client: SocketWithUser
  ) {
    // Xử lý các trường hợp khác nhau của tham số
    let userIdValue: number

    if (typeof userId === 'object' && userId !== null && 'userId' in userId) {
      userIdValue = userId.userId
    } else if (typeof userId === 'string') {
      userIdValue = parseInt(userId, 10)
    } else if (typeof userId === 'number') {
      userIdValue = userId
    } else {
      this.logger.warn(`Invalid userId format: ${JSON.stringify(userId)}`)
      return { status: 'error', message: 'UserId không hợp lệ' }
    }

    if (isNaN(userIdValue) || userIdValue <= 0) {
      this.logger.warn(`Invalid userId value: ${userIdValue}`)
      return { status: 'error', message: 'UserId không hợp lệ' }
    }

    this.logger.log(`Đăng ký user: ${userIdValue} với socket: ${client.id}`)

    // Thêm socket ID vào danh sách socket của user
    if (!this.userSocketMap.has(userIdValue)) {
      this.userSocketMap.set(userIdValue, [])
    }

    // Đảm bảo userSockets không undefined
    const userSockets = this.userSocketMap.get(userIdValue) || []
    if (!userSockets.includes(client.id)) {
      userSockets.push(client.id)
      this.userSocketMap.set(userIdValue, userSockets)
    }

    // Gửi xác nhận đăng ký thành công
    client.emit('registerUserResponse', {
      status: 'ok',
      userId: userIdValue,
      socketId: client.id,
    })

    return { status: 'ok', userId: userIdValue }
  }

  notifyRoleUpdated(
    userId: number,
    status: 'APPROVED' | 'REJECTED',
    note?: string
  ) {
    const userSockets = this.userSocketMap.get(userId)
    if (!userSockets || userSockets.length === 0) {
      this.logger.warn(`No connected sockets for user ${userId}`)
      return
    }

    const payload = {
      status,
      message:
        status === 'APPROVED'
          ? 'Yêu cầu nâng cấp tài khoản đã được phê duyệt.'
          : `Yêu cầu nâng cấp tài khoản đã bị từ chối${note ? ': ' + note : ''}`,
      note,
    }

    this.logger.log(
      `Sending roleUpdate to user ${userId}, sockets: ${userSockets}`
    )

    // Gửi thông báo đến tất cả socket của user
    userSockets.forEach(socketId => {
      this.server.to(socketId).emit('roleUpdate', payload)
    })
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: TypingMessage,
    @ConnectedSocket() client: Socket
  ) {
    const roomId = data.roomId.toString()
    client.broadcast.to(roomId).emit('typing', data)
    this.updateRoomActivity(roomId)
    return { event: 'typing', data }
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() roomId: number, @ConnectedSocket() client: Socket) {
    const roomIdStr = roomId.toString()
    client.join(roomIdStr)
    this.updateRoomActivity(roomIdStr)
    return { event: 'join', data: roomId }
  }

  @SubscribeMessage('leave')
  handleLeave(
    @MessageBody() roomId: number,
    @ConnectedSocket() client: Socket
  ) {
    client.leave(roomId.toString())
    return { event: 'leave', data: roomId }
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: SocketWithUser
  ) {
    if (!client.user) {
      throw new WsException('Unauthorized')
    }

    const room = `chat:${conversationId}`
    client.join(room)
    this.updateRoomActivity(room)
    this.logger.log(`User ${client.user.id} joined chat room: ${room}`)
    return { event: 'joinChat', data: conversationId }
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: SocketWithUser
  ) {
    if (!client.user) {
      throw new WsException('Unauthorized')
    }

    const room = `chat:${conversationId}`
    client.leave(room)
    this.logger.log(`User ${client.user.id} left chat room: ${room}`)
    return { event: 'leaveChat', data: conversationId }
  }

  @SubscribeMessage('chatTyping')
  handleChatTyping(
    @MessageBody() data: { conversationId: number; isTyping: boolean },
    @ConnectedSocket() client: SocketWithUser
  ) {
    if (!client.user) {
      throw new WsException('Unauthorized')
    }

    const room = `chat:${data.conversationId}`
    this.updateRoomActivity(room)

    // Phát sự kiện đến tất cả người dùng trong phòng chat, ngoại trừ người gửi
    client.broadcast.to(room).emit('chatTyping', {
      userId: client.user.id,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    })

    return { event: 'chatTyping', data }
  }

  notifyNewMessage(conversationId: number, message: any, receiverId: number) {
    const room = `chat:${conversationId}`
    this.updateRoomActivity(room)

    // Giới hạn kích thước message
    const limitedMessage = this.limitDataSize(message)

    const userSockets = this.userSocketMap.get(receiverId) || []

    this.logger.log(
      `Gửi tin nhắn mới đến phòng ${room} và receiverId ${receiverId}`
    )

    // Gửi tin nhắn đến tất cả người dùng trong phòng chat
    this.server.to(room).emit('newMessage', limitedMessage)

    // Log danh sách các socket trong phòng
    const roomSockets = this.server.sockets.adapter.rooms.get(room)
    this.logger.log(
      `Sockets trong phòng ${room}: ${roomSockets ? [...roomSockets].join(', ') : 'không có'}`
    )

    // Đảm bảo người nhận nhận được thông báo ngay cả khi họ không trong phòng chat
    if (userSockets.length > 0) {
      this.logger.log(
        `Gửi thông báo riêng đến ${userSockets.length} socket của user ${receiverId}`
      )

      userSockets.forEach(socketId => {
        this.server.to(socketId).emit('messageNotification', {
          conversationId,
          message: limitedMessage,
        })

        // Đảm bảo người nhận nhận được tin nhắn mới ngay cả khi không trong phòng chat
        this.server.to(socketId).emit('newMessage', limitedMessage)
      })

      return true
    } else {
      this.logger.warn(
        `Không có socket nào của user ${receiverId} để gửi tin nhắn`
      )
      return false
    }
  }

  notifyRoleUpdate(userId: number, newRole: string) {
    const socketIds = this.userSocketMap.get(userId) || []

    if (socketIds.length > 0) {
      const message = {
        event: 'roleUpdate',
        data: {
          newRole,
        },
      }

      // Send to all sockets belonging to this user
      socketIds.forEach(socketId => {
        this.server.to(socketId).emit('roleUpdate', message)
      })

      this.logger.log(`Role update notification sent to user ${userId}`)
      return true
    }

    return false
  }

  // Thêm sự kiện echo để kiểm tra kết nối
  @SubscribeMessage('echo')
  handleEcho(
    @MessageBody() data: any,
    @ConnectedSocket() client: SocketWithUser
  ) {
    // Giới hạn kích thước dữ liệu
    const limitedData = this.limitDataSize(data)

    this.logger.log(`Received echo request: ${JSON.stringify(limitedData)}`)

    // Gửi phản hồi trực tiếp cho client
    client.emit('echoResponse', {
      received: limitedData,
      timestamp: new Date().toISOString(),
      message: 'Echo từ server',
      socketId: client.id,
      userId: client.user?.id || 'unknown',
    })

    return { event: 'echo', data: 'Đã nhận echo' }
  }

  /**
   * Thông báo tin nhắn đã được cập nhật
   */
  notifyMessageUpdated(conversationId: number, updatedMessage: any) {
    const room = `chat:${conversationId}`
    this.updateRoomActivity(room)

    // Giới hạn kích thước dữ liệu
    const limitedMessage = this.limitDataSize(updatedMessage)

    this.logger.log(`Gửi thông báo cập nhật tin nhắn đến phòng ${room}`)
    this.logger.log(
      `Chi tiết tin nhắn cập nhật: ${JSON.stringify(limitedMessage)}`
    )

    // Log danh sách các socket trong phòng
    const roomSockets = this.server.sockets.adapter.rooms.get(room)
    this.logger.log(
      `Sockets trong phòng ${room}: ${roomSockets ? [...roomSockets].join(', ') : 'không có'}`
    )

    // Gửi thông báo đến tất cả người dùng trong phòng chat với cả hai tên sự kiện
    this.logger.log(`Bắt đầu emit sự kiện 'messageUpdated' đến phòng ${room}`)
    this.server.to(room).emit('messageUpdated', limitedMessage)

    // Thêm emit sự kiện 'messageEdited' để đảm bảo khả năng tương thích
    this.logger.log(`Bắt đầu emit sự kiện 'messageEdited' đến phòng ${room}`)
    this.server.to(room).emit('messageEdited', limitedMessage)

    this.logger.log(`Đã emit các sự kiện cập nhật tin nhắn đến phòng ${room}`)

    return true
  }

  /**
   * Thông báo cho người dùng biết tài khoản của họ đã bị khóa
   */
  notifyUserBlocked(userId: number, reason?: string) {
    const socketIds = this.userSocketMap.get(userId) || []

    console.log(
      `[DEBUG] notifyUserBlocked - User ${userId} có ${socketIds.length} socket đang kết nối`
    )

    if (socketIds.length > 0) {
      const payload = {
        message: `Tài khoản của bạn đã bị khóa${reason ? ': ' + reason : '.'}`,
        reason,
      }

      this.logger.log(`Sending accountBlocked notification to user ${userId}`)
      console.log(
        `[DEBUG] Gửi sự kiện 'accountBlocked' tới các socket: ${socketIds.join(', ')}`
      )

      // Gửi thông báo đến tất cả socket của user
      socketIds.forEach(socketId => {
        console.log(`[DEBUG] Emitting 'accountBlocked' to socket ${socketId}`)
        this.server.to(socketId).emit('accountBlocked', payload)
      })
      return true
    }

    this.logger.warn(
      `No connected sockets for user ${userId} to notify about account block`
    )
    return false
  }

  /**
   * Thông báo tin nhắn đã bị xóa
   */
  notifyMessageDeleted(conversationId: number, messageId: number) {
    const room = `chat:${conversationId}`
    this.updateRoomActivity(room)
    this.logger.log(`Gửi thông báo xóa tin nhắn ${messageId} đến phòng ${room}`)

    // Log danh sách các socket trong phòng
    const roomSockets = this.server.sockets.adapter.rooms.get(room)
    this.logger.log(
      `Sockets trong phòng ${room}: ${roomSockets ? [...roomSockets].join(', ') : 'không có'}`
    )

    // Gửi thông báo đến tất cả người dùng trong phòng chat
    this.server.to(room).emit('messageDeleted', { conversationId, messageId })

    return true
  }

  /**
   * Thông báo cập nhật trạng thái thanh toán cho người dùng
   */
  notifyPaymentStatusUpdated(
    userId: number,
    paymentData: {
      id: number
      status: string
      amount: number
      description?: string
      timestamp?: string
    }
  ) {
    this.logger.log(`Gửi thông báo cập nhật thanh toán cho userId: ${userId}`)

    const userSockets = this.userSocketMap.get(userId) || []

    if (userSockets.length === 0) {
      this.logger.warn(
        `Không có socket nào của user ${userId} để gửi thông báo thanh toán`
      )
      return false
    }

    this.logger.log(
      `Gửi thông báo đến ${userSockets.length} socket của user ${userId}`
    )

    // Thêm timestamp nếu chưa có
    if (!paymentData.timestamp) {
      paymentData.timestamp = new Date().toISOString()
    }

    userSockets.forEach(socketId => {
      this.server.to(socketId).emit('paymentStatusUpdated', paymentData)
    })

    return true
  }

  @SubscribeMessage('join-admin-room')
  handleJoinAdminRoom(
    @MessageBody() data: any,
    @ConnectedSocket() client: SocketWithUser
  ) {
    // Kiểm tra xem client có role admin không
    if (client.user && client.user.role === 'ADMIN') {
      this.logger.log(`Admin socket ${client.id} đang tham gia admin-room`)
      client.join('admin-room')
      this.updateRoomActivity('admin-room')

      // Gửi xác nhận tham gia thành công
      client.emit('joinAdminRoomResponse', {
        success: true,
        message: 'Đã tham gia admin-room thành công',
        room: 'admin-room',
      })

      return { status: 'success', room: 'admin-room' }
    } else {
      this.logger.warn(
        `Client ${client.id} không phải admin nhưng đang cố gắng tham gia admin-room`
      )
      client.emit('joinAdminRoomResponse', {
        success: false,
        message: 'Không có quyền tham gia admin-room',
      })

      return { status: 'error', message: 'Không có quyền' }
    }
  }

  @SubscribeMessage('ping')
  handlePing(
    @MessageBody() data: any,
    @ConnectedSocket() client: SocketWithUser
  ) {
    this.logger.log(
      `Ping from client ${client.id}, user: ${client.user?.id || 'unknown'}`
    )

    return {
      event: 'pong',
      data: {
        serverTime: new Date().toISOString(),
        clientData: data,
        userId: client.user?.id,
        role: client.user?.role,
      },
    }
  }

  /**
   * Thông báo tới admin-room
   * Thêm cơ chế chống trùng lặp
   */
  notifyAdmins(eventName: string, data: any) {
    // Tối ưu dữ liệu
    const limitedData = this.limitDataSize(data)

    // Thêm timestamp nếu chưa có
    if (!limitedData.timestamp) {
      limitedData.timestamp = new Date().toISOString()
    }

    // Tạo ID duy nhất cho sự kiện này
    const eventId = `${eventName}-${limitedData.withdrawId || limitedData.id || 'unknown'}-${limitedData.timestamp}`

    // Kiểm tra xem sự kiện này đã được gửi gần đây chưa (trong vòng 5 giây)
    const now = Date.now()
    const existingEvent = this.recentEvents.get(eventId)

    if (existingEvent && now - existingEvent.timestamp < 5000) {
      this.logger.warn(
        `Sự kiện ${eventId} đã được gửi trước đó, bỏ qua để tránh trùng lặp.`
      )
      return 0
    }

    // Lưu sự kiện này vào danh sách đã gửi
    this.recentEvents.set(eventId, { timestamp: now, data: limitedData })

    // Xóa các sự kiện cũ (đã được di chuyển đến phương thức cleanupRecentEvents)
    this.updateRoomActivity('admin-room')
    this.logger.log(
      `Gửi sự kiện "${eventName}" đến admin-room: ${JSON.stringify(limitedData)}`
    )

    // Lấy danh sách socket trong phòng admin
    const adminRoom = this.server.sockets.adapter.rooms.get('admin-room')
    const adminSocketCount = adminRoom ? adminRoom.size : 0

    this.logger.log(`Số lượng socket trong admin-room: ${adminSocketCount}`)

    // Gửi sự kiện đến room admin
    this.server.to('admin-room').emit(eventName, limitedData)

    return adminSocketCount > 0
  }
}
