import { createZodDto } from 'nestjs-zod'
import {
  CreateSystemSettingSchema,
  GetSystemSettingByGroupSchema,
  SystemSettingSchema,
  UpdateSystemSettingSchema,
} from './system-setting.model'

export class SystemSettingDTO extends createZodDto(SystemSettingSchema) {}
export class CreateSystemSettingDTO extends createZodDto(
  CreateSystemSettingSchema
) {}
export class UpdateSystemSettingDTO extends createZodDto(
  UpdateSystemSettingSchema
) {}
export class GetSystemSettingByGroupDTO extends createZodDto(
  GetSystemSettingByGroupSchema
) {}
