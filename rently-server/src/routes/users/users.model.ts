import { UserSchema } from 'src/shared/models/shared-user.model'
import { z } from 'zod'

export const GetMeResSchema = UserSchema.omit({
  password: true,
})

export const GetUserResSchema = UserSchema.omit({
  balance: true,
  password: true,
})

export const GetUserBodySchema = z
  .object({
    id: z.number(),
  })
  .strict()

export const UpdateUserBodySchema = z
  .object({
    name: z
      .string()
      .min(1, 'Tên phải có ít nhất 1 ký tự')
      .max(100, 'Tên không vượt quá 100 ký tự')
      .optional(),
    phoneNumber: z
      .string()
      .min(9, 'Số điện thoại phải có ít nhất 9 ký tự')
      .max(15, 'Số điện thoại không vượt quá 15 ký tự')
      .nullable()
      .optional(),
    avatar: z.string().nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
  })
  .strict()

export const GetUsersResSchema = z.object({
  data: z.array(GetMeResSchema),
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

export const UpdateUserResSchema = z.object({
  user: GetUserResSchema,
})

export const DeleteUserBodySchema = GetUserBodySchema

export const DeleteUserResSchema = z.object({
  message: z.string(),
})

export type GetUserResType = z.infer<typeof GetUserResSchema>
export type GetMeResType = z.infer<typeof GetMeResSchema>
export type GetUserBodyType = z.infer<typeof GetUserBodySchema>
export type GetUsersResType = z.infer<typeof GetUsersResSchema>
export type UpdateUserBodyType = z.infer<typeof UpdateUserBodySchema>
export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>
export type UpdateUserResType = z.infer<typeof UpdateUserResSchema>
export type DeleteUserBodyType = z.infer<typeof DeleteUserBodySchema>
export type DeleteUserResType = z.infer<typeof DeleteUserResSchema>
