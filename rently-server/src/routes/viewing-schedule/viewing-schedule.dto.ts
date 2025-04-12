import { createZodDto } from 'nestjs-zod'
import {
  CreateViewingScheduleBodySchema,
  UpdateViewingScheduleBodySchema,
  GetViewingSchedulesQuerySchema,
  ViewingScheduleSchema,
  GetViewingSchedulesResSchema,
} from './viewing-schedule.model'

export class CreateViewingScheduleBodyDTO extends createZodDto(
  CreateViewingScheduleBodySchema
) {}

export class UpdateViewingScheduleBodyDTO extends createZodDto(
  UpdateViewingScheduleBodySchema
) {}

export class GetViewingSchedulesQueryDTO extends createZodDto(
  GetViewingSchedulesQuerySchema
) {}

export class ViewingScheduleDTO extends createZodDto(ViewingScheduleSchema) {}

export class GetViewingSchedulesResDTO extends createZodDto(
  GetViewingSchedulesResSchema
) {}
