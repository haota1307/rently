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
    landlordId?: number,
    transaction_content?: string,
    startDate?: string,
    endDate?: string
  ): Promise<RevenueDataType[]> {
    console.log('🔍 getRevenueData called with:', {
      days,
      landlordId,
      transaction_content,
      startDate,
      endDate,
    })

    console.log('🔄 Fetching from database...')

    const data = await this.statisticsRepo.getRevenueData(
      days,
      landlordId,
      transaction_content,
      startDate,
      endDate
    )

    console.log('📊 Fresh data from database:', data)

    return data
  }

  async getLandlordTransactionData(
    days: number,
    landlordId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<RevenueDataType[]> {
    const data = await this.statisticsRepo.getLandlordTransactionData(
      days,
      landlordId,
      startDate,
      endDate
    )

    return data
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

  async debugTransactions(
    days: number = 7,
    landlordId?: number,
    transaction_content?: string
  ) {
    return this.statisticsRepo.debugTransactions(
      days,
      landlordId,
      transaction_content
    )
  }
}
