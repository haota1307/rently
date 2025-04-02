import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import permissionApiRequest from "@/features/permission/permission.api";
import { PermissionType } from "@/schemas/permission.schema";
import { HTTPMethod } from "@/constants/role.constant";

// Type cho body tạo mới permission
interface CreatePermissionBodyType {
  name: string;
  description: string;
  path: string;
  module: string;
  method: keyof typeof HTTPMethod;
}

// Type cho body cập nhật permission
interface UpdatePermissionBodyType {
  name?: string;
  description?: string;
  path?: string;
  module?: string;
  method?: keyof typeof HTTPMethod;
}

// Hook lấy danh sách quyền
export const useGetPermissions = (
  params: { page?: number; limit?: number } = {}
) => {
  return useQuery({
    queryKey: ["permissions", params],
    queryFn: async () => {
      const res = await permissionApiRequest.list(params);
      return res.payload;
    },
  });
};

// Hook lấy tất cả permission (không phân trang để dùng trong form chọn quyền)
export const useGetAllPermissions = () => {
  return useQuery({
    queryKey: ["permissions", "all"],
    queryFn: async () => {
      const res = await permissionApiRequest.list({ limit: 999 });
      return res.payload.data;
    },
  });
};

// Hook lấy chi tiết quyền
export const useGetPermissionDetail = (permissionId: number) => {
  return useQuery({
    queryKey: ["permission", permissionId],
    queryFn: async () => {
      const res = await permissionApiRequest.detail(permissionId);
      return res.payload as PermissionType;
    },
    enabled: permissionId > 0,
  });
};

// Hook tạo mới quyền
export const useCreatePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreatePermissionBodyType) => {
      const res = await permissionApiRequest.create(body);
      return res.payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};

// Hook cập nhật quyền
export const useUpdatePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      permissionId,
      body,
    }: {
      permissionId: number;
      body: UpdatePermissionBodyType;
    }) => {
      const res = await permissionApiRequest.update(permissionId, body);
      return res.payload;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["permission", variables.permissionId],
      });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};

// Hook xóa quyền
export const useDeletePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (permissionId: number) => {
      const res = await permissionApiRequest.delete(permissionId);
      return res.payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};
