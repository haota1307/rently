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
        queryString.stringify({
          limit: params.limit,
          page: params.page,
        })
    ),

  detail: (rentalId: number) => http.get<RentalType>(`${prefix}/${rentalId}`),

  create: (body: CreateRentalBodyType) =>
    http.post<RentalType>(`${prefix}`, body),

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
        })
    ),
};

export default rentalApiRequest;
