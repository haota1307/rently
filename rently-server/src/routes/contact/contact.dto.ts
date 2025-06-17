import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ContactStatus, UserStatus } from '@prisma/client'

// DTO cho việc tạo liên hệ mới
export const CreateContactSchema = z.object({
  fullName: z.string().min(1, { message: 'Vui lòng nhập họ tên' }),
  email: z.string().email({ message: 'Email không hợp lệ' }),
  phoneNumber: z.string().optional(),
  subject: z.string().min(1, { message: 'Vui lòng nhập tiêu đề' }),
  message: z.string().min(10, { message: 'Nội dung quá ngắn' }),
})

export class CreateContactDTO extends createZodDto(CreateContactSchema) {}

// DTO cho việc phản hồi liên hệ
export const RespondContactSchema = z.object({
  response: z.string().min(1, { message: 'Vui lòng nhập phản hồi' }),
})

export class RespondContactDTO extends createZodDto(RespondContactSchema) {}

// DTO cho response trả về chi tiết liên hệ
export const ContactResponseSchema = z.object({
  id: z.number(),
  fullName: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  subject: z.string(),
  message: z.string(),
  status: z.nativeEnum(ContactStatus),
  response: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  respondedAt: z.date().nullable(),
})

export class ContactResponseDTO extends createZodDto(ContactResponseSchema) {}

// DTO cho response trả về danh sách liên hệ
export const ContactListResponseSchema = z.object({
  data: z.array(ContactResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
})

export class ContactListResponseDTO extends createZodDto(
  ContactListResponseSchema
) {}

export class SendUserEmailDTO extends createZodDto(
  z.object({
    subject: z.string().min(1, 'Tiêu đề không được để trống'),
    message: z.string().min(10, 'Nội dung phải có ít nhất 10 ký tự'),
  })
) {}

export class SendUserEmailResponseDTO extends createZodDto(
  z.object({
    message: z.string(),
  })
) {}

// DTO cho bulk email
export class SendBulkEmailDTO extends createZodDto(
  z.object({
    subject: z.string().min(1, 'Tiêu đề không được để trống'),
    message: z.string().min(10, 'Nội dung phải có ít nhất 10 ký tự'),
    targetAudience: z.object({
      roleIds: z.array(z.number()).optional(), // Gửi theo role (1: admin, 2: landlord, 3: client)
      userStatus: z.nativeEnum(UserStatus).optional(), // Gửi theo trạng thái user
      userIds: z.array(z.number()).optional(), // Gửi cho user cụ thể
    }),
  })
) {}

export class SendBulkEmailResponseDTO extends createZodDto(
  z.object({
    message: z.string(),
    jobId: z.string(),
    estimatedRecipients: z.number(),
  })
) {}
