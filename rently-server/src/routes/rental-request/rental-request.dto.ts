import { createZodDto } from 'nestjs-zod'
import {
  CreateRentalRequestBodySchema,
  GetRentalRequestParamsSchema,
  GetRentalRequestsQuerySchema,
  GetRentalRequestsResSchema,
  RentalRequestDetailSchema,
  UpdateRentalRequestBodySchema,
} from './rental-request.model'

// DTOs cho Request
export class CreateRentalRequestBodyDTO extends createZodDto(
  CreateRentalRequestBodySchema
) {}

export class UpdateRentalRequestBodyDTO extends createZodDto(
  UpdateRentalRequestBodySchema
) {}

export class GetRentalRequestsQueryDTO extends createZodDto(
  GetRentalRequestsQuerySchema
) {}

export class GetRentalRequestParamsDTO extends createZodDto(
  GetRentalRequestParamsSchema
) {}

// DTOs cho Response
export class RentalRequestDetailDTO extends createZodDto(
  RentalRequestDetailSchema
) {}

export class GetRentalRequestsResDTO extends createZodDto(
  GetRentalRequestsResSchema
) {}
