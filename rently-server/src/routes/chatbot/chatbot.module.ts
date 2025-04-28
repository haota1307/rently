import { Module } from '@nestjs/common'
import { ChatbotController } from './chatbot.controller'
import { ChatbotService } from './chatbot.service'
import { RentalModule } from 'src/routes/rental/rental.module'
import { RoomModule } from 'src/routes/room/room.module'
import { PostModule } from 'src/routes/post/post.module'

@Module({
  imports: [RentalModule, RoomModule, PostModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
