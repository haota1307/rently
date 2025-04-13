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
          latestMessage,
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
   * Lấy tin nhắn của một cuộc trò chuyện
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
      where: { conversationId },
    })

    // Lấy danh sách tin nhắn
    const messages = await this.prismaService.conversationMessage.findMany({
      where: { conversationId },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc', // Lấy tin nhắn mới nhất trước
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

    // Đánh dấu các tin nhắn chưa đọc của người dùng khác là đã đọc
    await this.prismaService.conversationMessage.updateMany({
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

    // Tính số trang
    const totalPages = Math.ceil(totalItems / limit)

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
    return this.prismaService.conversationMessage.create({
      data: {
        content: data.content,
        conversationId: data.conversationId,
        senderId,
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
}
