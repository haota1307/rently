import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class ChatbotHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lưu tin nhắn của người dùng và phản hồi của chatbot vào database
   */
  async saveChatMessage(
    message: string,
    response: string,
    criteria: any | null,
    results: any[],
    userId?: number
  ): Promise<void> {
    try {
      // Chỉ lưu tin nhắn khi người dùng đã đăng nhập (có userId)
      if (!userId) {
        console.log('Không lưu tin nhắn vì người dùng chưa đăng nhập')
        return
      }

      // Sử dụng try-catch để bảo vệ luồng chính nếu schema chưa được cập nhật
      try {
        // Lưu vào database
        await this.prisma.$executeRaw`
          INSERT INTO "ChatbotMessage" ("message", "response", "criteria", "results", "userId", "createdAt", "isRead")
          VALUES (${message}, ${response}, ${
            criteria ? JSON.stringify(criteria) : null
          }::jsonb, ${
            results.length > 0 ? JSON.stringify(results) : null
          }::jsonb, ${userId}, now(), true)
        `
      } catch (dbError) {
        console.error(
          'Lỗi khi lưu tin nhắn chatbot (có thể schema chưa được cập nhật):',
          dbError
        )
      }
    } catch (error) {
      console.error('Lỗi khi lưu tin nhắn chatbot:', error)
      // Không throw lỗi để không làm ảnh hưởng đến luồng chính
    }
  }

  /**
   * Lấy lịch sử chat của người dùng
   */
  async getChatHistory(userId: number, limit: number = 10, offset: number = 0) {
    try {
      // Truy vấn raw SQL để lấy lịch sử chat
      const query = `
        SELECT id, message, response, "createdAt"
        FROM "ChatbotMessage"
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
        LIMIT $2 OFFSET $3
      `

      const countQuery = `
        SELECT COUNT(*) as total
        FROM "ChatbotMessage"
        WHERE "userId" = $1
      `

      // Thực hiện truy vấn
      const messages = await this.prisma.$queryRawUnsafe(
        query,
        userId,
        limit,
        offset
      )
      const totalResult = await this.prisma.$queryRawUnsafe<
        Array<{ total: string }>
      >(countQuery, userId)

      const total = parseInt(totalResult[0]?.total || '0')
      const hasMore = offset + limit < total

      return {
        messages,
        hasMore,
        total,
      }
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử chat:', error)
      return {
        messages: [],
        hasMore: false,
        total: 0,
      }
    }
  }
}
