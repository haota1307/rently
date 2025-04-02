import { Injectable } from '@nestjs/common'
import { StatisticsRepo } from './statistics.repo'
import { StatisticsOverviewType } from 'src/shared/models/shared-statistics.model'

@Injectable()
export class StatisticsService {
  constructor(private readonly statisticsRepo: StatisticsRepo) {}

  async getOverview(landlordId?: number): Promise<StatisticsOverviewType> {
    return this.statisticsRepo.getOverview(landlordId)
  }
}
