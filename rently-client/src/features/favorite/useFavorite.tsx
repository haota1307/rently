import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import favoriteApiRequest from "./favorite.api";
import { toast } from "sonner";
import {
  CreateFavoriteBodyType,
  GetFavoritesQueryType,
} from "../../schemas/favorite.schema";
import { useAuth } from "../../hooks/use-auth";

export const useFavoritesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFavoriteBodyType) => {
      console.log("Toggle favorite mutation data:", data); // Debug log
      if (!data.postId) {
        throw new Error("postId is required");
      }
      return favoriteApiRequest.toggleFavorite(data);
    },
    onSuccess: (response: any, variables) => {
      toast.success(response.payload.message);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({
        queryKey: ["favorite-status", variables.postId],
      });
    },
    onError: (error: any) => {
      console.error("Toggle favorite error:", error);
      toast.error(
        error?.response?.data?.message || error.message || "Có lỗi xảy ra"
      );
    },
  });
};

export const useCreateFavoriteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favoriteApiRequest.createFavorite,
    onSuccess: (response: any) => {
      toast.success(response.payload.message || "Đã lưu bài đăng thành công");
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
};

export const useDeleteFavoriteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favoriteApiRequest.deleteFavorite,
    onSuccess: (response: any) => {
      toast.success(response.payload.message || "Đã xóa bài đăng đã lưu");
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

export const useCheckFavoriteStatusQuery = (postId: number) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["favorite-status", postId],
    queryFn: () => favoriteApiRequest.checkFavoriteStatus(postId),
    select: (data) => data.payload,
    enabled: isAuthenticated && !!postId,
  });
};
