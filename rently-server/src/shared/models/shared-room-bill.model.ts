import { Decimal } from '@prisma/client/runtime/library'
import { z } from 'zod'
import { RoomSchema } from './shared-room.model'

export const RoomUtilityBillSchema = z.object({
  id: z.number(),
  roomId: z.number(),
  electricityOld: z.number(),
  electricityNew: z.number(),
  electricityPrice: z.preprocess(
    arg =>
      typeof arg === 'object' && arg !== null && 'toNumber' in arg
        ? (arg as Decimal).toNumber()
        : arg,
    z.number()
  ),
  waterOld: z.number(),
  waterNew: z.number(),
  waterPrice: z.preprocess(
    arg =>
      typeof arg === 'object' && arg !== null && 'toNumber' in arg
        ? (arg as Decimal).toNumber()
        : arg,
    z.number()
  ),
  otherFees: z.any().optional(),
  totalAmount: z.preprocess(
    arg =>
      typeof arg === 'object' && arg !== null && 'toNumber' in arg
        ? (arg as Decimal).toNumber()
        : arg,
    z.number()
  ),
  note: z.string().optional().nullable(),
  isPaid: z.boolean(),
  billingMonth: z.coerce.date(),
  dueDate: z.coerce.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.number(),
  emailSent: z.boolean(),
  room: RoomSchema.optional(),
})

export const CreateRoomBillSchema = z.object({
  roomId: z.number(),
  electricityOld: z.number(),
  electricityNew: z.number(),
  electricityPrice: z.number().default(3500),
  waterOld: z.number(),
  waterNew: z.number(),
  waterPrice: z.number().default(15000),
  otherFees: z.any().optional(),
  totalAmount: z.number(),
  note: z.string().optional().nullable(),
  billingMonth: z.coerce.date(),
  dueDate: z.coerce.date(),
})

export const UpdateRoomBillSchema = CreateRoomBillSchema.partial().extend({
  isPaid: z.boolean().optional(),
})

export const GetRoomBillQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  roomId: z.coerce.number().optional(),
  isPaid: z.coerce.boolean().optional(),
  billingMonth: z.coerce.date().optional(),
})

export const GetRoomBillsResSchema = z.object({
  data: z.array(RoomUtilityBillSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetRoomBillParamsSchema = z.object({
  id: z.coerce.number(),
})

export const SendBillEmailParamsSchema = z.object({
  id: z.coerce.number(),
  email: z.string().email(),
})

export type RoomUtilityBillType = z.infer<typeof RoomUtilityBillSchema>
export type CreateRoomBillType = z.infer<typeof CreateRoomBillSchema>
export type UpdateRoomBillType = z.infer<typeof UpdateRoomBillSchema>
export type GetRoomBillQueryType = z.infer<typeof GetRoomBillQuerySchema>
export type GetRoomBillsResType = z.infer<typeof GetRoomBillsResSchema>
export type GetRoomBillParamsType = z.infer<typeof GetRoomBillParamsSchema>
export type SendBillEmailParamsType = z.infer<typeof SendBillEmailParamsSchema>
