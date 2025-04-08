import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import favoriteApiRequest from "./favorite.api";
import { toast } from "sonner";
import {
  CreateFavoriteBodyType,
  GetFavoritesQueryType,
} from "@/schemas/favorite.schema";
import { useAuth } from "@/hooks/use-auth";

export const useFavoritesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favoriteApiRequest.toggleFavorite,
    onSuccess: (response) => {
      toast.success(response.payload.message);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-status"] });
    },
  });
};

export const useCreateFavoriteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favoriteApiRequest.createFavorite,
    onSuccess: (response) => {
      toast.success(response.payload.message || "Đã lưu tin thành công");
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
};

export const useDeleteFavoriteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favoriteApiRequest.deleteFavorite,
    onSuccess: (response) => {
      toast.success(response.payload.message || "Đã xóa tin đã lưu");
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
};

export const useGetUserFavoritesQuery = (query: GetFavoritesQueryType) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["favorites", query],
    queryFn: () => favoriteApiRequest.getUserFavorites(query),
    select: (data) => data.payload,
    enabled: isAuthenticated,
  });
};

export const useCheckFavoriteStatusQuery = (rentalId: number) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["favorite-status", rentalId],
    queryFn: () => favoriteApiRequest.checkFavoriteStatus(rentalId),
    select: (data) => data.payload,
    enabled: isAuthenticated && !!rentalId,
  });
};
