import { Module } from '@nestjs/common'
import { ChatbotController } from './chatbot.controller'
import { ChatbotService } from './chatbot.service'
import { RentalModule } from '../rental/rental.module'
import { RoomModule } from '../room/room.module'
import { PostModule } from '../post/post.module'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ChatbotCacheService } from './services/cache.service'
import { ChatbotOpenAIService } from './services/openai.service'
import { ChatbotKnowledgeService } from './services/knowledge.service'
import { ChatbotSearchService } from './services/search.service'
import { ChatbotHistoryService } from './services/history.service'
import { ChatbotMessageAnalysisSimplifiedService } from './services/message-analysis-simplified.service'

@Module({
  imports: [RentalModule, RoomModule, PostModule],
  controllers: [ChatbotController],
  providers: [
    PrismaService,
    ChatbotOpenAIService,
    ChatbotCacheService,
    ChatbotKnowledgeService,
    ChatbotHistoryService,
    ChatbotSearchService,
    ChatbotMessageAnalysisSimplifiedService,
    ChatbotService,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {}
