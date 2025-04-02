import http from "@/lib/http";
import queryString from "query-string";
import { PermissionType } from "@/schemas/permission.schema";
import { HTTPMethod } from "@/constants/role.constant";

const prefix = "/permissions";

interface GetPermissionsResType {
  data: PermissionType[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CreatePermissionBodyType {
  name: string;
  description: string;
  path: string;
  module: string;
  method: keyof typeof HTTPMethod;
}

interface UpdatePermissionBodyType {
  name?: string;
  description?: string;
  path?: string;
  module?: string;
  method?: keyof typeof HTTPMethod;
}

const permissionApiRequest = {
  // Lấy danh sách quyền với phân trang
  list: (params: { page?: number; limit?: number } = {}) =>
    http.get<GetPermissionsResType>(
      `${prefix}?` +
        queryString.stringify({
          limit: params.limit || 10,
          page: params.page || 1,
        })
    ),

  // Lấy chi tiết quyền
  detail: (permissionId: number) =>
    http.get<PermissionType>(`${prefix}/${permissionId}`),

  // Tạo mới quyền
  create: (body: CreatePermissionBodyType) =>
    http.post<PermissionType>(`${prefix}`, body),

  // Cập nhật quyền
  update: (permissionId: number, body: UpdatePermissionBodyType) =>
    http.put<PermissionType>(`${prefix}/${permissionId}`, body),

  // Xóa quyền
  delete: (permissionId: number) => http.delete(`${prefix}/${permissionId}`),
};

export default permissionApiRequest;
