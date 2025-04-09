import http from "@/lib/http";
import {
  CreateRoleUpgradeRequestBodyType,
  GetRoleUpgradeRequestsQueryType,
  GetRoleUpgradeRequestsResType,
  RoleUpgradeRequestType,
  UpdateRoleUpgradeRequestBodyType,
} from "@/schemas/role-upgrade-request.schema";
import queryString from "query-string";

export const prefix = "/role-upgrade-requests";

export const roleUpgradeRequestApiRequest = {
  prefix,

  list: (query: GetRoleUpgradeRequestsQueryType) => {
    const queryStr = queryString.stringify(query);
    return http.get<GetRoleUpgradeRequestsResType>(`${prefix}?${queryStr}`);
  },

  detail: (id: number) => http.get<RoleUpgradeRequestType>(`${prefix}/${id}`),

  create: (data: CreateRoleUpgradeRequestBodyType) => {
    return http.post<RoleUpgradeRequestType>(prefix, data);
  },

  update: (id: number, data: UpdateRoleUpgradeRequestBodyType) =>
    http.put<RoleUpgradeRequestType>(`${prefix}/${id}`, data),

  // Thêm endpoint mới để lấy yêu cầu nâng cấp của người dùng hiện tại
  me: () => http.get<RoleUpgradeRequestType>(`${prefix}/me`),
};
