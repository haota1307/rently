import { z } from 'zod'

export const CreateRoleUpgradeRequestBodySchema = z
  .object({
    reason: z.string().optional(),
    frontImage: z.string(),
    backImage: z.string(),
    selfieImage: z.string().optional(),
    faceVerificationData: z
      .object({
        similarity: z.number(),
        isVerified: z.boolean(),
        timestamp: z.string(),
      })
      .optional(),
  })
  .strict()

export const UpdateRoleUpgradeRequestBodySchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED']),
    note: z.string().optional(),
  })
  .strict()

export const GetRoleUpgradeRequestParamsSchema = z
  .object({
    requestId: z.coerce.number(),
  })
  .strict()

export const GetRoleUpgradeRequestsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    userId: z.coerce.number().int().positive().optional(),
  })
  .strict()

// Types
export type CreateRoleUpgradeRequestBodyType = z.infer<
  typeof CreateRoleUpgradeRequestBodySchema
>
export type UpdateRoleUpgradeRequestBodyType = z.infer<
  typeof UpdateRoleUpgradeRequestBodySchema
>
export type GetRoleUpgradeRequestParamsType = z.infer<
  typeof GetRoleUpgradeRequestParamsSchema
>
export type GetRoleUpgradeRequestsQueryType = z.infer<
  typeof GetRoleUpgradeRequestsQuerySchema
>

// DTOs
export type CreateRoleUpgradeRequestBodyDTO = CreateRoleUpgradeRequestBodyType
export type UpdateRoleUpgradeRequestBodyDTO = UpdateRoleUpgradeRequestBodyType
export type GetRoleUpgradeRequestParamsDTO = GetRoleUpgradeRequestParamsType
export type GetRoleUpgradeRequestsQueryDTO = GetRoleUpgradeRequestsQueryType
