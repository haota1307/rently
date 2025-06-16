import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import roomBillApiRequest from "./room-bill.api";
import {
  CreateRoomBillType,
  GetRoomBillQueryType,
  RoomBillType,
  UpdateRoomBillType,
} from "@/schemas/room-bill.schema";

// Hook lấy danh sách hóa đơn (cho landlord)
export const useGetRoomBills = (queryParams: GetRoomBillQueryType) => {
  return useQuery({
    queryKey: ["room-bills", queryParams],
    queryFn: async () => {
      const res = await roomBillApiRequest.list(queryParams);
      return res.payload;
    },
  });
};

// Hook lấy danh sách hóa đơn (cho tenant)
export const useGetTenantRoomBills = (queryParams: GetRoomBillQueryType) => {
  return useQuery({
    queryKey: ["tenant-room-bills", queryParams],
    queryFn: async () => {
      const res = await roomBillApiRequest.listTenantBills(queryParams);
      return res.payload;
    },
  });
};

// Hook lấy chi tiết hóa đơn
export const useGetRoomBillDetail = (billId: number) => {
  return useQuery({
    queryKey: ["room-bill", billId],
    queryFn: async () => {
      const res = await roomBillApiRequest.detail(billId);
      return res.payload as RoomBillType;
    },
    enabled: !!billId,
  });
};

// Hook tạo hóa đơn mới
export const useCreateRoomBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateRoomBillType) => {
      const res = await roomBillApiRequest.create(body);
      return res.payload as RoomBillType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-bills"] });
    },
  });
};

// Hook cập nhật hóa đơn
export const useUpdateRoomBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      billId,
      body,
    }: {
      billId: number;
      body: UpdateRoomBillType;
    }) => {
      const res = await roomBillApiRequest.update(billId, body);
      return res.payload as RoomBillType;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["room-bill", variables.billId],
      });
      queryClient.invalidateQueries({ queryKey: ["room-bills"] });
    },
  });
};

// Hook đánh dấu hóa đơn đã thanh toán
export const useMarkRoomBillAsPaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (billId: number) => {
      const res = await roomBillApiRequest.markAsPaid(billId);
      return res.payload as RoomBillType;
    },
    onSuccess: (_, billId) => {
      queryClient.invalidateQueries({ queryKey: ["room-bill", billId] });
      queryClient.invalidateQueries({ queryKey: ["room-bills"] });
    },
  });
};

// Hook xóa hóa đơn
export const useDeleteRoomBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (billId: number) => {
      const res = await roomBillApiRequest.delete(billId);
      return res.payload;
    },
    onSuccess: (_, billId) => {
      queryClient.invalidateQueries({ queryKey: ["room-bill", billId] });
      queryClient.invalidateQueries({ queryKey: ["room-bills"] });
    },
  });
};

// Định nghĩa kiểu dữ liệu cho thông tin người thuê mới
export interface TenantType {
  id: number;
  name: string;
  email: string;
}

// Định nghĩa kiểu dữ liệu cho response từ API tenant-info
export interface TenantInfoResponseNew {
  tenant: TenantType | null;
  roomRent: number;
}

// Định nghĩa kiểu dữ liệu cho thông tin hóa đơn gần nhất
export interface LatestBillInfo {
  electricityOld: number;
  electricityNew: number;
  waterOld: number;
  waterNew: number;
  electricityPrice: number;
  waterPrice: number;
}

// Định nghĩa kiểu dữ liệu cho thông tin người thuê (cũ, giữ lại để tương thích)
export interface TenantInfoData {
  tenantId: number;
  tenantName: string;
  tenantEmail: string;
  roomPrice: number;
  contractRent: number;
}

export interface TenantInfoResponse {
  success: boolean;
  message?: string;
  data?: TenantInfoData;
}

// Hook gửi hóa đơn qua email
export const useSendRoomBillEmail = () => {
  return useMutation({
    mutationFn: async ({
      billId,
      email,
    }: {
      billId: number;
      email: string;
    }) => {
      const res = await roomBillApiRequest.sendEmail(billId, email);
      return res.payload;
    },
  });
};

// Hook lấy thông tin người thuê phòng
export const useGetTenantInfo = (roomId?: number) => {
  return useQuery<TenantInfoResponseNew | null>({
    queryKey: ["room-tenant-info", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const res = await roomBillApiRequest.getTenantInfo(roomId);
      return res.payload as TenantInfoResponseNew;
    },
    enabled: !!roomId,
  });
};

// Hook lấy thông tin hóa đơn gần nhất của phòng
export const useGetLatestBillInfo = (roomId?: number) => {
  return useQuery<LatestBillInfo>({
    queryKey: ["latest-bill-info", roomId],
    queryFn: async () => {
      if (!roomId)
        return {
          electricityOld: 0,
          electricityNew: 0,
          waterOld: 0,
          waterNew: 0,
          electricityPrice: 3500,
          waterPrice: 15000,
        };
      const res = await roomBillApiRequest.getLatestBillInfo(roomId);
      return res.payload as LatestBillInfo;
    },
    enabled: !!roomId,
  });
};
