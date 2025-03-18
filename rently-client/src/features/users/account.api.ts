import {
  DeleteUserBodyType,
  GetMeResType,
  GetUserBodyType,
  GetUserResType,
  GetUsersQueryType,
  GetUsersResType,
  UpdateUserBodyType,
  UpdateUserResType,
} from "@/features/users/schema/account.schema";
import http from "@/lib/http";
import { MessageResType } from "@/types/message.type";
import queryString from "query-string";

const prefix = "/users";

const accountApiRequest = {
  getMe: () => http.get<GetMeResType>(`${prefix}/me`),

  getUsers: (query: GetUsersQueryType) =>
    http.get<GetUsersResType>(
      `${prefix}` +
        queryString.stringify({
          limit: query.limit,
          page: query.page,
          role: query.role,
        })
    ),

  getUser: (body: GetUserBodyType) =>
    http.get<GetUserResType>(`${prefix}/${body.id}`),

  updateUser: (id: number, body: UpdateUserBodyType) =>
    http.put<UpdateUserResType>(`${prefix}/${id}`, body),

  deleteUser: (body: DeleteUserBodyType) =>
    http.delete<MessageResType>(`${prefix}/${body.id}`),
};

export default accountApiRequest;
