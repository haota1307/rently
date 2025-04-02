import http from "@/lib/http";
import queryString from "query-string";
import {
  CreateUserBodyType,
  CreateUserResType,
  GetUserParamsType,
  GetUserProfileResType,
  GetUsersQueryType,
  GetUsersResType,
  UpdateUserBodyType,
} from "@/schemas/user.schema";

const prefix = "/users";

const userApiRequest = {
  // Lấy danh sách người dùng với phân trang
  list: (params: GetUsersQueryType) =>
    http.get<GetUsersResType>(
      `${prefix}?` +
        queryString.stringify({
          limit: params.limit,
          page: params.page,
          name: params.name,
          status: params.status,
          roleId: params.roleId,
        })
    ),

  // Lấy danh sách chủ trọ
  listLandlords: (
    params: {
      page?: number;
      limit?: number;
      name?: string;
      status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
    } = {
      page: 1,
      limit: 999,
    }
  ) =>
    http.get<GetUsersResType>(
      `${prefix}?` +
        queryString.stringify({
          limit: params.limit || 999, // Lấy tất cả
          page: params.page || 1,
          name: params.name,
          status: params.status || "ACTIVE",
          roleId: [1, 2].join(","), // Lấy cả admin (1) và landlord (2)
        })
    ),

  // Lấy thông tin chi tiết của 1 người dùng theo userId
  detail: (userId: number) =>
    http.get<GetUserProfileResType>(`${prefix}/${userId}`),

  // Tạo mới người dùng
  create: (body: CreateUserBodyType) =>
    http.post<CreateUserResType>(`${prefix}`, body),

  // Cập nhật thông tin người dùng theo userId
  update: (userId: number, body: UpdateUserBodyType) =>
    http.put<GetUserProfileResType>(`${prefix}/${userId}`, body),

  // Xóa người dùng theo userId
  delete: (userId: number) => http.delete(`${prefix}/${userId}`),
};

export default userApiRequest;
