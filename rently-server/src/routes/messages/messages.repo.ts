import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateConversationBodyType,
  CreateMessageBodyType,
  GetConversationsQueryType,
  GetMessagesQueryType,
} from './messages.dto'

@Injectable()
export class MessagesRepo {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Lấy danh sách cuộc trò chuyện của một người dùng
   */
  async getConversations(userId: number, query: GetConversationsQueryType) {
    const { page, limit, search } = query
    const skip = (page - 1) * limit

    // Lọc cuộc trò chuyện theo người dùng
    const whereClause = {
      OR: [{ userOneId: userId }, { userTwoId: userId }],
    }

    // Thêm điều kiện tìm kiếm theo tên nếu có
    if (search) {
      whereClause['OR'] = [
        {
          userOne: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          userTwo: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ] as any // Cast để tránh lỗi TypeScript
    }

    // Đếm tổng số cuộc trò chuyện
    const totalItems = await this.prismaService.conversation.count({
      where: whereClause,
    })

    // Lấy danh sách cuộc trò chuyện
    const conversations = await this.prismaService.conversation.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        userOne: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    // Tính số trang
    const totalPages = Math.ceil(totalItems / limit)

    // Thêm thông tin về tin nhắn mới nhất và số tin nhắn chưa đọc
    const conversationsWithExtra = await Promise.all(
      conversations.map(async conversation => {
        // Lấy tin nhắn mới nhất
        const latestMessage = conversation.messages[0] || null

        // Đếm số tin nhắn chưa đọc
        const unreadCount = await this.prismaService.conversationMessage.count({
          where: {
            conversationId: conversation.id,
            senderId: {
              not: userId, // Chỉ đếm tin nhắn từ người khác
            },
            isRead: false,
          },
        })

        // Trả về cuộc trò chuyện với thông tin bổ sung
        return {
          id: conversation.id,
          createdAt: conversation.createdAt,
          userOneId: conversation.userOneId,
          userTwoId: conversation.userTwoId,
          userOne: conversation.userOne,
          userTwo: conversation.userTwo,
          latestMessage: latestMessage
            ? {
                id: latestMessage.id,
                content: latestMessage.content,
                createdAt: latestMessage.createdAt,
                senderId: latestMessage.senderId,
                conversationId: conversation.id,
                // Sử dụng as any để tránh lỗi TypeScript
                type: (latestMessage as any).type || null,
                fileUrl: (latestMessage as any).fileUrl || null,
                fileName: (latestMessage as any).fileName || null,
                fileSize: (latestMessage as any).fileSize || null,
                fileType: (latestMessage as any).fileType || null,
                thumbnailUrl: (latestMessage as any).thumbnailUrl || null,
                isRead: latestMessage.isRead,
                sender: latestMessage.sender,
              }
            : null,
          unreadCount,
        }
      })
    )

    return {
      data: conversationsWithExtra,
      totalItems,
      page,
      limit,
      totalPages,
    }
  }

  /**
   * Lấy thông tin chi tiết của một cuộc trò chuyện
   */
  async getConversationById(conversationId: number) {
    return this.prismaService.conversation.findUnique({
      where: { id: conversationId },
      include: {
        userOne: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })
  }

  /**
   * Tìm kiếm cuộc trò chuyện giữa hai người dùng
   */
  async findConversationBetweenUsers(userOneId: number, userTwoId: number) {
    return this.prismaService.conversation.findFirst({
      where: {
        OR: [
          {
            userOneId: userOneId,
            userTwoId: userTwoId,
          },
          {
            userOneId: userTwoId,
            userTwoId: userOneId,
          },
        ],
      },
      include: {
        userOne: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })
  }

  /**
   * Tạo cuộc trò chuyện mới
   */
  async createConversation(
    userOneId: number,
    data: CreateConversationBodyType
  ) {
    return this.prismaService.conversation.create({
      data: {
        userOneId,
        userTwoId: data.userTwoId,
      },
      include: {
        userOne: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })
  }

  /**
   * Lấy tin nhắn trong cuộc trò chuyện
   */
  async getMessages(
    conversationId: number,
    userId: number,
    query: GetMessagesQueryType
  ) {
    const { page, limit } = query
    const skip = (page - 1) * limit

    // Đếm tổng số tin nhắn
    const totalItems = await this.prismaService.conversationMessage.count({
      where: {
        conversationId,
      },
    })

    // Tính tổng số trang
    const totalPages = Math.ceil(totalItems / limit)

    // Lấy danh sách tin nhắn
    const messages = await this.prismaService.conversationMessage.findMany({
      where: {
        conversationId,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // Đánh dấu tin nhắn đã đọc nếu người gửi khác với người đang xem
    await this.markMessagesAsRead(conversationId, userId)

    return {
      data: messages,
      totalItems,
      page,
      limit,
      totalPages,
    }
  }

  /**
   * Tạo tin nhắn mới
   */
  async createMessage(senderId: number, data: CreateMessageBodyType) {
    // Tạo object data để truyền vào Prisma create
    const messageData: any = {
      content: data.content,
      conversationId: data.conversationId,
      senderId,
    }

    if (data.type) messageData.type = data.type
    if (data.fileUrl) messageData.fileUrl = data.fileUrl
    if (data.fileName) messageData.fileName = data.fileName
    if (data.fileSize) messageData.fileSize = data.fileSize
    if (data.fileType) messageData.fileType = data.fileType
    if (data.thumbnailUrl) messageData.thumbnailUrl = data.thumbnailUrl

    const message = await this.prismaService.conversationMessage.create({
      data: messageData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return message
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  async markMessagesAsRead(conversationId: number, userId: number) {
    return this.prismaService.conversationMessage.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId, // Chỉ đánh dấu tin nhắn từ người khác
        },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })
  }

  /**
   * Kiểm tra người dùng có phải là thành viên của cuộc trò chuyện không
   */
  async isConversationMember(conversationId: number, userId: number) {
    const conversation = await this.prismaService.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      return false
    }

    return (
      conversation.userOneId === userId || conversation.userTwoId === userId
    )
  }

  async markMessageAsRead(messageId: number, userId: number) {
    await this.prismaService.conversationMessage.update({
      where: { id: messageId },
      data: {
        isRead: true,
      },
    })

    return { success: true }
  }

  /**
   * Lấy thông tin tin nhắn theo ID
   */
  async getMessageById(messageId: number) {
    return this.prismaService.conversationMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: true,
      },
    })
  }

  /**
   * Cập nhật nội dung tin nhắn
   */
  async updateMessage(messageId: number, content: string) {
    // Lấy tin nhắn hiện tại
    const message = await this.prismaService.conversationMessage.findUnique({
      where: { id: messageId },
    })

    const updatedContent = `${content}`

    return this.prismaService.conversationMessage.update({
      where: { id: messageId },
      data: {
        content: updatedContent,
        isEdited: true,
      },
      include: {
        sender: true,
      },
    })
  }

  /**
   * Xóa tin nhắn
   */
  async deleteMessage(messageId: number) {
    const message = await this.prismaService.conversationMessage.update({
      where: { id: messageId },
      data: {
        content: 'Tin nhắn đã bị xóa',
        isDeleted: true,
      },
      include: {
        sender: true,
      },
    })

    return { success: true, message }
  }
}
