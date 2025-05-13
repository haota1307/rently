import { Controller, Get, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { StatisticsService } from './statistics.service'
import {
  StatisticsOverviewDTO,
  StatisticsQueryDTO,
  RevenueDataDTO,
  RoomDistributionDTO,
  AreaPostCountDTO,
  PopularAreaDTO,
} from './statistics.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @ZodSerializerDto(StatisticsOverviewDTO)
  async getOverview(
    @Query() query: StatisticsQueryDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    // Nếu là admin, cho phép xem tất cả hoặc lọc theo landlordId
    if (roleName === 'ADMIN') {
      return this.statisticsService.getOverview(query.landlordId)
    }

    // Nếu không phải admin, chỉ cho xem thống kê của chính mình
    return this.statisticsService.getOverview(userId)
  }

  @Get('revenue')
  @ZodSerializerDto(RevenueDataDTO)
  async getRevenueData(
    @Query() query: StatisticsQueryDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    const days = query.days || 7

    // Nếu là admin, cho phép xem tất cả hoặc lọc theo landlordId
    if (roleName === 'ADMIN') {
      return this.statisticsService.getRevenueData(
        days,
        query.landlordId,
        query.transaction_content
      )
    }

    // Nếu không phải admin, chỉ cho xem doanh thu của chính mình
    return this.statisticsService.getRevenueData(
      days,
      userId,
      query.transaction_content
    )
  }

  @Get('room-distribution')
  @ZodSerializerDto(RoomDistributionDTO)
  async getRoomDistribution(
    @Query() query: StatisticsQueryDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    // Nếu là admin, cho phép xem tất cả hoặc lọc theo landlordId
    if (roleName === 'ADMIN') {
      return this.statisticsService.getRoomDistribution(query.landlordId)
    }

    // Nếu không phải admin, chỉ cho xem phân phối phòng của chính mình
    return this.statisticsService.getRoomDistribution(userId)
  }

  @Get('posts-by-area')
  @ZodSerializerDto(AreaPostCountDTO)
  async getPostsByArea(
    @Query() query: StatisticsQueryDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    const limit = query.limit || 5

    // Nếu là admin, cho phép xem tất cả hoặc lọc theo landlordId
    if (roleName === 'ADMIN') {
      return this.statisticsService.getPostsByArea(limit, query.landlordId)
    }

    // Nếu không phải admin, chỉ cho xem bài đăng theo khu vực của chính mình
    return this.statisticsService.getPostsByArea(limit, userId)
  }

  @Get('popular-areas')
  @ZodSerializerDto(PopularAreaDTO)
  async getPopularAreas(
    @Query() query: StatisticsQueryDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    const limit = query.limit || 5

    console.log({ limit, userId, roleName })

    // Nếu là admin, cho xem tất cả khu vực phổ biến
    if (roleName === 'ADMIN') {
      return this.statisticsService.getPopularAreas(limit)
    }

    // Nếu không phải admin, giới hạn theo khu vực của người dùng
    return this.statisticsService.getPopularAreas(limit, userId)
  }
}
