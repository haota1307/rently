import { Body, Controller, Get, Post, Query, Patch } from '@nestjs/common'
import { ChatbotService } from './chatbot.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'

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

    console.log('body chatbot', body)

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

  @Patch('version')
  @IsPublic()
  async setVersion(@Body() body: { useLegacy: boolean }) {
    // Kiểm tra xem body có useLegacy không
    if (typeof body.useLegacy !== 'boolean') {
      return { error: 'useLegacy phải là giá trị boolean' }
    }

    // Gọi method để đặt phiên bản
    this.chatbotService.setAnalysisVersion(body.useLegacy)

    return {
      success: true,
      message: `Đã chuyển sang sử dụng phiên bản ${body.useLegacy ? 'đầy đủ' : 'đơn giản hóa'}`,
      useLegacy: body.useLegacy,
    }
  }
}
