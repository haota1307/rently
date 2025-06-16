import { Decimal } from '@prisma/client/runtime/library'
import { z } from 'zod'

export const RoomImageSchema = z.object({
  id: z.number(),
  imageUrl: z.string(),
  order: z.number(),
  createdAt: z.date().nullable(),
  roomId: z.number(),
})

export const RoomSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.preprocess(
    arg =>
      typeof arg === 'object' && arg !== null && 'toNumber' in arg
        ? (arg as Decimal).toNumber()
        : arg,
    z.number()
  ),
  area: z.number(),
  isAvailable: z.boolean().default(true),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  rentalId: z.number(),
  roomImages: z.array(RoomImageSchema).optional(),
  roomAmenities: z
    .array(
      z.object({
        id: z.number(),
        roomId: z.number(),
        amenityId: z.number(),
        amenity: z.object({
          id: z.number(),
          name: z.string(),
          createdAt: z.date(),
        }),
      })
    )
    .optional(),
})

export const GetRoomsResSchema = z.object({
  data: z.array(RoomSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetRoomsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    ownerId: z.coerce.number().optional(),
    title: z.string().optional(),
    status: z.string().optional(),
    priceRange: z.string().optional(),
    areaRange: z.coerce.string().optional(),
  })
  .strict()

export const GetRoomParamsSchema = z
  .object({
    roomId: z.coerce.number(),
  })
  .strict()

export const GetRoomDetailResSchema = RoomSchema

export const CreateRoomBodySchema = z
  .object({
    title: z.string(),
    price: z.number(),
    area: z.number(),
    isAvailable: z.boolean().optional().default(true),
    rentalId: z.number(),
    amenityIds: z.array(z.number()).optional(),
    roomImages: z
      .array(
        z.object({
          imageUrl: z.string(),
          order: z.number().optional(),
        })
      )
      .optional(),
  })
  .strict()

export const UpdateRoomBodySchema = CreateRoomBodySchema

// Schema cho tạo phòng hàng loạt
export const CreateBulkRoomsBodySchema = z
  .object({
    rentalId: z.number(),
    baseName: z.string(), // Tên cơ bản, ví dụ: "Phòng"
    startNumber: z.number().int().positive().default(1), // Số bắt đầu
    count: z.number().int().positive().min(1).max(50), // Số lượng phòng (tối đa 50)
    price: z.number(),
    area: z.number(),
    isAvailable: z.boolean().optional().default(true),
    amenityIds: z.array(z.number()).optional(),
    // Mỗi phòng sẽ có thể có ảnh riêng hoặc dùng chung
    roomImages: z
      .array(
        z.object({
          imageUrl: z.string(),
          order: z.number().optional(),
        })
      )
      .optional(),
  })
  .strict()

export const CreateBulkRoomsResSchema = z.object({
  message: z.string(),
  createdRooms: z.array(RoomSchema),
  totalCreated: z.number(),
})

export type RoomType = z.infer<typeof RoomSchema>
export type GetRoomsResType = z.infer<typeof GetRoomsResSchema>
export type GetRoomsQueryType = z.infer<typeof GetRoomsQuerySchema>
export type GetRoomParamsType = z.infer<typeof GetRoomParamsSchema>
export type GetRoomDetailResType = z.infer<typeof GetRoomDetailResSchema>
export type CreateRoomBodyType = z.infer<typeof CreateRoomBodySchema>
export type UpdateRoomBodyType = z.infer<typeof UpdateRoomBodySchema>
export type CreateBulkRoomsBodyType = z.infer<typeof CreateBulkRoomsBodySchema>
export type CreateBulkRoomsResType = z.infer<typeof CreateBulkRoomsResSchema>
