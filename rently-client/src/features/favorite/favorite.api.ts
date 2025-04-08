import http from "@/lib/http";
import {
  CreateFavoriteBodyType,
  FavoriteStatusType,
  FavoriteWithRentalType,
  GetFavoritesQueryType,
} from "@/schemas/favorite.schema";
import { MessageResType } from "@/types/message.type";
import { PaginatedResponseType } from "@/types/pagination.type";

const favoriteApiRequest = {
  getUserFavorites: (query: GetFavoritesQueryType) =>
    http.get<PaginatedResponseType<FavoriteWithRentalType>>(
      `/favorites?page=${query.page}&limit=${query.limit}`
    ),

  createFavorite: (body: CreateFavoriteBodyType) =>
    http.post<MessageResType>("/favorites", body),

  deleteFavorite: (id: number) =>
    http.delete<MessageResType>(`/favorites/${id}`),

  toggleFavorite: (body: CreateFavoriteBodyType) =>
    http.post<MessageResType>("/favorites/toggle", body),

  checkFavoriteStatus: (rentalId: number) =>
    http.get<FavoriteStatusType>(`/favorites/check/${rentalId}`),
};

export default favoriteApiRequest;
