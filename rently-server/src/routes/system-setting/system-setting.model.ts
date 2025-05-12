import { z } from 'zod'

export const SYSTEM_SETTING_GROUPS = {
  INTERFACE: 'interface',
  EMAIL: 'email',
  PRICING: 'pricing',
} as const

export const SYSTEM_SETTING_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  JSON: 'json',
  FILE: 'file',
} as const

export const SystemSettingSchema = z.object({
  id: z.number(),
  key: z.string().min(1).max(255),
  value: z.string(),
  type: z.enum([
    SYSTEM_SETTING_TYPES.STRING,
    SYSTEM_SETTING_TYPES.NUMBER,
    SYSTEM_SETTING_TYPES.BOOLEAN,
    SYSTEM_SETTING_TYPES.JSON,
    SYSTEM_SETTING_TYPES.FILE,
  ]),
  group: z.enum([
    SYSTEM_SETTING_GROUPS.INTERFACE,
    SYSTEM_SETTING_GROUPS.EMAIL,
    SYSTEM_SETTING_GROUPS.PRICING,
  ]),
  description: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.number().nullable().optional(),
  updatedById: z.number().nullable().optional(),
})

export const CreateSystemSettingSchema = SystemSettingSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  key: z.string().min(1).max(255),
  value: z.string(),
})

export const UpdateSystemSettingSchema = SystemSettingSchema.omit({
  id: true,
  key: true,
  createdAt: true,
  updatedAt: true,
})

export const GetSystemSettingByGroupSchema = z.object({
  group: z.enum([
    SYSTEM_SETTING_GROUPS.INTERFACE,
    SYSTEM_SETTING_GROUPS.EMAIL,
    SYSTEM_SETTING_GROUPS.PRICING,
  ]),
})

export type SystemSettingType = z.infer<typeof SystemSettingSchema>
export type CreateSystemSettingType = z.infer<typeof CreateSystemSettingSchema>
export type UpdateSystemSettingType = z.infer<typeof UpdateSystemSettingSchema>
export type GetSystemSettingByGroupType = z.infer<
  typeof GetSystemSettingByGroupSchema
>
