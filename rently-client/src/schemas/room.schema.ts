import { z } from "zod";

export const RoomSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.preprocess(
    (arg) =>
      typeof arg === "object" && arg !== null && "toNumber" in arg
        ? (arg as any).toNumber()
        : arg,
    z.number()
  ),
  area: z.preprocess(
    (arg) =>
      typeof arg === "object" && arg !== null && "toNumber" in arg
        ? (arg as any).toNumber()
        : arg,
    z.number()
  ),
  isAvailable: z.boolean().default(true),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  rentalId: z.number(),
});

export const GetRoomsResSchema = z.object({
  data: z.array(RoomSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const GetRoomsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    ownerId: z.coerce.number().optional(),
    title: z.string().optional(),
    status: z.string().optional(),
    priceRange: z.string().optional(),
    areaRange: z.string().optional(),
  })
  .strict();

export const GetRoomParamsSchema = z
  .object({
    roomId: z.coerce.number(),
  })
  .strict();

export const GetRoomDetailResSchema = RoomSchema;

export const CreateRoomBodySchema = z
  .object({
    title: z.string(),
    price: z.number(),
    area: z.number(),
    isAvailable: z.boolean().optional().default(true),
    rentalId: z.number(),
  })
  .strict();

export const UpdateRoomBodySchema = CreateRoomBodySchema;

export type RoomType = z.infer<typeof RoomSchema>;
export type GetRoomsResType = z.infer<typeof GetRoomsResSchema>;
export type GetRoomsQueryType = z.infer<typeof GetRoomsQuerySchema>;
export type GetRoomParamsType = z.infer<typeof GetRoomParamsSchema>;
export type GetRoomDetailResType = z.infer<typeof GetRoomDetailResSchema>;
export type CreateRoomBodyType = z.infer<typeof CreateRoomBodySchema>;
export type UpdateRoomBodyType = z.infer<typeof UpdateRoomBodySchema>;
