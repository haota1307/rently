import { z } from "zod";

export const AmenitySchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.date(),
});

export const GetAmenitiesResSchema = z.object({
  data: z.array(AmenitySchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const GetAmenitiesQuerySchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(100),
  name: z.string().optional(),
  sort: z.string().optional(),
});

export const CreateAmenityBodySchema = z
  .object({
    name: z.string().min(1, { message: "Tên tiện ích không được để trống" }),
  })
  .strict();

export const UpdateAmenityBodySchema = CreateAmenityBodySchema;

export type AmenityType = z.infer<typeof AmenitySchema>;
export type GetAmenitiesResType = z.infer<typeof GetAmenitiesResSchema>;
export type GetAmenitiesQueryType = z.infer<typeof GetAmenitiesQuerySchema>;
export type CreateAmenityBodyType = z.infer<typeof CreateAmenityBodySchema>;
export type UpdateAmenityBodyType = z.infer<typeof UpdateAmenityBodySchema>;
