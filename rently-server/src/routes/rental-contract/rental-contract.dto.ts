import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ContractStatus } from '@prisma/client'

// Schema cho việc tạo mẫu hợp đồng
export const CreateContractTemplateSchema = z.object({
  name: z.string().min(1, 'Tên mẫu hợp đồng không được để trống'),
  description: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
})

export class CreateContractTemplateDTO extends createZodDto(
  CreateContractTemplateSchema
) {}

// Schema cho việc lấy danh sách mẫu hợp đồng
export const GetContractTemplatesQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
})

export class GetContractTemplatesQueryDTO extends createZodDto(
  GetContractTemplatesQuerySchema
) {}

// Schema cho mẫu hợp đồng trả về
export const ContractTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  fileUrl: z.string(),
  fileName: z.string(),
  fileType: z.string(),
  isDefault: z.boolean(),
  createdAt: z.date(),
  landlordId: z.number(),
})

export class ContractTemplateDTO extends createZodDto(ContractTemplateSchema) {}

// Schema cho danh sách mẫu hợp đồng trả về
export const ContractTemplatesListSchema = z.object({
  data: z.array(ContractTemplateSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export class ContractTemplatesListDTO extends createZodDto(
  ContractTemplatesListSchema
) {}

// Schema cho việc lấy mẫu hợp đồng theo ID
export const GetContractTemplateParamsSchema = z.object({
  id: z.coerce.number(),
})

export class GetContractTemplateParamsDTO extends createZodDto(
  GetContractTemplateParamsSchema
) {}

// Schema cho việc tạo hợp đồng
export const CreateContractSchema = z.object({
  rentalRequestId: z.number(),
  templateId: z.number().optional(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
  monthlyRent: z.number().positive('Tiền thuê hàng tháng phải là số dương'),
  deposit: z.number().positive('Tiền đặt cọc phải là số dương'),
  paymentDueDate: z.number().min(1).max(31),
  terms: z.record(z.any()).optional(),
})

export class CreateContractDTO extends createZodDto(CreateContractSchema) {}

// Schema cho việc lấy danh sách hợp đồng
export const GetContractsQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  status: z.nativeEnum(ContractStatus).optional(),
  search: z.string().optional(),
})

export class GetContractsQueryDTO extends createZodDto(
  GetContractsQuerySchema
) {}

// Schema cho việc lấy hợp đồng theo ID
export const GetContractParamsSchema = z.object({
  id: z.coerce.number(),
})

export class GetContractParamsDTO extends createZodDto(
  GetContractParamsSchema
) {}

// Schema cho chữ ký hợp đồng
export const SignContractSchema = z.object({
  signature: z.string(), // Base64 encoded signature image
  identityCard: z.string().optional(),
  identityCardIssuedDate: z.string().optional(),
  identityCardIssuedPlace: z.string().optional(),
  address: z.string().optional(),
})

export class SignContractDTO extends createZodDto(SignContractSchema) {}

// Schema cho thêm tệp đính kèm
export const AddContractAttachmentSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileUrl: z.string(),
})

export class AddContractAttachmentDTO extends createZodDto(
  AddContractAttachmentSchema
) {}

// Schema cho hợp đồng trả về chi tiết
export const ContractDetailSchema = z.object({
  id: z.number(),
  contractNumber: z.string(),
  rentalRequestId: z.number(),
  roomId: z.number(),
  landlordId: z.number(),
  tenantId: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  monthlyRent: z.number(),
  deposit: z.number(),
  paymentDueDate: z.number(),
  contractContent: z.string(),
  terms: z.record(z.any()).nullable(),
  landlordSignedAt: z.date().nullable(),
  tenantSignedAt: z.date().nullable(),
  status: z.nativeEnum(ContractStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  finalDocumentUrl: z.string().nullable(),

  // Thông tin liên kết
  landlord: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
  }),
  tenant: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
  }),
  room: z.object({
    id: z.number(),
    title: z.string(),
    price: z.number(),
    area: z.number(),
  }),
  rentalRequest: z.object({
    id: z.number(),
    postId: z.number(),
    status: z.string(),
  }),
  attachments: z
    .array(
      z.object({
        id: z.number(),
        fileUrl: z.string(),
        fileName: z.string(),
        fileType: z.string(),
        uploadedBy: z.number(),
        createdAt: z.date(),
      })
    )
    .optional(),
  template: z
    .object({
      id: z.number(),
      name: z.string(),
      fileUrl: z.string(),
    })
    .nullable(),
})

export class ContractDetailDTO extends createZodDto(ContractDetailSchema) {}

// Schema cho danh sách hợp đồng trả về
export const ContractsListSchema = z.object({
  data: z.array(ContractDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export class ContractsListDTO extends createZodDto(ContractsListSchema) {}
