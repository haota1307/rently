import { z } from 'zod'

// Schema cho yêu cầu xem phòng
export const CreateViewingScheduleBodySchema = z.object({
  postId: z.number(),
  viewingDate: z.string().datetime(),
  note: z.string().optional(),
})

// Schema cho cập nhật trạng thái lịch xem
export const UpdateViewingScheduleBodySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'RESCHEDULED']),
  rescheduledDate: z.string().datetime().optional(),
  note: z.string().optional(),
  requireTenantConfirmation: z.boolean().optional(),
})

// Schema cho lịch xem phòng
export const ViewingScheduleSchema = z.object({
  id: z.number(),
  postId: z.number(),
  tenantId: z.number(),
  landlordId: z.number(),
  viewingDate: z.string().datetime(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'RESCHEDULED']),
  rescheduledDate: z.string().datetime().nullable(),
  note: z.string().nullable(),
  requireTenantConfirmation: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  post: z.object({
    id: z.number(),
    title: z.string(),
  }),
  tenant: z.object({
    id: z.number(),
    name: z.string(),
    phoneNumber: z.string().nullable(),
    email: z.string(),
  }),
})

// Schema cho kết quả trả về khi lấy danh sách lịch xem
export const GetViewingSchedulesResSchema = z.object({
  data: z.array(ViewingScheduleSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

// Schema cho query params khi lấy danh sách lịch xem
export const GetViewingSchedulesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'RESCHEDULED']).optional(),
  role: z.enum(['ADMIN', 'LANDLORD', 'CLIENT']).optional(),
})

// Types
export type CreateViewingScheduleBodyType = z.infer<
  typeof CreateViewingScheduleBodySchema
>
export type UpdateViewingScheduleBodyType = z.infer<
  typeof UpdateViewingScheduleBodySchema
>
export type ViewingScheduleType = z.infer<typeof ViewingScheduleSchema>
export type GetViewingSchedulesResType = z.infer<
  typeof GetViewingSchedulesResSchema
>
export type GetViewingSchedulesQueryType = z.infer<
  typeof GetViewingSchedulesQuerySchema
>
