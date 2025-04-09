import { z } from "zod";
import { UserStatus } from "@/constants/auth.constant";
import { RoleSchema } from "@/schemas/role.schema";
import { PermissionSchema } from "@/schemas/permission.schema";

/**
 * Schema cơ bản của User, bao gồm tất cả các trường.
 */
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
  phoneNumber: z.union([z.string().min(9).max(15), z.literal(""), z.null()]),
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
});

/**
 * Schema dùng cho API của landlord, loại bỏ thông tin nhạy cảm như password và balance.
 */
export const GetlandlordResSchema = UserSchema.omit({
  password: true,
  balance: true,
});

/**
 * Schema cho response của API GET('profile') và GET('users/:userId').
 * Loại bỏ password và mở rộng thêm trường role với thông tin chi tiết về permissions.
 */
export const GetUserProfileResSchema = UserSchema.omit({
  password: true,
}).extend({
  role: z.lazy(() =>
    RoleSchema.pick({
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
    })
  ),
});

/**
 * Schema cho response của API PUT('profile') và PUT('users/:userId'),
 * chỉ loại bỏ password.
 */
export const UpdateProfileResSchema = UserSchema.omit({
  password: true,
});

/**
 * Schema cho response khi lấy danh sách người dùng với phân trang.
 * Ở đây, ta loại bỏ trường password để không truyền về client.
 */
export const GetUsersResSchema = z.object({
  data: z.array(UserSchema.omit({ password: true })),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

/**
 * Schema cho query params khi lấy danh sách người dùng.
 * Có thể bổ sung các trường lọc như name.
 */
export const GetUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    name: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
    roleId: z.coerce.number().int().positive().optional(),
  })
  .strict();

/**
 * Schema cho params của API khi lấy chi tiết người dùng, ví dụ: /users/:userId.
 */
export const GetUserParamsSchema = z
  .object({
    userId: z.coerce.number(),
  })
  .strict();

/**
 * Schema cho body khi tạo mới người dùng.
 */
export const CreateUserBodySchema = z
  .object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    phoneNumber: z.string().min(9).max(15).nullable().optional(),
    avatar: z.string().nullable().optional(),
    roleId: z.number().positive(),
    status: z.enum([
      UserStatus.ACTIVE,
      UserStatus.INACTIVE,
      UserStatus.BLOCKED,
    ]),
  })
  .strict();

/**
 * Schema cho response sau khi tạo mới người dùng.
 * Ở đây sử dụng chính schema của GetUserProfileResSchema để loại bỏ password và cung cấp thông tin role.
 */
export const CreateUserResSchema = GetUserProfileResSchema;

/**
 * Schema cho body khi cập nhật thông tin người dùng.
 * Các trường được đánh dấu optional vì có thể không cập nhật hết.
 */
export const UpdateUserBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).max(100).optional(),
    phoneNumber: z.string().min(9).max(15).nullable().optional(),
    avatar: z.string().nullable().optional(),
    roleId: z.number().positive().optional(),
    status: z
      .enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED])
      .optional(),
  })
  .strict();

// Export các type tương ứng từ các schema để sử dụng đồng bộ giữa server và client
export type UserType = z.infer<typeof UserSchema>;
export type GetUserProfileResType = z.infer<typeof GetUserProfileResSchema>;
export type UpdateProfileResType = z.infer<typeof UpdateProfileResSchema>;
export type GetUsersResType = z.infer<typeof GetUsersResSchema>;
export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>;
export type GetUserParamsType = z.infer<typeof GetUserParamsSchema>;
export type CreateUserBodyType = z.infer<typeof CreateUserBodySchema>;
export type CreateUserResType = z.infer<typeof CreateUserResSchema>;
export type UpdateUserBodyType = z.infer<typeof UpdateUserBodySchema>;
