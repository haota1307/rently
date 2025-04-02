import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userApiRequest from "@/features/user/user.api";
import {
  GetUsersQueryType,
  CreateUserBodyType,
  UpdateUserBodyType,
  GetUserProfileResType,
} from "@/schemas/user.schema";

// Hook lấy danh sách người dùng
export const useGetUsers = (queryParams: GetUsersQueryType) => {
  return useQuery({
    queryKey: ["users", queryParams],
    queryFn: async () => {
      const res = await userApiRequest.list(queryParams);
      return res.payload;
    },
  });
};

// Hook lấy danh sách chủ trọ
export const useGetLandlords = (
  params: {
    page?: number;
    limit?: number;
    name?: string;
    status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
  } = {}
) => {
  return useQuery({
    queryKey: ["landlords", params],
    queryFn: async () => {
      const res = await userApiRequest.listLandlords(params);
      return res.payload;
    },
  });
};

// Hook lấy chi tiết thông tin người dùng theo userId
export const useGetUserDetail = (
  userId: number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await userApiRequest.detail(userId);
      return res.payload as GetUserProfileResType;
    },
    enabled: options?.enabled !== false && userId > 0,
  });
};

// Hook tạo mới người dùng
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateUserBodyType) => {
      const res = await userApiRequest.create(body);
      return res.payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Hook cập nhật thông tin người dùng
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      body,
    }: {
      userId: number;
      body: UpdateUserBodyType;
    }) => {
      const res = await userApiRequest.update(userId, body);
      return res.payload as GetUserProfileResType;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Hook xóa người dùng
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await userApiRequest.delete(userId);
      return res.payload;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
