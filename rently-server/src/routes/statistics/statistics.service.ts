import { Injectable } from '@nestjs/common'
import { StatisticsRepo } from './statistics.repo'
import {
  StatisticsOverviewType,
  RevenueDataType,
  RoomDistributionType,
  AreaPostCountType,
  PopularAreaType,
} from 'src/shared/models/shared-statistics.model'

// Thêm cache đơn giản để tránh truy vấn DB nhiều lần
interface CacheItem<T> {
  data: T
  expiry: number
}

@Injectable()
export class StatisticsService {
  // Cache đơn giản cho API revenue data
  private revenueCache: Map<string, CacheItem<RevenueDataType[]>> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 phút

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
    // Tạo key cache từ các tham số
    const cacheKey = `revenue_${days}_${landlordId || 'all'}_${transaction_content || 'default'}_${startDate || 'none'}_${endDate || 'none'}`

    // Kiểm tra cache
    const cachedData = this.revenueCache.get(cacheKey)
    if (cachedData && cachedData.expiry > Date.now()) {
      console.log('Serving revenue data from cache for key:', cacheKey)
      return cachedData.data
    }

    // Nếu không có trong cache, lấy từ repository
    const data = await this.statisticsRepo.getRevenueData(
      days,
      landlordId,
      transaction_content,
      startDate,
      endDate
    )

    // Lưu vào cache
    this.revenueCache.set(cacheKey, {
      data,
      expiry: Date.now() + this.CACHE_TTL,
    })

    return data
  }

  async getLandlordTransactionData(
    days: number,
    landlordId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<RevenueDataType[]> {
    // Tạo key cache
    const cacheKey = `landlord_transaction_${days}_${landlordId || 'all'}_${startDate || 'none'}_${endDate || 'none'}`

    // Kiểm tra cache
    const cachedData = this.revenueCache.get(cacheKey)
    if (cachedData && cachedData.expiry > Date.now()) {
      console.log(
        'Serving landlord transaction data from cache for key:',
        cacheKey
      )
      return cachedData.data
    }

    // Nếu không có trong cache, lấy từ repository
    const data = await this.statisticsRepo.getLandlordTransactionData(
      days,
      landlordId,
      startDate,
      endDate
    )

    // Lưu vào cache
    this.revenueCache.set(cacheKey, {
      data,
      expiry: Date.now() + this.CACHE_TTL,
    })

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
}
