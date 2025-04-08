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
