import http from "@/lib/http";
import {
  CreateAmenityBodyType,
  GetAmenitiesQueryType,
  GetAmenitiesResType,
  AmenityType,
  UpdateAmenityBodyType,
} from "@/schemas/amenity.schema";
import queryString from "query-string";

const prefix = "/amenities";

const amenityApiRequest = {
  list: (params: { page?: number; limit?: number; name?: string }) =>
    http.get<GetAmenitiesResType>(
      `${prefix}?` +
        queryString.stringify({
          limit: params.limit || 100,
          page: params.page || 1,
          name: params.name,
        })
    ),

  detail: (amenityId: number) =>
    http.get<AmenityType>(`${prefix}/${amenityId}`),

  create: (body: { name: string }) => http.post<AmenityType>(`${prefix}`, body),

  update: (amenityId: number, body: { name: string }) =>
    http.put<AmenityType>(`${prefix}/${amenityId}`, body),

  delete: (amenityId: number) =>
    http.delete<{ message: string }>(`${prefix}/${amenityId}`),
};

export default amenityApiRequest;
