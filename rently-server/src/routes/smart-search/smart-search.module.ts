import { Module } from '@nestjs/common'
import { ChatbotModule } from '../chatbot/chatbot.module'
import { SmartSearchController } from 'src/routes/smart-search/smart-search.controller'
import { SmartSearchService } from 'src/routes/smart-search/smart-search.service'

@Module({
  imports: [ChatbotModule],
  controllers: [SmartSearchController],
  providers: [SmartSearchService],
  exports: [SmartSearchService],
})
export class SmartSearchModule {}
