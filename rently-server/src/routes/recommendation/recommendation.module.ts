import { Module } from '@nestjs/common'
import { RecommendationController } from './recommendation.controller'
import { RecommendationService } from './recommendation.service'
import { RecommendationRepo } from './recommendation.repo'
import { SharedModule } from 'src/shared/shared.module'

@Module({
  imports: [SharedModule],
  controllers: [RecommendationController],
  providers: [RecommendationService, RecommendationRepo],
  exports: [RecommendationService, RecommendationRepo],
})
export class RecommendationModule {}
