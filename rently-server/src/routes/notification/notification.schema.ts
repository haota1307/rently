import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

// Sử dụng import cụ thể hoặc định nghĩa PaginationSchema nếu cần
const PaginationSchema = z.object({
  page: z
    .union([
      z.number().int().positive().default(1),
      z.string().transform(val => parseInt(val, 10) || 1),
    ])
    .default(1),
  limit: z
    .union([
      z.number().int().positive().max(100).default(10),
      z.string().transform(val => Math.min(parseInt(val, 10) || 10, 100)),
    ])
    .default(10),
})

// Enum cho các loại thông báo
export enum NotificationTypeEnum {
  PAYMENT = 'PAYMENT',
  INTERACTION = 'INTERACTION',
  RENTAL_REQUEST = 'RENTAL_REQUEST',
  VIEWING_SCHEDULE = 'VIEWING_SCHEDULE',
  POST = 'POST',
  SYSTEM = 'SYSTEM',
}

// Schema cho notification
export const NotificationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  type: z.nativeEnum(NotificationTypeEnum),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  relatedId: z.number().nullable().optional(),
  relatedType: z.string().nullable().optional(),
  deepLink: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema cho list notifications với phân trang
export const GetNotificationsQuerySchema = PaginationSchema.extend({
  isRead: z.union([
    z.boolean().optional(),
    z
      .string()
      .transform(val => {
        if (val === 'true') return true
        if (val === 'false') return false
        return undefined
      })
      .optional(),
  ]),
})

export const GetNotificationsResSchema = z.object({
  data: z.array(NotificationSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

// Schema cho tạo notification mới
export const CreateNotificationBodySchema = z.object({
  userId: z.number(),
  type: z.nativeEnum(NotificationTypeEnum),
  title: z.string(),
  message: z.string(),
  relatedId: z.number().nullable().optional(),
  relatedType: z.string().nullable().optional(),
  deepLink: z.string().nullable().optional(),
})

// Schema cho đánh dấu thông báo đã đọc
export const MarkAsReadParamsSchema = z.object({
  notificationId: z.string().transform(val => parseInt(val, 10)),
})

// Types
export type Notification = z.infer<typeof NotificationSchema>
export type GetNotificationsQueryType = z.infer<
  typeof GetNotificationsQuerySchema
>
export type GetNotificationsResType = z.infer<typeof GetNotificationsResSchema>
export type CreateNotificationBodyType = z.infer<
  typeof CreateNotificationBodySchema
>
export type MarkAsReadParamsType = z.infer<typeof MarkAsReadParamsSchema>
