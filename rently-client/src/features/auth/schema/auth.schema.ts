import { Role } from "@/constants/type";
import z from "zod";

export const LoginBody = z
  .object({
    email: z
      .string()
      .min(1, { message: "Email không được để trống" })
      .email({ message: "Email không hợp lệ" }),
    password: z
      .string()
      .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
      .max(100, { message: "Mật khẩu không được vượt quá 100 ký tự" })
      .regex(/[A-Z]/, {
        message: "Mật khẩu phải chứa ít nhất một chữ cái viết hoa",
      })
      .regex(/[a-z]/, {
        message: "Mật khẩu phải chứa ít nhất một chữ cái viết thường",
      })
      .regex(/[0-9]/, { message: "Mật khẩu phải chứa ít nhất một số" })
      .regex(/[@$!%*?&#]/, {
        message:
          "Mật khẩu phải chứa ít nhất một ký tự đặc biệt (@, $, !, %, *, ?, &, #, ...)",
      }),
  })
  .strict();

export type LoginBodyType = z.TypeOf<typeof LoginBody>;

export const LoginRes = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    account: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      role: z.enum([Role.Admin, Role.Landlord, Role.Tenant]),
    }),
  }),
  message: z.string(),
});

export type LoginResType = z.TypeOf<typeof LoginRes>;

/* ------------------ SCHEMA ĐĂNG KÝ ------------------ */
export const RegisterBody = z
  .object({
    name: z.string().min(1, { message: "Tên không được để trống" }),
    email: z
      .string()
      .min(1, { message: "Email không được để trống" })
      .email({ message: "Email không hợp lệ" }),
    password: z
      .string()
      .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
      .max(100, { message: "Mật khẩu không được vượt quá 100 ký tự" })
      .regex(/[A-Z]/, {
        message: "Mật khẩu phải chứa ít nhất một chữ cái viết hoa",
      })
      .regex(/[a-z]/, {
        message: "Mật khẩu phải chứa ít nhất một chữ cái viết thường",
      })
      .regex(/[0-9]/, { message: "Mật khẩu phải chứa ít nhất một số" })
      .regex(/[@$!%*?&#]/, {
        message:
          "Mật khẩu phải chứa ít nhất một ký tự đặc biệt (@, $, !, %, *, ?, &, #, ...)",
      }),
    confirmPassword: z
      .string()
      .min(6, { message: "Xác nhận mật khẩu phải có ít nhất 6 ký tự" })
      .max(100, { message: "Xác nhận mật khẩu không được vượt quá 100 ký tự" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu và xác nhận mật khẩu không khớp",
    path: ["confirmPassword"], // Gắn lỗi vào trường confirmPassword
  });

export type RegisterBodyType = z.TypeOf<typeof RegisterBody>;

export const RegisterRes = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    account: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      role: z.enum([Role.Admin, Role.Landlord, Role.Tenant]),
    }),
  }),
  message: z.string(),
});

export type RegisterResType = z.TypeOf<typeof RegisterRes>;

/* ------------------ SCHEMA LÀM MỚI TOKEN ------------------ */
export const RefreshTokenBody = z
  .object({
    refreshToken: z
      .string()
      .min(1, { message: "Refresh token không được để trống" }),
  })
  .strict();

export type RefreshTokenBodyType = z.TypeOf<typeof RefreshTokenBody>;

export const RefreshTokenRes = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
  message: z.string(),
});

export type RefreshTokenResType = z.TypeOf<typeof RefreshTokenRes>;

/* ------------------ SCHEMA ĐĂNG XUẤT ------------------ */
export const LogoutBody = z
  .object({
    refreshToken: z
      .string()
      .min(1, { message: "Refresh token không được để trống" }),
  })
  .strict();

export type LogoutBodyType = z.TypeOf<typeof LogoutBody>;
