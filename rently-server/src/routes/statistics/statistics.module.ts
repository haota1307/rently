import { Module } from '@nestjs/common'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { StatisticsRepo } from './statistics.repo'

@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService, StatisticsRepo],
})
export class StatisticsModule {}
