import { Decimal } from '@prisma/client/runtime/library'
import {
  GetlandlordResSchema,
  GetUserProfileResSchema,
} from 'src/shared/models/shared-user.model'
import { z } from 'zod'

// Helper để preprocess giá trị Decimal
const preprocessDecimal = (arg: unknown) =>
  typeof arg === 'object' && arg !== null && 'toNumber' in arg
    ? (arg as Decimal).toNumber()
    : arg

// Schema cho Room
export const RoomSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.preprocess(preprocessDecimal, z.number()),
  area: z.string(),
  isAvailable: z.boolean(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  rentalId: z.number(),
})

// Schema cho RentalImage
export const RentalImageSchema = z.object({
  id: z.number(),
  imageUrl: z.string(),
  order: z.number(),
  createdAt: z.date().nullable(),
  rentalId: z.number(),
})

// Schema cho Rental
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
  landlord: GetlandlordResSchema,
  rentalImages: z.array(RentalImageSchema).optional(),
  rooms: z.array(RoomSchema).optional(),
})

// Schema cho phân trang và tham số
export const GetRentalsResSchema = z.object({
  data: z.array(RentalSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetRentalsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
  })
  .strict()

export const GetRentalParamsSchema = z
  .object({
    rentalId: z.coerce.number(),
  })
  .strict()

export const GetRentalDetailResSchema = RentalSchema

const CreateRentalImageSchema = z.object({
  imageUrl: z.string(),
  order: z.number().optional(),
})

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
