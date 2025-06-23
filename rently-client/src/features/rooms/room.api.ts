import http from "@/lib/http";
import {
  CreateRoomBodyType,
  CreateBulkRoomsBodyType,
  CreateBulkRoomsResType,
  GetRoomDetailResType,
  GetRoomsQueryType,
  GetRoomsResType,
  UpdateRoomBodyType,
} from "@/schemas/room.schema";

import queryString from "query-string";

const prefix = "/rooms";

const roomApiRequest = {
  list: (params: GetRoomsQueryType) =>
    http.get<GetRoomsResType>(
      `${prefix}?` +
        queryString.stringify({
          limit: params.limit,
          page: params.page,
        })
    ),

  listMyRooms: (params: GetRoomsQueryType) =>
    http.get<GetRoomsResType>(
      `${prefix}/my?` +
        queryString.stringify({
          limit: params.limit,
          page: params.page,
          title: params.title,
          status: params.status,
          priceRange: params.priceRange,
          areaRange: params.areaRange,
          withoutActivePosts: params.withoutActivePosts,
        })
    ),
  detail: (roomId: number) =>
    http.get<GetRoomDetailResType>(`${prefix}/${roomId}`),

  create: (body: CreateRoomBodyType) =>
    http.post<GetRoomDetailResType>(`${prefix}`, body),

  createBulk: (body: CreateBulkRoomsBodyType) =>
    http.post<CreateBulkRoomsResType>(`${prefix}/bulk`, body),

  createForLandlord: (body: CreateRoomBodyType & { landlordId: number }) =>
    http.post<GetRoomDetailResType>(
      `${prefix}/admin/create-for-landlord`,
      body
    ),

  update: (roomId: number, body: UpdateRoomBodyType) =>
    http.put<GetRoomDetailResType>(`${prefix}/${roomId}`, body),

  delete: (roomId: number) => http.delete(`${prefix}/${roomId}`),
};

export default roomApiRequest;
