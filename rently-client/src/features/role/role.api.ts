import http from "@/lib/http";
import queryString from "query-string";
import { RoleType } from "@/schemas/role.schema";
import { PermissionType } from "@/schemas/permission.schema";

const prefix = "/roles";

interface GetRolesResType {
  data: RoleType[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface GetRoleDetailResType extends RoleType {
  permissions: PermissionType[];
}

// Type cho body tạo mới - không bao gồm permissionIds
interface CreateRoleBodyType {
  name: string;
  description: string;
  isActive?: boolean;
}

// Type cho body cập nhật - bao gồm permissionIds
interface UpdateRoleBodyType {
  name?: string;
  description?: string;
  permissionIds: number[];
  isActive?: boolean;
}

const roleApiRequest = {
  // Lấy danh sách vai trò với phân trang
  list: (params: { page?: number; limit?: number } = {}) =>
    http.get<GetRolesResType>(
      `${prefix}?` +
        queryString.stringify({
          limit: params.limit || 10,
          page: params.page || 1,
        })
    ),

  // Lấy chi tiết vai trò
  detail: (roleId: number) =>
    http.get<GetRoleDetailResType>(`${prefix}/${roleId}`),

  // Tạo mới vai trò
  create: (body: CreateRoleBodyType) =>
    http.post<GetRoleDetailResType>(`${prefix}`, body),

  // Cập nhật vai trò
  update: (roleId: number, body: UpdateRoleBodyType) =>
    http.put<GetRoleDetailResType>(`${prefix}/${roleId}`, body),

  // Xóa vai trò
  delete: (roleId: number) => http.delete(`${prefix}/${roleId}`),
};

export default roleApiRequest;
