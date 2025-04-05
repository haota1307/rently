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
  list: (params: GetAmenitiesQueryType) =>
    http.get<GetAmenitiesResType>(
      `${prefix}?` +
        queryString.stringify({
          limit: params.limit,
          page: params.page,
          name: params.name,
        })
    ),

  detail: (amenityId: number) =>
    http.get<AmenityType>(`${prefix}/${amenityId}`),

  create: (body: CreateAmenityBodyType) =>
    http.post<AmenityType>(`${prefix}`, body),

  update: (amenityId: number, body: UpdateAmenityBodyType) =>
    http.put<AmenityType>(`${prefix}/${amenityId}`, body),

  delete: (amenityId: number) =>
    http.delete<{ message: string }>(`${prefix}/${amenityId}`),
};

export default amenityApiRequest;
