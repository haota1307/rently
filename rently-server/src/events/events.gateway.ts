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
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket
  ) {
    const { userId } = data
    if (!userId) return

    this.logger.log(`Register user: ${userId} with socket: ${client.id}`)

    // Thêm socket ID vào danh sách socket của user
    if (!this.userSocketMap.has(userId)) {
      this.userSocketMap.set(userId, [])
    }

    // Đảm bảo userSockets không undefined
    const userSockets = this.userSocketMap.get(userId) || []
    if (!userSockets.includes(client.id)) {
      userSockets.push(client.id)
      this.userSocketMap.set(userId, userSockets)
    }

    return { status: 'ok', userId }
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
}
