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
    console.log('🔍 DEBUG overview:', { userId, roleName, query })

    // Nếu là admin và có tham số "global=true", xem toàn hệ thống
    if (roleName === 'ADMIN' && query.global === true) {
      console.log('👤 ADMIN accessing GLOBAL overview')
      return this.statisticsService.getOverview(query.landlordId)
    }

    // Ngược lại, mọi user (kể cả admin) đều xem dữ liệu cá nhân
    const targetUserId =
      roleName === 'ADMIN' && query.landlordId ? query.landlordId : userId

    console.log(
      '🏠 User accessing personal overview data, targetId:',
      targetUserId
    )
    return this.statisticsService.getOverview(targetUserId)
  }

  @Get('revenue')
  @ZodSerializerDto(RevenueDataDTO)
  async getRevenueData(
    @Query() query: StatisticsQueryDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    const days = query.days || 7
    const startDate = query.startDate
    const endDate = query.endDate

    // Nếu là admin, cho phép xem tất cả hoặc lọc theo landlordId
    if (roleName === 'ADMIN') {
      return this.statisticsService.getRevenueData(
        days,
        query.landlordId,
        query.transaction_content,
        startDate,
        endDate
      )
    }

    // Nếu không phải admin, chỉ cho xem doanh thu của chính mình
    return this.statisticsService.getRevenueData(
      days,
      userId,
      query.transaction_content,
      startDate,
      endDate
    )
  }

  @Get('landlord-transaction')
  @ZodSerializerDto(RevenueDataDTO)
  async getLandlordTransactionData(
    @Query() query: StatisticsQueryDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    const days = query.days || 7
    const startDate = query.startDate
    const endDate = query.endDate

    console.log('🔍 DEBUG landlord-transaction:', { userId, roleName, query })

    // API này dành cho trang landlord cá nhân (/cho-thue)
    // Dù là Admin hay Landlord, đều chỉ xem dữ liệu của chính mình
    // Chỉ khi Admin muốn xem của landlord khác thì truyền landlordId
    const targetLandlordId =
      roleName === 'ADMIN' && query.landlordId ? query.landlordId : userId

    console.log(
      '🏠 User accessing own landlord transaction data, targetId:',
      targetLandlordId
    )
    return this.statisticsService.getLandlordTransactionData(
      days,
      targetLandlordId,
      startDate,
      endDate
    )
  }

  @Get('room-distribution')
  @ZodSerializerDto(RoomDistributionDTO)
  async getRoomDistribution(
    @Query() query: StatisticsQueryDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    console.log('🔍 DEBUG room-distribution:', { userId, roleName, query })

    // Nếu là admin và có tham số "global=true", xem toàn hệ thống
    if (roleName === 'ADMIN' && query.global === true) {
      console.log('👤 ADMIN accessing GLOBAL room distribution')
      return this.statisticsService.getRoomDistribution(query.landlordId)
    }

    // Ngược lại, mọi user (kể cả admin) đều xem dữ liệu cá nhân
    const targetUserId =
      roleName === 'ADMIN' && query.landlordId ? query.landlordId : userId

    console.log(
      '🏠 User accessing personal room distribution, targetId:',
      targetUserId
    )
    return this.statisticsService.getRoomDistribution(targetUserId)
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

    // Nếu là admin, xem tất cả khu vực phổ biến (toàn hệ thống)
    if (roleName === 'ADMIN') {
      return this.statisticsService.getPopularAreas(limit)
    }

    // Nếu không phải admin, giới hạn theo khu vực của người dùng
    return this.statisticsService.getPopularAreas(limit, userId)
  }
}
