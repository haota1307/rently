import { z } from 'zod'

export const GetUserFavoritesQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
})

export const CreateFavoriteBodySchema = z.object({
  rentalId: z.number({
    required_error: 'ID nhà trọ là bắt buộc',
    invalid_type_error: 'ID nhà trọ phải là số',
  }),
})

export const DeleteFavoriteParamSchema = z.object({
  id: z.string().transform(val => Number(val)),
})

export const FavoriteSchema = z.object({
  id: z.number(),
  createdAt: z.date(),
  userId: z.number(),
  rentalId: z.number(),
})

export const RentalInFavoriteSchema = z.object({
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
  createdAt: z.date(),
  updatedAt: z.date(),
  landlordId: z.number(),
  rentalImages: z.array(
    z.object({
      id: z.number(),
      imageUrl: z.string(),
      createdAt: z.date(),
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
        .transform(val => Number(val)),
      area: z.number(),
      isAvailable: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
      rentalId: z.number(),
    })
  ),
})

export const FavoriteWithRentalSchema = FavoriteSchema.extend({
  rental: RentalInFavoriteSchema,
})

export const GetUserFavoritesResSchema = z.object({
  data: z.array(FavoriteWithRentalSchema),
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
export type RentalInFavoriteType = z.infer<typeof RentalInFavoriteSchema>
export type FavoriteWithRentalType = z.infer<typeof FavoriteWithRentalSchema>
export type GetUserFavoritesResType = z.infer<typeof GetUserFavoritesResSchema>
export type FavoriteStatusType = z.infer<typeof FavoriteStatusSchema>
