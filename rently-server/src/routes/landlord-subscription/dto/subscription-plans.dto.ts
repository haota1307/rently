import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

// Zod schema cho subscription plan
export const SubscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().min(0),
  duration: z.number().positive(),
  durationType: z.enum(['days', 'months', 'years']),
  features: z.array(z.string()),
  isFreeTrial: z.boolean(),
  isActive: z.boolean(),
  color: z.string().optional(),
  badge: z.string().optional(),
  icon: z.string().optional(),
})

export const UpdateSubscriptionPlansSchema = z.object({
  plans: z.array(SubscriptionPlanSchema),
})

// DTOs
export class UpdateSubscriptionPlansDto extends createZodDto(
  UpdateSubscriptionPlansSchema
) {}

export class SubscriptionPlanDto extends createZodDto(SubscriptionPlanSchema) {}
