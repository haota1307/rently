import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { RecommendationController } from './recommendation.controller'
import { RecommendationService } from './recommendation.service'
import { RecommendationRepo } from './recommendation.repo'
import { RecommendationOptimizedRepo } from './recommendation-optimized.repo'
import { RecommendationCacheService } from './recommendation-cache.service'
import { RecommendationPerformanceService } from './recommendation-performance.service'
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
    RecommendationOptimizedRepo,
    RecommendationCacheService,
    RecommendationPerformanceService,
    ChatbotOpenAIService,
  ],
  exports: [
    RecommendationService,
    RecommendationRepo,
    RecommendationOptimizedRepo,
    RecommendationCacheService,
    RecommendationPerformanceService,
  ],
})
export class RecommendationModule {}
