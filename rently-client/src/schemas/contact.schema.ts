import { z } from "zod";

export const ContactFormSchema = z.object({
  fullName: z.string().min(1, { message: "Vui lòng nhập họ tên" }),
  email: z.string().email({ message: "Email không hợp lệ" }),
  phoneNumber: z
    .string()
    .min(10, { message: "Số điện thoại phải có ít nhất 10 số" })
    .optional(),
  subject: z.string().min(1, { message: "Vui lòng nhập tiêu đề" }),
  message: z
    .string()
    .min(10, { message: "Vui lòng nhập nội dung ít nhất 10 ký tự" }),
});

export type ContactFormType = z.infer<typeof ContactFormSchema>;

export const CreateContactSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  phoneNumber: z.string().optional(),
  subject: z.string().min(1, "Vui lòng nhập tiêu đề"),
  message: z.string().min(10, "Nội dung quá ngắn"),
});

export const SendUserEmailSchema = z.object({
  subject: z.string().min(1, "Tiêu đề không được để trống"),
  message: z.string().min(10, "Nội dung phải có ít nhất 10 ký tự"),
});

export type SendUserEmailType = z.infer<typeof SendUserEmailSchema>;

export const SendBulkEmailSchema = z.object({
  subject: z.string().min(1, "Tiêu đề không được để trống"),
  message: z.string().min(10, "Nội dung phải có ít nhất 10 ký tự"),
  targetAudience: z.object({
    roleIds: z.array(z.number()).optional(),
    userStatus: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
    userIds: z.array(z.number()).optional(),
  }),
});

export type SendBulkEmailType = z.infer<typeof SendBulkEmailSchema>;
