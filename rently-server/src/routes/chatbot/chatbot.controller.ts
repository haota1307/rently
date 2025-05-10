import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ChatbotService } from './chatbot.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  @IsPublic()
  async search(
    @Body() body: { message: string; userId?: number },
    @ActiveUser('userId') activeUserId?: number
  ) {
    if (!body.message || body.message.trim() === '') {
      return { error: 'Tin nhắn không được để trống' }
    }

    // Ưu tiên sử dụng userId từ token nếu có, nếu không thì lấy từ body request
    // Nếu không có cả hai, userId sẽ là undefined - người dùng không đăng nhập
    const userId = activeUserId || body.userId

    // Gọi service với userId có thể là undefined
    const result = await this.chatbotService.search(body.message, userId)
    return result
  }

  @Get('history')
  // Không đánh dấu @IsPublic() để đảm bảo yêu cầu xác thực
  async getHistory(
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
    @ActiveUser('userId') userId?: number
  ) {
    // Nếu không có userId (không đăng nhập hoặc token không hợp lệ)
    if (!userId) {
      return {
        messages: [],
        hasMore: false,
        total: 0,
      }
    }

    return this.chatbotService.getChatHistory(
      userId,
      parseInt(limit),
      parseInt(offset)
    )
  }
}
