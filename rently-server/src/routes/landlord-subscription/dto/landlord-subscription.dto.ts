import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

// Zod schemas
export const CreateSubscriptionSchema = z.object({
  planType: z.string().default('BASIC').optional(),
  planId: z.string().optional(), // ID của plan từ subscription_plans
  isFreeTrial: z.boolean().default(false).optional(),
  autoRenew: z.boolean().default(true).optional(),
})

export const UpdateSubscriptionSchema = z.object({
  autoRenew: z.boolean().optional(),
})

export const RenewSubscriptionSchema = z.object({
  paymentId: z.number().positive().optional(),
})

// DTOs
export class CreateSubscriptionDto extends createZodDto(
  CreateSubscriptionSchema
) {}
export class UpdateSubscriptionDto extends createZodDto(
  UpdateSubscriptionSchema
) {}
export class RenewSubscriptionDto extends createZodDto(
  RenewSubscriptionSchema
) {}
