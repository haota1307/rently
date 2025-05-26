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
    const response = await http.get<any>(`rental-requests`, {
      headers: {
        "query-params": JSON.stringify(params),
      },
    });
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
  update: async (id: number | string, data: UpdateRentalRequestBodyType) => {
    // Chuyển đổi ID sang số (nếu nó là chuỗi)
    const numericId = typeof id === "string" ? Number(id) : id;

    // Đảm bảo id không undefined và là số hợp lệ
    if (numericId === undefined || isNaN(numericId)) {
      throw new Error("ID yêu cầu thuê không hợp lệ");
    }

    const response = await http.put<any>(`rental-requests/${numericId}`, data);
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

  // Hủy yêu cầu thuê (dành cho tenant và landlord)
  cancel: async (
    id: number,
    data: { note: string; refundDeposit: boolean }
  ) => {
    const response = await http.put<any>(`rental-requests/${id}/cancel`, data);
    return response.payload || response;
  },
};

export default rentalRequestApiRequest;
