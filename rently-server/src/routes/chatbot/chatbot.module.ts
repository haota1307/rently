import { Module } from '@nestjs/common'
import { ChatbotController } from './chatbot.controller'
import { ChatbotService } from './chatbot.service'
import { RentalModule } from 'src/routes/rental/rental.module'

@Module({
  imports: [RentalModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
