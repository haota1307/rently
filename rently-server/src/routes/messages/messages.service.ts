import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'
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
import { NotificationService } from 'src/routes/notification/notification.service'

// Giới hạn kích thước message
const MAX_MESSAGE_SIZE = 10000 // 10KB
const DEFAULT_PAGE_SIZE = 20 // Số lượng tin nhắn mặc định mỗi trang

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepo: MessagesRepo,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Lấy danh sách cuộc trò chuyện của người dùng
   */
  async getConversations(userId: number, query: GetConversationsQueryType) {
    // Đảm bảo có giới hạn số lượng kết quả trả về
    const limit =
      query.limit && query.limit > 0
        ? Math.min(query.limit, 100) // Giới hạn tối đa 100 kết quả
        : 20 // Mặc định 20 kết quả

    const modifiedQuery = {
      ...query,
      limit,
    }

    return this.messagesRepo.getConversations(userId, modifiedQuery)
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

    // Đảm bảo có giới hạn số lượng tin nhắn trả về
    const modifiedQuery = {
      ...query,
      limit:
        query.limit && query.limit > 0
          ? Math.min(query.limit, 50) // Giới hạn tối đa 50 tin nhắn
          : DEFAULT_PAGE_SIZE, // Mặc định 20 tin nhắn
    }

    return this.messagesRepo.getMessages(conversationId, userId, modifiedQuery)
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

    // Giới hạn kích thước nội dung tin nhắn
    if (
      data.content &&
      typeof data.content === 'string' &&
      data.content.length > MAX_MESSAGE_SIZE
    ) {
      data.content = data.content.substring(0, MAX_MESSAGE_SIZE)
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
      // Giới hạn kích thước tin nhắn đầu tiên
      const initialMessage =
        typeof data.initialMessage === 'string' &&
        data.initialMessage.length > MAX_MESSAGE_SIZE
          ? data.initialMessage.substring(0, MAX_MESSAGE_SIZE)
          : data.initialMessage

      await this.messagesRepo.createMessage(userId, {
        conversationId: conversation.id,
        content: initialMessage,
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

  /**
   * Cập nhật nội dung tin nhắn
   */
  async editMessage(userId: number, messageId: number, content: string) {
    // Lấy thông tin của tin nhắn
    const message = await this.messagesRepo.getMessageById(messageId)

    if (!message) {
      throw new Error('Tin nhắn không tồn tại')
    }

    // Kiểm tra xem người dùng có phải là người gửi tin nhắn không
    if (message.senderId !== userId) {
      throw new UnauthorizedException(
        'Bạn không có quyền chỉnh sửa tin nhắn này'
      )
    }

    // Giới hạn kích thước nội dung
    if (content && content.length > MAX_MESSAGE_SIZE) {
      content = content.substring(0, MAX_MESSAGE_SIZE)
    }

    // Cập nhật nội dung tin nhắn
    const updatedMessage = await this.messagesRepo.updateMessage(
      messageId,
      content
    )

    // Gửi sự kiện thông báo tin nhắn đã được cập nhật với thông tin đầy đủ
    this.eventsGateway.notifyMessageUpdated(message.conversationId, {
      id: messageId,
      content,
      conversationId: message.conversationId,
      messageId: messageId, // Thêm trường này để đảm bảo tương thích
      isEdited: true,
    })

    return updatedMessage
  }

  /**
   * Xóa tin nhắn
   */
  async deleteMessage(userId: number, messageId: number) {
    // Lấy thông tin của tin nhắn
    const message = await this.messagesRepo.getMessageById(messageId)

    if (!message) {
      throw new Error('Tin nhắn không tồn tại')
    }

    // Kiểm tra xem người dùng có phải là người gửi tin nhắn không
    if (message.senderId !== userId) {
      throw new UnauthorizedException('Bạn không có quyền xóa tin nhắn này')
    }

    // Xóa tin nhắn (soft delete)
    const result = await this.messagesRepo.deleteMessage(messageId)

    // Gửi sự kiện thông báo tin nhắn đã bị xóa
    this.eventsGateway.notifyMessageDeleted(message.conversationId, messageId)

    return result
  }

  // Cập nhật phương thức gửi tin nhắn mới
  async sendMessage(senderId: number, conversationId: number, content: string) {
    try {
      // Kiểm tra quyền truy cập cuộc trò chuyện
      const isMember = await this.messagesRepo.isConversationMember(
        conversationId,
        senderId
      )

      if (!isMember) {
        throw new UnauthorizedException(
          'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này'
        )
      }

      // Lấy thông tin conversation
      const conversation =
        await this.messagesRepo.getConversationById(conversationId)

      if (!conversation) {
        throw new NotFoundException('Cuộc trò chuyện không tồn tại')
      }

      // Giới hạn kích thước nội dung
      if (content && content.length > MAX_MESSAGE_SIZE) {
        content = content.substring(0, MAX_MESSAGE_SIZE)
      }

      // Xác định người nhận
      const receiverId =
        conversation.userOneId === senderId
          ? conversation.userTwoId
          : conversation.userOneId

      // Tạo tin nhắn
      const message = await this.messagesRepo.createMessage(senderId, {
        conversationId,
        content,
        type: MessageType.TEXT,
      })

      // Gửi thông báo tới người nhận
      await this.notificationService.notifyNewMessage(
        receiverId,
        conversation.userOneId === senderId
          ? conversation.userOne.name
          : conversation.userTwo.name,
        conversationId
      )

      return message
    } catch (error) {
      throw error
    }
  }
}
