import { Body, Controller, Post } from '@nestjs/common'
import { ChatbotService } from './chatbot.service'

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  async search(@Body() body: { message: string }) {
    if (!body.message || body.message.trim() === '') {
      return { error: 'Tin nhắn không được để trống' }
    }
    const result = await this.chatbotService.search(body.message)
    return result
  }
}
