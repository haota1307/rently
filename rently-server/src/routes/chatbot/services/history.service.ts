import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class ChatbotHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Phương thức lưu tin nhắn đơn giản hóa cho version mới
   * @param userId ID của người dùng
   * @param content Nội dung tin nhắn
   * @param role Vai trò người gửi (user/bot)
   * @param metadata Metadata kèm theo tin nhắn (optional)
   */
  async saveMessage(
    userId: number,
    content: string,
    role: 'user' | 'bot',
    metadata: any = null
  ): Promise<void> {
    try {
      // Chỉ lưu tin nhắn khi người dùng đã đăng nhập (có userId)
      if (!userId) {
        console.log('Không lưu tin nhắn vì người dùng chưa đăng nhập')
        return
      }

      if (role === 'user') {
        // Lưu tin nhắn người dùng
        await this.prisma.$executeRaw`
          INSERT INTO "ChatbotMessage" ("message", "userId", "createdAt", "isRead")
          VALUES (${content}, ${userId}, now(), true)
        `
      } else {
        // Lưu tin nhắn bot
        const lastUserMessageId = await this.getLastMessageIdByUserId(userId)

        // Lưu response vào tin nhắn cuối cùng của user
        if (lastUserMessageId) {
          await this.prisma.$executeRaw`
            UPDATE "ChatbotMessage"
            SET "response" = ${content},
                "results" = ${metadata ? JSON.stringify(metadata) : null}::jsonb
            WHERE "id" = ${lastUserMessageId}
          `
        } else {
          // Nếu không tìm thấy tin nhắn user, tạo một tin nhắn mới
          await this.prisma.$executeRaw`
            INSERT INTO "ChatbotMessage" ("response", "userId", "createdAt", "isRead")
            VALUES (${content}, ${userId}, now(), true)
          `
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu tin nhắn chatbot:', error)
      // Không throw lỗi để không làm ảnh hưởng đến luồng chính
    }
  }

  /**
   * Lấy ID tin nhắn cuối cùng của người dùng
   */
  private async getLastMessageIdByUserId(
    userId: number
  ): Promise<number | null> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM "ChatbotMessage"
        WHERE "userId" = ${userId} AND "message" IS NOT NULL AND "response" IS NULL
        ORDER BY "createdAt" DESC
        LIMIT 1
      `

      return result[0]?.id || null
    } catch (error) {
      console.error('Lỗi khi lấy ID tin nhắn cuối cùng:', error)
      return null
    }
  }

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
