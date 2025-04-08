import { z } from "zod";

export const FavoriteSchema = z.object({
  id: z.number(),
  createdAt: z.string().or(z.date()),
  userId: z.number(),
  rentalId: z.number(),
});

export const RentalInFavoriteSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  address: z.string(),
  lat: z
    .number()
    .or(z.string())
    .transform((val) => Number(val)),
  lng: z
    .number()
    .or(z.string())
    .transform((val) => Number(val)),
  distance: z
    .number()
    .or(z.string())
    .transform((val) => Number(val))
    .nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  landlordId: z.number(),
  rentalImages: z.array(
    z.object({
      id: z.number(),
      imageUrl: z.string(),
      createdAt: z.string().or(z.date()),
      order: z.number(),
      rentalId: z.number(),
    })
  ),
  rooms: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      price: z
        .number()
        .or(z.string())
        .transform((val) => Number(val)),
      area: z.number(),
      isAvailable: z.boolean(),
      createdAt: z.string().or(z.date()),
      updatedAt: z.string().or(z.date()),
      rentalId: z.number(),
    })
  ),
});

export const FavoriteWithRentalSchema = FavoriteSchema.extend({
  rental: RentalInFavoriteSchema,
});

export const GetFavoritesQuerySchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
});

export const CreateFavoriteBodySchema = z.object({
  rentalId: z.number(),
});

export const FavoriteStatusSchema = z.object({
  isFavorited: z.boolean(),
  favoriteId: z.number().nullable(),
});

export type FavoriteType = z.infer<typeof FavoriteSchema>;
export type RentalInFavoriteType = z.infer<typeof RentalInFavoriteSchema>;
export type FavoriteWithRentalType = z.infer<typeof FavoriteWithRentalSchema>;
export type GetFavoritesQueryType = z.infer<typeof GetFavoritesQuerySchema>;
export type CreateFavoriteBodyType = z.infer<typeof CreateFavoriteBodySchema>;
export type FavoriteStatusType = z.infer<typeof FavoriteStatusSchema>;
