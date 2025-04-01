import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import postApiRequest from "@/features/post/post.api";
import {
  GetPostDetailResType,
  GetPostsQueryType,
  GetPostsResType,
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
  return useQuery<GetPostsResType>({
    queryKey: ["my-posts", queryParams],
    queryFn: async () => {
      const res = await postApiRequest.listMyPosts(queryParams);
      return res.payload;
    },
  });
};

export const useGetPostDetail = (postId: number) => {
  return useQuery<GetPostDetailResType>({
    queryKey: ["post", postId],
    queryFn: async () => {
      const res = await postApiRequest.detail(postId);
      return res.payload as GetPostDetailResType;
    },
    enabled: !!postId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const res = await postApiRequest.create(body);
      return res.payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, body }: { postId: number; body: any }) => {
      const res = await postApiRequest.update(postId, body);
      return res.payload;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const res = await postApiRequest.delete(postId);
      return res.payload;
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};
