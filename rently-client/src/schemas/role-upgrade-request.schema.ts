import { z } from "zod";

export const RoleUpgradeRequestSchema = z.object({
  id: z.number(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  reason: z.string().nullable(),
  note: z.string().nullable(),
  frontImage: z.string(),
  backImage: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.number(),
  processedById: z.number().nullable(),
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    status: z.string(),
    balance: z.number(),
  }),
  processedBy: z
    .object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
    })
    .nullable(),
});

export const GetRoleUpgradeRequestsResSchema = z.object({
  data: z.array(RoleUpgradeRequestSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const GetRoleUpgradeRequestsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    userId: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
  })
  .strict();

export const CreateRoleUpgradeRequestBodySchema = z
  .object({
    reason: z.string().min(1, "Vui lòng nhập lý do"),
    frontImage: z.string(),
    backImage: z.string(),
  })
  .strict();

export const UpdateRoleUpgradeRequestBodySchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    note: z.string().optional(),
  })
  .strict();

export type RoleUpgradeRequestType = z.infer<typeof RoleUpgradeRequestSchema>;
export type GetRoleUpgradeRequestsResType = z.infer<
  typeof GetRoleUpgradeRequestsResSchema
>;
export type GetRoleUpgradeRequestsQueryType = z.infer<
  typeof GetRoleUpgradeRequestsQuerySchema
>;
export type CreateRoleUpgradeRequestBodyType = z.infer<
  typeof CreateRoleUpgradeRequestBodySchema
>;
export type UpdateRoleUpgradeRequestBodyType = z.infer<
  typeof UpdateRoleUpgradeRequestBodySchema
>;
