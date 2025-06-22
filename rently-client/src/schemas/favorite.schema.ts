import { z } from "zod";

export const FavoriteSchema = z.object({
  id: z.number(),
  createdAt: z.string().or(z.date()),
  userId: z.number(),
  postId: z.number(),
});

export const PostInFavoriteSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  deposit: z
    .number()
    .or(z.string())
    .transform((val) => Number(val)),
  status: z.string(),
  createdAt: z.string().or(z.date()),
  room: z.object({
    id: z.number(),
    title: z.string(),
    price: z
      .number()
      .or(z.string())
      .transform((val) => Number(val)),
    area: z.number(),
    isAvailable: z.boolean(),
    rental: z.object({
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
      rentalImages: z.array(
        z.object({
          id: z.number(),
          imageUrl: z.string(),
          order: z.number(),
        })
      ),
    }),
    roomImages: z.array(
      z.object({
        id: z.number(),
        imageUrl: z.string(),
        order: z.number(),
      })
    ),
    roomAmenities: z.array(
      z.object({
        amenity: z.object({
          id: z.number(),
          name: z.string(),
        }),
      })
    ),
  }),
});

export const FavoriteWithPostSchema = FavoriteSchema.extend({
  post: PostInFavoriteSchema,
});

export const GetFavoritesQuerySchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
});

export const CreateFavoriteBodySchema = z.object({
  postId: z.number(),
});

export const FavoriteStatusSchema = z.object({
  isFavorited: z.boolean(),
  favoriteId: z.number().nullable(),
});

export type FavoriteType = z.infer<typeof FavoriteSchema>;
export type PostInFavoriteType = z.infer<typeof PostInFavoriteSchema>;
export type FavoriteWithPostType = z.infer<typeof FavoriteWithPostSchema>;
export type GetFavoritesQueryType = z.infer<typeof GetFavoritesQuerySchema>;
export type CreateFavoriteBodyType = z.infer<typeof CreateFavoriteBodySchema>;
export type FavoriteStatusType = z.infer<typeof FavoriteStatusSchema>;
