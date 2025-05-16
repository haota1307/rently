import { z } from "zod";

export const ContactFormSchema = z.object({
  fullName: z.string().min(1, { message: "Vui lòng nhập họ tên" }),
  email: z.string().email({ message: "Email không hợp lệ" }),
  phoneNumber: z.string().optional(),
  subject: z.string().min(1, { message: "Vui lòng nhập tiêu đề" }),
  message: z
    .string()
    .min(10, { message: "Vui lòng nhập nội dung ít nhất 10 ký tự" }),
});

export type ContactFormType = z.infer<typeof ContactFormSchema>;
