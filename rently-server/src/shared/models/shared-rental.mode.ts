import { z } from 'zod'
import { preprocessDecimal } from 'src/shared/helpers'
import { RoomSchema } from 'src/shared/models/shared-room.model'
import { GetlandlordResSchema } from 'src/shared/models/shared-user.model'

export const RentalImageSchema = z.object({
  id: z.number(),
  imageUrl: z.string(),
  order: z.number(),
  createdAt: z.date().nullable(),
  rentalId: z.number(),
})

export const RentalSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  address: z.string(),
  lat: z.preprocess(preprocessDecimal, z.number()),
  lng: z.preprocess(preprocessDecimal, z.number()),
  distance: z.preprocess(preprocessDecimal, z.number()).optional(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  landlordId: z.number(),
  landlord: GetlandlordResSchema.optional(),
  rentalImages: z.array(RentalImageSchema).optional(),
  rooms: z.array(RoomSchema).optional(),
})

export const GetRentalsResSchema = z.object({
  data: z.array(RentalSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetRentalsQuerySchema = z
  .object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    title: z.string().optional(),
    landlordId: z.coerce.number().optional(),
  })
  .strict()

export const GetRentalParamsSchema = z
  .object({
    rentalId: z.coerce.number(),
  })
  .strict()

export const GetRentalDetailResSchema = RentalSchema

export const CreateRentalBodySchema = z
  .object({
    title: z.string(),
    description: z.string(),
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
    landlordId: z.number(),
    rentalImages: z
      .array(
        z.object({
          imageUrl: z.string(),
          order: z.number().optional(),
        })
      )
      .optional(),
  })
  .strict()

export const UpdateRentalBodySchema = CreateRentalBodySchema

// Các type được trích xuất từ các schema
export type RentalType = z.infer<typeof RentalSchema>
export type GetRentalsResType = z.infer<typeof GetRentalsResSchema>
export type GetRentalsQueryType = z.infer<typeof GetRentalsQuerySchema>
export type GetRentalParamsType = z.infer<typeof GetRentalParamsSchema>
export type GetRentalDetailResType = z.infer<typeof GetRentalDetailResSchema>
export type CreateRentalBodyType = z.infer<typeof CreateRentalBodySchema>
export type UpdateRentalBodyType = z.infer<typeof UpdateRentalBodySchema>
