import { createZodDto } from 'nestjs-zod'
import {
  CreateRoomBillSchema,
  GetRoomBillParamsSchema,
  GetRoomBillQuerySchema,
  GetRoomBillsResSchema,
  RoomUtilityBillSchema,
  SendBillEmailParamsSchema,
  UpdateRoomBillSchema,
} from 'src/shared/models/shared-room-bill.model'

export class RoomUtilityBillDTO extends createZodDto(RoomUtilityBillSchema) {}
export class CreateRoomBillDTO extends createZodDto(CreateRoomBillSchema) {}
export class UpdateRoomBillDTO extends createZodDto(UpdateRoomBillSchema) {}
export class GetRoomBillQueryDTO extends createZodDto(GetRoomBillQuerySchema) {}
export class GetRoomBillsResDTO extends createZodDto(GetRoomBillsResSchema) {}
export class GetRoomBillParamsDTO extends createZodDto(
  GetRoomBillParamsSchema
) {}
export class SendBillEmailParamsDTO extends createZodDto(
  SendBillEmailParamsSchema
) {}
