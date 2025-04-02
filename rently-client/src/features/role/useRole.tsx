import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import roleApiRequest from "@/features/role/role.api";
import { RoleType } from "@/schemas/role.schema";
import { PermissionType } from "@/schemas/permission.schema";

// Type cho Role với thông tin permissions
interface RoleWithPermissions extends RoleType {
  permissions: PermissionType[];
}

// Type cho body create role - không bao gồm permissionIds
interface CreateRoleBodyType {
  name: string;
  description: string;
  isActive?: boolean;
}

// Type cho body update role - bao gồm permissionIds
interface UpdateRoleBodyType {
  name?: string;
  description?: string;
  permissionIds: number[];
  isActive?: boolean;
}

// Hook lấy danh sách vai trò
export const useGetRoles = (
  params: { page?: number; limit?: number; staleTime?: number } = {}
) => {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: async () => {
      const res = await roleApiRequest.list(params);
      return res.payload;
    },
    staleTime: params.staleTime !== undefined ? params.staleTime : 0,
  });
};

// Hook lấy chi tiết vai trò
export const useGetRoleDetail = (roleId: number) => {
  return useQuery({
    queryKey: ["role", roleId],
    queryFn: async () => {
      const res = await roleApiRequest.detail(roleId);
      return res.payload as RoleWithPermissions;
    },
    enabled: roleId > 0,
    staleTime: 0,
  });
};

// Hook tạo mới vai trò
export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateRoleBodyType) => {
      const res = await roleApiRequest.create(body);
      return res.payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

// Hook cập nhật vai trò
export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      body,
    }: {
      roleId: number;
      body: UpdateRoleBodyType;
    }) => {
      const res = await roleApiRequest.update(roleId, body);
      return res.payload;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["role", variables.roleId] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

// Hook xóa vai trò
export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: number) => {
      const res = await roleApiRequest.delete(roleId);
      return res.payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};
