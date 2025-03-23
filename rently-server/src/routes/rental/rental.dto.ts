import { createZodDto } from 'nestjs-zod'
import {
  CreateRentalBodySchema,
  GetRentalDetailResSchema,
  GetRentalParamsSchema,
  GetRentalsQuerySchema,
  GetRentalsResSchema,
  UpdateRentalBodySchema,
} from 'src/routes/rental/rental.model'

export class GetRentalsResDTO extends createZodDto(GetRentalsResSchema) {}
export class GetRentalsQueryDTO extends createZodDto(GetRentalsQuerySchema) {}
export class GetRentalParamsDTO extends createZodDto(GetRentalParamsSchema) {}
export class GetRentalDetailResDTO extends createZodDto(
  GetRentalDetailResSchema
) {}
export class CreateRentalBodyDTO extends createZodDto(CreateRentalBodySchema) {}
export class UpdateRentalBodyDTO extends createZodDto(UpdateRentalBodySchema) {}
