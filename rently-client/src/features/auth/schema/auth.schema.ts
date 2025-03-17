import { z } from "zod";
import { TypeOfVerificationCode } from "@/constants/auth.constant";
import { UserSchema } from "@/features/auth/schema/user.schema";

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
})
  .extend({
    confirmPassword: z
      .string()
      .min(6, "Mật khẩu xác nhận phải có ít nhất 6 ký tự")
      .max(100, "Mật khẩu xác nhận không vượt quá 100 ký tự"),
    code: z.string().length(6, { message: "Mã xác thực phải đúng 6 ký tự" }),
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "Mật khẩu và xác nhận mật khẩu phải trùng nhau",
        path: ["confirmPassword"],
      });
    }
  });

export const RegisterResSchema = UserSchema.omit({
  password: true,
});

export const VerificationCodeSchema = z.object({
  id: z.number(),
  email: z.string().email("Email không hợp lệ"),
  code: z.string().length(6, { message: "Mã xác thực phải đúng 6 ký tự" }),
  type: z.enum([
    TypeOfVerificationCode.REGISTER,
    TypeOfVerificationCode.FORGOT_PASSWORD,
  ]),
  expiresAt: z.date({ invalid_type_error: "Ngày hết hạn không hợp lệ" }),
  createdAt: z.date({ invalid_type_error: "Ngày tạo không hợp lệ" }),
});

export const SendOTPBodySchema = VerificationCodeSchema.pick({
  email: true,
  type: true,
}).strict();

export const LoginBodySchema = UserSchema.pick({
  email: true,
  password: true,
}).strict();

export const LoginResSchema = z.object({
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
  user: UserSchema.omit({ password: true }),
});

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string({
      required_error: "Refresh token không được để trống",
    }),
  })
  .strict();

export const RefreshTokenResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RefreshTokenSchema = z.object({
  token: z.string({ required_error: "Token không được để trống" }),
  userId: z.number({ invalid_type_error: "User ID phải là số" }),
  expiresAt: z.date({ invalid_type_error: "Ngày hết hạn không hợp lệ" }),
  createdAt: z.date({ invalid_type_error: "Ngày tạo không hợp lệ" }),
});

export const RoleSchema = z.object({
  id: z.number({ invalid_type_error: "ID phải là số" }),
  name: z.string({ required_error: "Tên vai trò không được để trống" }),
  description: z.string({
    required_error: "Mô tả vai trò không được để trống",
  }),
  isActive: z.boolean({ invalid_type_error: "Trạng thái phải là boolean" }),
  createdById: z
    .number({ invalid_type_error: "CreatedById phải là số" })
    .nullable(),
  updatedById: z
    .number({ invalid_type_error: "UpdatedById phải là số" })
    .nullable(),
  deletedAt: z
    .date({ invalid_type_error: "DeletedAt không hợp lệ" })
    .nullable(),
  createdAt: z.date({ invalid_type_error: "Ngày tạo không hợp lệ" }),
  updatedAt: z.date({ invalid_type_error: "Ngày cập nhật không hợp lệ" }),
});

export const LogoutBodySchema = RefreshTokenBodySchema;

export const GetAuthorizationUrlResSchema = z.object({
  url: z.string().url({ message: "URL không hợp lệ" }),
});

export const ForgotPasswordBodySchema = z
  .object({
    email: z.string().email("Email không hợp lệ"),
    code: z.string().length(6, { message: "Mã xác thực phải đúng 6 ký tự" }),
    newPassword: z
      .string()
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
      .max(100, "Mật khẩu mới không vượt quá 100 ký tự"),
    confirmPassword: z
      .string()
      .min(6, "Mật khẩu xác nhận phải có ít nhất 6 ký tự")
      .max(100, "Mật khẩu xác nhận không vượt quá 100 ký tự"),
  })
  .strict()
  .superRefine(({ confirmPassword, newPassword }, ctx) => {
    if (confirmPassword !== newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Mật khẩu và mật khẩu xác nhận phải giống nhau",
        path: ["confirmPassword"],
      });
    }
  });

export const ChangePasswordBodySchema = z
  .object({
    oldPassword: z
      .string()
      .min(6, "Mật khẩu cũ phải có ít nhất 6 ký tự")
      .max(100, "Mật khẩu cũ không vượt quá 100 ký tự"),
    newPassword: z
      .string()
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
      .max(100, "Mật khẩu mới không vượt quá 100 ký tự"),
    confirmPassword: z
      .string()
      .min(6, "Mật khẩu xác nhận phải có ít nhất 6 ký tự")
      .max(100, "Mật khẩu xác nhận không vượt quá 100 ký tự"),
  })
  .strict()
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Mật khẩu mới và mật khẩu xác nhận phải trùng khớp",
        path: ["confirmPassword"],
      });
    }
  });

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;
export type RegisterResType = z.infer<typeof RegisterResSchema>;
export type VerificationCodeType = z.infer<typeof VerificationCodeSchema>;
export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>;
export type LoginBodyType = z.infer<typeof LoginBodySchema>;
export type LoginResType = z.infer<typeof LoginResSchema>;
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>;
export type RefreshTokenResType = z.infer<typeof RefreshTokenResSchema>;
export type RoleType = z.infer<typeof RoleSchema>;
export type LogoutBodyType = RefreshTokenBodyType;
export type GetAuthorizationUrlResType = z.infer<
  typeof GetAuthorizationUrlResSchema
>;
export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>;
export type ChangePasswordBodyType = z.infer<typeof ChangePasswordBodySchema>;
