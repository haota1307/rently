import { Module } from '@nestjs/common'
import { ChatbotController } from './chatbot.controller'
import { ChatbotService } from './chatbot.service'
import { RentalModule } from 'src/routes/rental/rental.module'
import { RoomModule } from 'src/routes/room/room.module'
import { PostModule } from 'src/routes/post/post.module'
import { SharedModule } from 'src/shared/shared.module'

@Module({
  imports: [RentalModule, RoomModule, PostModule, SharedModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
