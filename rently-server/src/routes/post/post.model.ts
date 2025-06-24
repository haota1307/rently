import { Decimal } from '@prisma/client/runtime/library'
import { RoomSchema } from 'src/shared/models/shared-room.model'
import { z } from 'zod'

export enum RentalPostStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
  SUSPENDED = 'SUSPENDED', // Trạng thái riêng cho tạm ngưng bài đăng
}

// Schema cho thông tin bất động sản (Rental)
export const RentalSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  address: z.string(),
  lat: z.number(),
  distance: z.number(),
  lng: z.number(),
  createdAt: z.date(),
  rentalImages: z
    .array(
      z.object({
        id: z.number(),
        imageUrl: z.string(),
        order: z.number(),
        createdAt: z.date(),
      })
    )
    .optional(),
})

// Schema cho thông tin người đăng (Landlord) - dùng thông tin từ model User
export const LandlordSchema = z.object({
  id: z.number(),
  name: z.string(),
  avatar: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  email: z.string().email(),
})

// Schema cơ bản cho Post (bài đăng cho thuê)
export const PostSchema = z.object({
  id: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  pricePaid: z.preprocess(arg => {
    if (typeof arg === 'object' && arg !== null && 'toNumber' in arg) {
      return (arg as Decimal).toNumber()
    }
    return arg
  }, z.number()),
  deposit: z
    .preprocess(arg => {
      if (typeof arg === 'object' && arg !== null && 'toNumber' in arg) {
        return (arg as Decimal).toNumber()
      }
      return arg
    }, z.number())
    .default(0),
  title: z.string(),
  status: z.nativeEnum(RentalPostStatus),
  description: z.string(),
  rentalId: z.number(),
  landlordId: z.number(),
  createdAt: z.date(),
})

// Schema chi tiết cho Post, bao gồm thông tin của rental và landlord
export const PostDetailSchema = PostSchema.extend({
  rental: RentalSchema,
  landlord: LandlordSchema,
  room: RoomSchema.optional(),
})

// Schema cho kết quả trả về khi lấy danh sách bài đăng
export const GetPostsResSchema = z.object({
  data: z.array(PostDetailSchema),
  totalItems: z.number(), // Tổng số bài đăng
  page: z.number(), // Trang hiện tại
  limit: z.number(), // Số bài đăng trên 1 trang
  totalPages: z.number(), // Tổng số trang
})

export const GetPostsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    // Tham số sắp xếp: newest | price-asc | price-desc | area-asc | area-desc | distance
    sort: z
      .enum([
        'newest',
        'price-asc',
        'price-desc',
        'area-asc',
        'area-desc',
        'distance',
      ] as const)
      .optional(),
    title: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
  })
  .strict()

export const GetPostParamsSchema = z
  .object({
    rentalPostId: z.coerce.number(),
  })
  .strict()

export const GetPostDetailResSchema = PostDetailSchema

export const CreatePostBodySchema = z
  .object({
    startDate: z
      .string()
      .refine(val => !isNaN(Date.parse(val)), { message: 'Invalid startDate' })
      .transform(val => new Date(val)),
    endDate: z
      .string()
      .refine(val => !isNaN(Date.parse(val)), { message: 'Invalid endDate' })
      .transform(val => new Date(val)),
    title: z.string(),
    roomId: z.number(),
    description: z.string(),
    status: z
      .nativeEnum(RentalPostStatus)
      .optional()
      .default(RentalPostStatus.ACTIVE),
    pricePaid: z.number(),
    deposit: z.number().optional().default(0),
    rentalId: z.number(),
  })
  .strict()

export const UpdatePostBodySchema = CreatePostBodySchema

// Schema cho cập nhật trạng thái bài đăng
export const UpdatePostStatusSchema = z
  .object({
    status: z.nativeEnum(RentalPostStatus),
  })
  .strict()

// Schema cho tạo bài đăng hàng loạt
export const CreateBulkPostsBodySchema = z
  .object({
    rentalId: z.number(),
    baseName: z.string().min(1, 'Tên cơ bản không được để trống'),
    roomIds: z
      .array(z.number())
      .min(1, 'Phải chọn ít nhất 1 phòng')
      .max(50, 'Tối đa 50 phòng'),
    startDate: z
      .string()
      .refine(val => !isNaN(Date.parse(val)), { message: 'Invalid startDate' })
      .transform(val => new Date(val)),
    endDate: z
      .string()
      .refine(val => !isNaN(Date.parse(val)), { message: 'Invalid endDate' })
      .transform(val => new Date(val)),
    description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
    status: z
      .nativeEnum(RentalPostStatus)
      .optional()
      .default(RentalPostStatus.ACTIVE),
    // pricePaid sẽ được lấy từ giá phòng, không cần nhập
    deposit: z
      .number()
      .min(0, 'Tiền đặt cọc không được âm')
      .optional()
      .default(0),
  })
  .strict()
  .refine(
    data => {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      return startDate < endDate
    },
    {
      message: 'Ngày bắt đầu phải trước ngày kết thúc',
      path: ['startDate'],
    }
  )

export const CreateBulkPostsResSchema = z.object({
  message: z.string(),
  createdPosts: z.array(PostDetailSchema),
  totalCreated: z.number(),
})

export type PostType = z.infer<typeof PostDetailSchema>
export type GetPostsResType = z.infer<typeof GetPostsResSchema>
export type GetPostsQueryType = z.infer<typeof GetPostsQuerySchema>
export type GetPostParamsType = z.infer<typeof GetPostParamsSchema>
export type GetPostDetailResType = z.infer<typeof GetPostDetailResSchema>
export type CreatePostBodyType = z.infer<typeof CreatePostBodySchema>
export type UpdatePostBodyType = z.infer<typeof UpdatePostBodySchema>
export type UpdatePostStatusType = z.infer<typeof UpdatePostStatusSchema>
export type CreateBulkPostsBodyType = z.infer<typeof CreateBulkPostsBodySchema>
export type CreateBulkPostsResType = z.infer<typeof CreateBulkPostsResSchema>
