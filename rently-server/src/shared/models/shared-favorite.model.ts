import { UserType } from 'src/shared/models/shared-user.model'
import { RentalType } from 'src/shared/models/shared-rental.mode'

export type FavoriteType = {
  id: number
  createdAt: Date
  userId: number
  rentalId: number
  user?: UserType
  rental?: RentalType
}

export type CreateFavoriteBodyType = {
  rentalId: number
}

export type DeleteFavoriteParamType = {
  id: number
}

export type GetUserFavoritesQueryType = {
  page: number
  limit: number
}

export type GetUserFavoritesResType = {
  data: FavoriteType[]
  totalItems: number
  page: number
  limit: number
  totalPages: number
}
