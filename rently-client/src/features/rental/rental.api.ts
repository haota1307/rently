import http from "@/lib/http";
import {
  CreateRentalBodyType,
  GetRentalsQueryType,
  GetRentalsResType,
  RentalType,
  UpdateRentalBodyType,
} from "@/schemas/rental.schema";
import queryString from "query-string";

const prefix = "/rentals";

const rentalApiRequest = {
  list: (params: GetRentalsQueryType) =>
    http.get<GetRentalsResType>(
      `${prefix}?` +
        queryString.stringify(
          {
            limit: params.limit,
            page: params.page,
            title: params.title,
            distance: params.distance,
            area: params.area,
            price: params.price,
            amenityIds: params.amenityIds,
            landlordId: params.landlordId,
            roomTypes: params.roomTypes,
          },
          { arrayFormat: "comma" }
        )
    ),

  detail: (rentalId: number) => http.get<RentalType>(`${prefix}/${rentalId}`),

  create: (body: CreateRentalBodyType) =>
    http.post<RentalType>(`${prefix}`, body),

  createForLandlord: (body: CreateRentalBodyType & { landlordId: number }) =>
    http.post<RentalType>(`${prefix}/admin/create-for-landlord`, body),

  update: (rentalId: number, body: UpdateRentalBodyType) =>
    http.put<RentalType>(`${prefix}/${rentalId}`, body),

  delete: (rentalId: number) =>
    http.delete<RentalType>(`${prefix}/${rentalId}`),

  getRentalsById: (userId: number, params: GetRentalsQueryType) =>
    http.get<GetRentalsResType>(
      `${prefix}/landlord/${userId}?` +
        queryString.stringify({
          limit: params.limit,
          page: params.page,
          title: params.title,
        })
    ),
};

export default rentalApiRequest;
