import { ContractStatus } from '@prisma/client'
import { z } from 'zod'
import {
  AddContractAttachmentSchema,
  ContractDetailSchema,
  ContractsListSchema,
  ContractTemplateSchema,
  ContractTemplatesListSchema,
  CreateContractSchema,
  CreateContractTemplateSchema,
  GetContractsQuerySchema,
  GetContractTemplatesQuerySchema,
  SignContractSchema,
} from './rental-contract.dto'

// Types cho các schema ở DTO
export type CreateContractTemplateType = z.infer<
  typeof CreateContractTemplateSchema
>
export type GetContractTemplatesQueryType = z.infer<
  typeof GetContractTemplatesQuerySchema
>
export type ContractTemplateType = z.infer<typeof ContractTemplateSchema>
export type ContractTemplatesListType = z.infer<
  typeof ContractTemplatesListSchema
>
export type CreateContractType = z.infer<typeof CreateContractSchema>
export type GetContractsQueryType = z.infer<typeof GetContractsQuerySchema>
export type SignContractType = z.infer<typeof SignContractSchema>
export type AddContractAttachmentType = z.infer<
  typeof AddContractAttachmentSchema
>
export type ContractDetailType = z.infer<typeof ContractDetailSchema>
export type ContractsListType = z.infer<typeof ContractsListSchema>

export { ContractStatus }
