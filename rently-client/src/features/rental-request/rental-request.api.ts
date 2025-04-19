import http from "@/lib/http";
import {
  CreateRentalRequestBodyType,
  GetRentalRequestsQueryType,
  RentalRequestDetailType,
  RentalRequestStatus,
  UpdateRentalRequestBodyType,
} from "@/schemas/rental-request.schema";

const rentalRequestApiRequest = {
  // Lấy danh sách yêu cầu thuê
  list: async (params: GetRentalRequestsQueryType) => {
    const response = await http.get<any>(`rental-requests`);
    return response.payload || response;
  },

  // Lấy chi tiết một yêu cầu thuê
  detail: async (id: number) => {
    const response = await http.get<any>(`rental-requests/${id}`);
    return response.payload || response;
  },

  // Tạo yêu cầu thuê mới
  create: async (data: CreateRentalRequestBodyType) => {
    const response = await http.post<any>(`rental-requests`, data);
    return response.payload || response;
  },

  // Cập nhật yêu cầu thuê
  update: async (id: number, data: UpdateRentalRequestBodyType) => {
    const response = await http.put<any>(`rental-requests/${id}`, data);
    return response.payload || response;
  },

  // Thay đổi trạng thái yêu cầu thuê
  updateStatus: async (
    id: number,
    status: RentalRequestStatus,
    note?: string
  ) => {
    const response = await http.put<any>(`rental-requests/${id}/status`, {
      status,
      note,
    });
    return response.payload || response;
  },

  // Hủy yêu cầu thuê (dành cho tenant)
  cancel: async (id: number) => {
    const response = await http.put<any>(`rental-requests/${id}/cancel`, {});
    return response.payload || response;
  },
};

export default rentalRequestApiRequest;
