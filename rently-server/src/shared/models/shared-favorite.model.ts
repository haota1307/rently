import { UserType } from 'src/shared/models/shared-user.model'

export type FavoriteType = {
  id: number
  createdAt: Date
  userId: number
  postId: number
  user?: UserType
  post?: any
}

export type CreateFavoriteBodyType = {
  postId: number
}

export type DeleteFavoriteParamType = {
  id: number
}

export type GetUserFavoritesQueryType = {
  page: number
  limit: number
}

export type FavoriteWithPostType = {
  id: number
  createdAt: Date
  userId: number
  postId: number
  post: any
}

export type GetUserFavoritesResType = {
  data: FavoriteWithPostType[]
  totalItems: number
  page: number
  limit: number
  totalPages: number
}

export type FavoriteStatusType = {
  isFavorited: boolean
  favoriteId: number | null
}
