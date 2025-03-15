import { UserSchema } from 'src/shared/models/shared-user.model'
import { z } from 'zod'

export const GetMeSchema = UserSchema.omit({
  password: true,
})

export const GetUserSchema = UserSchema.omit({
  balance: true,
  password: true,
})

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    phoneNumber: z.string().min(9).max(15).nullable().optional(),
    avatar: z.string().nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
  })
  .strict()

export const GetUsersResSchema = z.object({
  data: z.array(GetMeSchema),
  totalItems: z.number(), // Tổng số item
  page: z.number(), // Số trang hiện tại
  limit: z.number(), // Số item trên 1 trang
  totalPages: z.number(), // Tổng số trang
})

export const GetUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    role: z.coerce.number().int().positive().optional(),
  })
  .strict()

export type GetUserType = z.infer<typeof GetUserSchema>
export type GetMeType = z.infer<typeof GetMeSchema>
export type GetUsersResType = z.infer<typeof GetUsersResSchema>
export type UpdateUserType = z.infer<typeof UpdateUserSchema>
export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>
