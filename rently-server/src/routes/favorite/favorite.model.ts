import { z } from 'zod'

export const GetUserFavoritesQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
})

export const CreateFavoriteBodySchema = z.object({
  postId: z.number({
    required_error: 'ID bài đăng là bắt buộc',
    invalid_type_error: 'ID bài đăng phải là số',
  }),
  rentalId: z
    .number({
      invalid_type_error: 'ID nhà trọ phải là số',
    })
    .optional(),
})

export const DeleteFavoriteParamSchema = z.object({
  id: z.string().transform(val => Number(val)),
})

export const FavoriteSchema = z.object({
  id: z.number(),
  createdAt: z.date(),
  userId: z.number(),
  postId: z.number(),
})

export const PostInFavoriteSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  deposit: z
    .number()
    .or(z.string())
    .transform(val => Number(val)),
  status: z.string(),
  createdAt: z.date(),
  room: z.object({
    id: z.number(),
    title: z.string(),
    price: z
      .number()
      .or(z.string())
      .transform(val => Number(val)),
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
        .transform(val => Number(val)),
      lng: z
        .number()
        .or(z.string())
        .transform(val => Number(val)),
      distance: z
        .number()
        .or(z.string())
        .transform(val => Number(val))
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
})

export const FavoriteWithPostSchema = FavoriteSchema.extend({
  post: PostInFavoriteSchema,
})

export const GetUserFavoritesResSchema = z.object({
  data: z.array(FavoriteWithPostSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const FavoriteStatusSchema = z.object({
  isFavorited: z.boolean(),
  favoriteId: z.number().nullable(),
})

export type GetUserFavoritesQueryType = z.infer<
  typeof GetUserFavoritesQuerySchema
>
export type CreateFavoriteBodyType = z.infer<typeof CreateFavoriteBodySchema>
export type DeleteFavoriteParamType = z.infer<typeof DeleteFavoriteParamSchema>
export type FavoriteType = z.infer<typeof FavoriteSchema>
export type PostInFavoriteType = z.infer<typeof PostInFavoriteSchema>
export type FavoriteWithPostType = z.infer<typeof FavoriteWithPostSchema>
export type GetUserFavoritesResType = z.infer<typeof GetUserFavoritesResSchema>
export type FavoriteStatusType = z.infer<typeof FavoriteStatusSchema>
