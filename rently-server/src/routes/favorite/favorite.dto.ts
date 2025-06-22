import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import {
  CreateFavoriteBodySchema,
  DeleteFavoriteParamSchema,
  GetUserFavoritesQuerySchema,
  GetUserFavoritesResSchema,
  FavoriteStatusSchema,
} from 'src/routes/favorite/favorite.model'

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

export class GetUserFavoritesQueryDTO extends createZodDto(
  GetUserFavoritesQuerySchema
) {}

export class CreateFavoriteBodyDTO extends createZodDto(
  CreateFavoriteBodySchema
) {}

export class DeleteFavoriteParamDTO extends createZodDto(
  DeleteFavoriteParamSchema
) {}

export class GetUserFavoritesResDTO extends createZodDto(
  GetUserFavoritesResSchema
) {}

export class FavoriteStatusDTO extends createZodDto(FavoriteStatusSchema) {}
