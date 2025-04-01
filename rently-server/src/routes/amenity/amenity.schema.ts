import { z } from 'zod'

export const GetAmenitiesResSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      createdAt: z.date(),
    })
  ),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetAmenitiesQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  name: z.string().optional(),
})

export const CreateAmenityBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export const UpdateAmenityBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export const GetAmenityParamsSchema = z.object({
  amenityId: z.coerce.number(),
})

export type GetAmenitiesQueryType = z.infer<typeof GetAmenitiesQuerySchema>
export type GetAmenityParamsType = z.infer<typeof GetAmenityParamsSchema>
export type UpdateAmenityBodyType = z.infer<typeof UpdateAmenityBodySchema>
export type CreateAmenityBodyType = z.infer<typeof CreateAmenityBodySchema>
