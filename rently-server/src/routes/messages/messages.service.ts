import { Injectable, UnauthorizedException } from '@nestjs/common'
import { MessagesRepo } from './messages.repo'
import {
  CreateConversationBodyType,
  CreateMessageBodyType,
  GetConversationsQueryType,
  GetMessagesParamsType,
  GetMessagesQueryType,
} from './messages.dto'
import { EventsGateway } from 'src/events/events.gateway'
import { MessageType } from './messages.dto'

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepo: MessagesRepo,
    private readonly eventsGateway: EventsGateway
  ) {}

  /**
   * Lấy danh sách cuộc trò chuyện của người dùng
   */
  async getConversations(userId: number, query: GetConversationsQueryType) {
    return this.messagesRepo.getConversations(userId, query)
  }

  /**
   * Lấy tin nhắn của một cuộc trò chuyện
   */
  async getMessages(
    userId: number,
    params: GetMessagesParamsType,
    query: GetMessagesQueryType
  ) {
    const { conversationId } = params

    // Kiểm tra xem người dùng có phải là thành viên của cuộc trò chuyện không
    const isMember = await this.messagesRepo.isConversationMember(
      conversationId,
      userId
    )

    if (!isMember) {
      throw new UnauthorizedException(
        'Bạn không có quyền truy cập cuộc trò chuyện này'
      )
    }

    return this.messagesRepo.getMessages(conversationId, userId, query)
  }

  /**
   * Tạo tin nhắn mới
   */
  async createMessage(userId: number, data: CreateMessageBodyType) {
    // Kiểm tra xem người dùng có phải là thành viên của cuộc trò chuyện không
    const isMember = await this.messagesRepo.isConversationMember(
      data.conversationId,
      userId
    )

    if (!isMember) {
      throw new UnauthorizedException(
        'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này'
      )
    }

    // Tạo tin nhắn mới
    const message = await this.messagesRepo.createMessage(userId, data)

    // Lấy thông tin conversation
    const conversation = await this.messagesRepo.getConversationById(
      data.conversationId
    )

    if (!conversation) {
      throw new Error('Cuộc trò chuyện không tồn tại')
    }

    // Xác định ID của người nhận để gửi thông báo
    const receiverId =
      conversation.userOneId === userId
        ? conversation.userTwoId
        : conversation.userOneId

    // Gửi sự kiện thông báo tin nhắn mới thông qua WebSocket
    this.eventsGateway.notifyNewMessage(
      data.conversationId,
      message,
      receiverId
    )

    return message
  }

  /**
   * Tạo cuộc trò chuyện mới
   */
  async createConversation(userId: number, data: CreateConversationBodyType) {
    // Kiểm tra xem đã có cuộc trò chuyện giữa hai người dùng chưa
    const existingConversation =
      await this.messagesRepo.findConversationBetweenUsers(
        userId,
        data.userTwoId
      )

    if (existingConversation) {
      // Trả về cuộc trò chuyện đã tồn tại
      return {
        conversation: existingConversation,
        created: false,
      }
    }

    // Tạo cuộc trò chuyện mới
    const conversation = await this.messagesRepo.createConversation(
      userId,
      data
    )

    // Tạo tin nhắn đầu tiên nếu có
    if (data.initialMessage) {
      await this.messagesRepo.createMessage(userId, {
        conversationId: conversation.id,
        content: data.initialMessage,
        type: MessageType.TEXT,
      })

      // Gửi sự kiện thông báo cuộc trò chuyện mới thông qua WebSocket
      this.eventsGateway.server
        .to(data.userTwoId.toString())
        .emit('newConversation', conversation)
    }

    return {
      conversation,
      created: true,
    }
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  async markAsRead(userId: number, conversationId: number) {
    // Kiểm tra xem người dùng có phải là thành viên của cuộc trò chuyện không
    const isMember = await this.messagesRepo.isConversationMember(
      conversationId,
      userId
    )

    if (!isMember) {
      throw new UnauthorizedException(
        'Bạn không có quyền truy cập cuộc trò chuyện này'
      )
    }

    return this.messagesRepo.markMessagesAsRead(conversationId, userId)
  }

  /**
   * Kiểm tra quyền truy cập cuộc trò chuyện
   */
  async checkConversationAccess(userId: number, conversationId: number) {
    // Kiểm tra xem người dùng có phải là thành viên của cuộc trò chuyện không
    const isMember = await this.messagesRepo.isConversationMember(
      conversationId,
      userId
    )

    if (!isMember) {
      throw new UnauthorizedException(
        'Bạn không có quyền truy cập cuộc trò chuyện này'
      )
    }

    return true
  }
}
