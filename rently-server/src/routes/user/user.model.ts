import { z } from 'zod'
import { UserSchema } from 'src/shared/models/shared-user.model'
import { RoleSchema } from 'src/shared/models/shared-role.model'

export const GetUsersResSchema = z.object({
  data: z.array(
    UserSchema.omit({ password: true }).extend({
      role: RoleSchema.pick({
        id: true,
        name: true,
      }),
    })
  ),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    name: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
    roleId: z
      .union([
        z.coerce
          .number()
          .int()
          .positive()
          .refine(val => !isNaN(val), {
            message: 'roleId phải là số nguyên dương',
          }),
        z.string().refine(
          val => {
            if (val.includes(',')) {
              // Kiểm tra xem chuỗi có định dạng "1,2,3"
              return val.split(',').every(id => {
                const num = parseInt(id.trim())
                return !isNaN(num) && num > 0
              })
            }
            return false
          },
          {
            message:
              'roleId phải là danh sách các số nguyên dương phân cách bởi dấu phẩy',
          }
        ),
      ])
      .optional(),
  })
  .strict()

export const SearchUsersQuerySchema = z
  .object({
    query: z.string().min(1),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    excludeUserId: z.coerce.number().int().positive().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).default('ACTIVE'),
  })
  .strict()

export const GetUserParamsSchema = z
  .object({
    userId: z.coerce.number().int().positive(),
  })
  .strict()

export const CreateUserBodySchema = UserSchema.pick({
  email: true,
  name: true,
  phoneNumber: true,
  avatar: true,
  status: true,
  password: true,
  roleId: true,
}).strict()

export const UpdateUserBodySchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().min(1).max(100).optional(),
    phoneNumber: z.string().min(9).max(15).nullable().optional(),
    avatar: z.string().nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
    password: z.string().min(6).max(100).optional(),
    roleId: z.number().positive().optional(),
  })
  .strict()

export type GetUsersResType = z.infer<typeof GetUsersResSchema>
export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>
export type SearchUsersQueryType = z.infer<typeof SearchUsersQuerySchema>
export type GetUserParamsType = z.infer<typeof GetUserParamsSchema>
export type CreateUserBodyType = z.infer<typeof CreateUserBodySchema>
export type UpdateUserBodyType = z.infer<typeof UpdateUserBodySchema>
