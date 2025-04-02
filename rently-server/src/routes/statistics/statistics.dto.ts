import { createZodDto } from 'nestjs-zod'
import {
  StatisticsOverviewSchema,
  StatisticsQuerySchema,
} from 'src/shared/models/shared-statistics.model'

export class StatisticsOverviewDTO extends createZodDto(
  StatisticsOverviewSchema
) {}
export class StatisticsQueryDTO extends createZodDto(StatisticsQuerySchema) {}
