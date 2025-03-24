import { UserStatus } from 'src/shared/constants/auth.constant'
import { PermissionSchema } from 'src/shared/models/shared-permission.model'
import { RoleSchema } from 'src/shared/models/shared-role.model'
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
  phoneNumber: z.string().min(9).max(15).nullable(),
  avatar: z.string().nullable(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED]),
  balance: z.number().int().default(0),
  roleId: z.number().positive(),

  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  createdById: z.number().nullable(),

  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const GetlandlordResSchema = UserSchema.omit({
  password: true,
  balance: true,
})

/**
 * Áp dụng cho Response của api GET('profile') và GET('users/:userId')
 */
export const GetUserProfileResSchema = UserSchema.omit({
  password: true,
}).extend({
  role: RoleSchema.pick({
    id: true,
    name: true,
  }).extend({
    permissions: z.array(
      PermissionSchema.pick({
        id: true,
        name: true,
        module: true,
        path: true,
        method: true,
      })
    ),
  }),
})

/**
 * Áp dụng cho Response của api PUT('profile') và PUT('users/:userId')
 */
export const UpdateProfileResSchema = UserSchema.omit({
  password: true,
})

export type UserType = z.infer<typeof UserSchema>
export type GetUserProfileResType = z.infer<typeof GetUserProfileResSchema>
export type UpdateProfileResType = z.infer<typeof UpdateProfileResSchema>
