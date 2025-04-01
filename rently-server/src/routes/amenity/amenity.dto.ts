import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import {
  CreateAmenityBodySchema,
  GetAmenitiesQuerySchema,
  GetAmenitiesResSchema,
  GetAmenityParamsSchema,
  UpdateAmenityBodySchema,
} from 'src/routes/amenity/amenity.schema'

export class GetAmenityParamsDTO extends createZodDto(GetAmenityParamsSchema) {}

export class GetAmenitiesQueryDTO extends createZodDto(
  GetAmenitiesQuerySchema
) {}
export class CreateAmenityBodyDTO extends createZodDto(
  CreateAmenityBodySchema
) {}

export class UpdateAmenityBodyDTO extends createZodDto(
  UpdateAmenityBodySchema
) {}

export class GetAmenitiesResDTO extends createZodDto(GetAmenitiesResSchema) {}
