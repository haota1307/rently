import { z } from "zod";

export const RentalSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  address: z.string(),
  lat: z.preprocess((arg) => {
    if (typeof arg === "object" && arg !== null && "toNumber" in arg) {
      return (arg as any).toNumber();
    }
    return arg;
  }, z.number()),
  lng: z.preprocess((arg) => {
    if (typeof arg === "object" && arg !== null && "toNumber" in arg) {
      return (arg as any).toNumber();
    }
    return arg;
  }, z.number()),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  landlordId: z.number(),
});

export const GetRentalsResSchema = z.object({
  data: z.array(RentalSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const GetRentalsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
  })
  .strict();

export const GetRentalParamsSchema = z
  .object({
    rentalId: z.coerce.number(),
  })
  .strict();

export const GetRentalDetailResSchema = RentalSchema;

export const CreateRentalBodySchema = z
  .object({
    title: z.string(),
    description: z.string(),
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
    landlordId: z.number(),
  })
  .strict();

export const UpdateRentalBodySchema = CreateRentalBodySchema;

export type RentalType = z.infer<typeof RentalSchema>;
export type GetRentalsResType = z.infer<typeof GetRentalsResSchema>;
export type GetRentalsQueryType = z.infer<typeof GetRentalsQuerySchema>;
export type GetRentalParamsType = z.infer<typeof GetRentalParamsSchema>;
export type GetRentalDetailResType = z.infer<typeof GetRentalDetailResSchema>;
export type CreateRentalBodyType = z.infer<typeof CreateRentalBodySchema>;
export type UpdateRentalBodyType = z.infer<typeof UpdateRentalBodySchema>;
