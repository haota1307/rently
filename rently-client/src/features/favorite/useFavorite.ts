import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import favoriteApiRequest from "./favorite.api";
import { toast } from "sonner";
import {
  CreateFavoriteBodyType,
  GetFavoritesQueryType,
} from "../../schemas/favorite.schema";
import { useAuth } from "../../hooks/use-auth";

export const useGetUserFavoritesQuery = (query: GetFavoritesQueryType) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["favorites", query],
    queryFn: () => favoriteApiRequest.getUserFavorites(query),
    select: (data) => data.payload,
    enabled: isAuthenticated,
    staleTime: 1000 * 60, // 1 phút
  });
};

export const useCheckFavoriteStatusQuery = (postId: number) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["favoriteStatus", postId],
    queryFn: () => favoriteApiRequest.checkFavoriteStatus(postId),
    select: (data) => data.payload,
    enabled: isAuthenticated && !!postId,
    staleTime: 1000 * 60, // 1 phút
  });
};

export const useFavoritesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFavoriteBodyType) => {
      return await favoriteApiRequest.toggleFavorite(data);
    },
    onSuccess: (response, variables) => {
      toast.success(response.payload.message);

      // Cập nhật trạng thái yêu thích
      queryClient.invalidateQueries({
        queryKey: ["favoriteStatus", variables.postId],
      });

      // Cập nhật danh sách yêu thích
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (error: any) => {
      toast.error(
        error.message || "Đã xảy ra lỗi khi thực hiện thao tác yêu thích"
      );
    },
  });
};
