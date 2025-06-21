import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { RecommendationController } from './recommendation.controller'
import { RecommendationService } from './recommendation.service'
import { RecommendationRepo } from './recommendation.repo'

import { RecommendationCacheService } from './recommendation-cache.service'
import { RecommendationPerformanceService } from './recommendation-performance.service'
import { MemoryCacheService } from './memory-cache.service'
import { SharedModule } from 'src/shared/shared.module'
import { ChatbotOpenAIService } from '../chatbot/services/openai.service'

@Module({
  imports: [
    SharedModule,
    ScheduleModule.forRoot(), // Enable background jobs
  ],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    RecommendationRepo,
    RecommendationCacheService,
    RecommendationPerformanceService,
    MemoryCacheService,
    ChatbotOpenAIService,
  ],
  exports: [
    RecommendationService,
    RecommendationRepo,
    RecommendationCacheService,
    RecommendationPerformanceService,
    MemoryCacheService,
  ],
})
export class RecommendationModule {}
