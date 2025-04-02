import { Controller, Get, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { StatisticsService } from './statistics.service'
import { StatisticsOverviewDTO, StatisticsQueryDTO } from './statistics.dto'
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
    if (roleName === 'admin') {
      return this.statisticsService.getOverview(query.landlordId)
    }

    // Nếu không phải admin, chỉ cho xem thống kê của chính mình
    return this.statisticsService.getOverview(userId)
  }
}
