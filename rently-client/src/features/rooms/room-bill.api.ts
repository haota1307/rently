import http from "@/lib/http";
import queryString from "query-string";
import {
  CreateRoomBillType,
  GetRoomBillQueryType,
  GetRoomBillsResType,
  RoomBillType,
  UpdateRoomBillType,
} from "@/schemas/room-bill.schema";

const prefix = "/room-bills";

// Hàm chuyển đổi Date object thành ngày dạng chuỗi ISO
const formatDateFields = (data: any) => {
  // Clone đối tượng để tránh thay đổi đối tượng gốc
  const result = JSON.parse(JSON.stringify(data));

  // Chuyển đổi các trường date
  if (result.billingMonth) {
    // Đảm bảo billingMonth là ngày đầu tháng
    const date = new Date(result.billingMonth);
    date.setDate(1); // Ngày đầu tháng
    date.setHours(0, 0, 0, 0); // Đặt thời gian về 00:00:00
    result.billingMonth = date.toISOString();
  }

  if (result.dueDate) {
    // Đảm bảo dueDate có định dạng ISO không có múi giờ
    const date = new Date(result.dueDate);
    date.setHours(0, 0, 0, 0); // Đặt thời gian về 00:00:00
    result.dueDate = date.toISOString();
  }

  console.log("Formatted data:", result);
  return result;
};

const roomBillApiRequest = {
  list: (params: GetRoomBillQueryType) => {
    // Tạo đối tượng query với kiểu dữ liệu any để có thể thêm thuộc tính động
    const queryParams: Record<string, any> = {
      page: params.page,
      limit: params.limit,
      ...(params.roomId && { roomId: params.roomId }),
      ...(params.isPaid !== undefined && { isPaid: params.isPaid }),
    };

    // Xử lý riêng cho trường billingMonth
    if (params.billingMonth) {
      const date = new Date(params.billingMonth);
      date.setDate(1); // Luôn lấy ngày đầu tháng
      date.setHours(0, 0, 0, 0);
      queryParams.billingMonth = date.toISOString();
    }

    return http.get<GetRoomBillsResType>(
      `${prefix}?${queryString.stringify(queryParams)}`
    );
  },

  detail: (id: number) => http.get<RoomBillType>(`${prefix}/${id}`),

  create: (data: CreateRoomBillType) => {
    const formattedData = formatDateFields(data);
    console.log("Creating bill with data:", formattedData);
    return http.post<RoomBillType>(`${prefix}`, formattedData);
  },

  update: (id: number, data: UpdateRoomBillType) => {
    const formattedData = formatDateFields(data);
    console.log("Updating bill with data:", formattedData);
    return http.put<RoomBillType>(`${prefix}/${id}`, formattedData);
  },

  delete: (id: number) => http.delete(`${prefix}/${id}`),

  sendEmail: (id: number, email: string) =>
    http.post(`${prefix}/${id}/send-email`, { email }),

  markAsPaid: (id: number) =>
    http.put<RoomBillType>(`${prefix}/${id}`, { isPaid: true }),

  getTenantInfo: (roomId: number) =>
    http.get(`${prefix}/room/${roomId}/tenant-info`),

  getLatestBillInfo: (roomId: number) =>
    http.get(`${prefix}/room/${roomId}/latest-bill`),
};

export default roomBillApiRequest;
