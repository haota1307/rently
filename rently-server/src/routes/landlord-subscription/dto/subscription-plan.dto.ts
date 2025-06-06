import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

// Zod schema cho SubscriptionPlan
export const SubscriptionPlanSchema = z.object({
  id: z.string().min(1, 'ID là bắt buộc'),
  name: z.string().min(1, 'Tên gói là bắt buộc'),
  description: z.string().optional().nullable(),
  price: z.preprocess(
    val => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0, 'Giá không được âm')
  ),
  duration: z.number().positive('Thời hạn phải lớn hơn 0'),
  durationType: z.enum(['days', 'months', 'years']),
  features: z.array(z.string()).optional().default([]),
  isFreeTrial: z.boolean().default(false),
  isActive: z.boolean().default(true),
  color: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
})

// DTO từ Zod schema
export class SubscriptionPlanDto extends createZodDto(SubscriptionPlanSchema) {}

// Schema cho cập nhật danh sách plans
export const UpdateSubscriptionPlansSchema = z.object({
  plans: z.array(SubscriptionPlanSchema),
})

export class UpdateSubscriptionPlansDto extends createZodDto(
  UpdateSubscriptionPlansSchema
) {}
