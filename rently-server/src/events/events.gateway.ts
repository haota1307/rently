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
    client.broadcast.to(data.roomId.toString()).emit('typing', data)
    return { event: 'typing', data }
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() roomId: number, @ConnectedSocket() client: Socket) {
    client.join(roomId.toString())
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

    // Phát sự kiện đến tất cả người dùng trong phòng chat, ngoại trừ người gửi
    client.broadcast.to(room).emit('chatTyping', {
      userId: client.user.id,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    })

    return { event: 'chatTyping', data }
  }

  notifyNewMessage(conversationId: number, message: any, receiverId: number) {
    const userSockets = this.userSocketMap.get(receiverId) || []
    const room = `chat:${conversationId}`

    this.logger.log(
      `Gửi tin nhắn mới đến phòng ${room} và receiverId ${receiverId}`
    )

    // Gửi tin nhắn đến tất cả người dùng trong phòng chat
    this.server.to(room).emit('newMessage', message)

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
          message,
        })

        // Đảm bảo người nhận nhận được tin nhắn mới ngay cả khi không trong phòng chat
        this.server.to(socketId).emit('newMessage', message)
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
    this.logger.log(`Received echo request: ${JSON.stringify(data)}`)

    // Gửi phản hồi trực tiếp cho client
    client.emit('echoResponse', {
      received: data,
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
    this.logger.log(`Gửi thông báo cập nhật tin nhắn đến phòng ${room}`)
    this.logger.log(
      `Chi tiết tin nhắn cập nhật: ${JSON.stringify(updatedMessage)}`
    )

    // Log danh sách các socket trong phòng
    const roomSockets = this.server.sockets.adapter.rooms.get(room)
    this.logger.log(
      `Sockets trong phòng ${room}: ${roomSockets ? [...roomSockets].join(', ') : 'không có'}`
    )

    // Gửi thông báo đến tất cả người dùng trong phòng chat với cả hai tên sự kiện
    this.logger.log(`Bắt đầu emit sự kiện 'messageUpdated' đến phòng ${room}`)
    this.server.to(room).emit('messageUpdated', updatedMessage)

    // Thêm emit sự kiện 'messageEdited' để đảm bảo khả năng tương thích
    this.logger.log(`Bắt đầu emit sự kiện 'messageEdited' đến phòng ${room}`)
    this.server.to(room).emit('messageEdited', updatedMessage)

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
}
