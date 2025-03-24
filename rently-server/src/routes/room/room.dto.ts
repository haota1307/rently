import { createZodDto } from 'nestjs-zod'
import {
  CreateRoomBodySchema,
  GetRoomDetailResSchema,
  GetRoomParamsSchema,
  GetRoomsQuerySchema,
  GetRoomsResSchema,
  UpdateRoomBodySchema,
} from 'src/shared/models/shared-room.model'

export class GetRoomsResDTO extends createZodDto(GetRoomsResSchema) {}
export class GetRoomsQueryDTO extends createZodDto(GetRoomsQuerySchema) {}
export class GetRoomParamsDTO extends createZodDto(GetRoomParamsSchema) {}
export class GetRoomDetailResDTO extends createZodDto(GetRoomDetailResSchema) {}
export class CreateRoomBodyDTO extends createZodDto(CreateRoomBodySchema) {}
export class UpdateRoomBodyDTO extends createZodDto(UpdateRoomBodySchema) {}
