import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import postApiRequest from "@/features/post/post.api";
import {
  GetPostsQueryType,
  PostType,
  CreatePostBodyType,
  UpdatePostBodyType,
} from "@/schemas/post.schema";

export const useGetPosts = (queryParams: GetPostsQueryType) => {
  return useQuery({
    queryKey: ["posts", queryParams],
    queryFn: async () => {
      const res = await postApiRequest.list(queryParams);
      return res.payload;
    },
  });
};

export const useGetMyPosts = (queryParams: GetPostsQueryType) => {
  return useQuery({
    queryKey: ["myPosts", queryParams],
    queryFn: async () => {
      const res = await postApiRequest.listMyPosts(queryParams);
      return res.payload;
    },
  });
};

export const useGetPostDetail = (
  postId: number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const res = await postApiRequest.detail(postId);
      return res.payload as PostType;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!postId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreatePostBodyType) => {
      const res = await postApiRequest.create(body);
      return res.payload as PostType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      body,
    }: {
      postId: number;
      body: UpdatePostBodyType;
    }) => {
      const res = await postApiRequest.update(postId, body);
      return res.payload as PostType;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const res = await postApiRequest.delete(postId);
      return res.payload as PostType;
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
    },
  });
};

export const useGetSimilarPostsByPrice = (postId: number, limit = 4) => {
  return useQuery({
    queryKey: ["similarPosts", postId, "price"],
    queryFn: async () => {
      const res = await postApiRequest.getSimilarByPrice(postId, limit);
      return res.payload;
    },
    enabled: !!postId,
  });
};

export const useGetSameRentalPosts = (
  rentalId: number,
  currentPostId: number,
  limit = 4
) => {
  return useQuery({
    queryKey: ["rentalPosts", rentalId, currentPostId],
    queryFn: async () => {
      const res = await postApiRequest.getSameRental(
        rentalId,
        currentPostId,
        limit
      );
      return res.payload;
    },
    enabled: !!rentalId && !!currentPostId,
  });
};
