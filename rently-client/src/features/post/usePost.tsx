import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import postApiRequest from "@/features/post/post.api";
import {
  GetPostsQueryType,
  PostType,
  CreatePostBodyType,
  CreateBulkPostsBodyType,
  UpdatePostBodyType,
  UpdatePostStatusType,
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
      queryClient.invalidateQueries({ queryKey: ["rooms"] }); // Invalidate rooms để update available rooms
    },
  });
};

export const useCreateBulkPosts = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateBulkPostsBodyType) => {
      const res = await postApiRequest.createBulk(body);
      return res.payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] }); // Invalidate rooms để update available rooms
      onSuccessCallback?.();
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
      queryClient.invalidateQueries({ queryKey: ["rooms"] }); // Invalidate rooms khi post update
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, unknown, number>({
    mutationFn: async (postId: number) => {
      const res = await postApiRequest.delete(postId);
      return res.payload;
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] }); // Invalidate rooms để room trở lại available
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

export const useUpdatePostStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    unknown,
    {
      postId: number;
      body: UpdatePostStatusType;
    }
  >({
    mutationFn: async ({ postId, body }) => {
      const res = await postApiRequest.updateStatus(postId, body);
      return res.payload;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] }); // Invalidate rooms khi status thay đổi
    },
  });
};

export const useGetNearbyPosts = (
  coordinates: [number, number] | null,
  limit = 5,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["nearbyPosts", coordinates],
    queryFn: async () => {
      if (!coordinates) return { data: [], totalItems: 0 };
      const [lat, lng] = coordinates;
      const res = await postApiRequest.getNearbyPosts({
        lat,
        lng,
        limit,
      });
      return res.payload;
    },
    enabled:
      !!coordinates &&
      (options?.enabled !== undefined ? options.enabled : true),
  });
};
