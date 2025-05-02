import { Injectable } from '@nestjs/common'
import { StatisticsRepo } from './statistics.repo'
import {
  StatisticsOverviewType,
  RevenueDataType,
  RoomDistributionType,
  AreaPostCountType,
  PopularAreaType,
} from 'src/shared/models/shared-statistics.model'

@Injectable()
export class StatisticsService {
  constructor(private readonly statisticsRepo: StatisticsRepo) {}

  async getOverview(landlordId?: number): Promise<StatisticsOverviewType> {
    return this.statisticsRepo.getOverview(landlordId)
  }

  async getRevenueData(
    days: number,
    landlordId?: number
  ): Promise<RevenueDataType[]> {
    return this.statisticsRepo.getRevenueData(days, landlordId)
  }

  async getRoomDistribution(
    landlordId?: number
  ): Promise<RoomDistributionType[]> {
    return this.statisticsRepo.getRoomDistribution(landlordId)
  }

  async getPostsByArea(
    limit: number,
    landlordId?: number
  ): Promise<AreaPostCountType[]> {
    return this.statisticsRepo.getPostsByArea(limit, landlordId)
  }

  async getPopularAreas(
    limit: number,
    userId?: number
  ): Promise<PopularAreaType[]> {
    return this.statisticsRepo.getPopularAreas(limit, userId)
  }
}
