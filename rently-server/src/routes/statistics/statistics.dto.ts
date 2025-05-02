import { createZodDto } from 'nestjs-zod'
import {
  StatisticsOverviewSchema,
  StatisticsQuerySchema,
  RevenueDataSchema,
  RoomDistributionSchema,
  AreaPostCountSchema,
  PopularAreaSchema,
} from 'src/shared/models/shared-statistics.model'

export class StatisticsOverviewDTO extends createZodDto(
  StatisticsOverviewSchema
) {}
export class StatisticsQueryDTO extends createZodDto(StatisticsQuerySchema) {}
export class RevenueDataDTO extends createZodDto(RevenueDataSchema) {}
export class RoomDistributionDTO extends createZodDto(RoomDistributionSchema) {}
export class AreaPostCountDTO extends createZodDto(AreaPostCountSchema) {}
export class PopularAreaDTO extends createZodDto(PopularAreaSchema) {}
