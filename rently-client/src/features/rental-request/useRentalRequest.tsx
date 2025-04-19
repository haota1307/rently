"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import rentalRequestApiRequest from "@/features/rental-request/rental-request.api";
import {
  CreateRentalRequestBodyType,
  GetRentalRequestsQueryType,
  RentalRequestDetailType,
  UpdateRentalRequestBodyType,
  RentalRequestStatus,
} from "@/schemas/rental-request.schema";
import { toast } from "sonner";

// Hook để lấy danh sách yêu cầu thuê cho landlord
export const useGetRentalRequests = (
  queryParams: GetRentalRequestsQueryType
) => {
  return useQuery({
    queryKey: ["rental-requests", queryParams],
    queryFn: async () => {
      const res = await rentalRequestApiRequest.list(queryParams);
      return res;
    },
  });
};

// Hook để lấy danh sách yêu cầu thuê cho tenant
export const useGetTenantRentalRequests = (
  queryParams: GetRentalRequestsQueryType
) => {
  return useQuery({
    queryKey: ["tenant-rental-requests", queryParams],
    queryFn: async () => {
      const res = await rentalRequestApiRequest.list({
        ...queryParams,
        role: "TENANT",
      });
      return res;
    },
  });
};

// Hook để lấy chi tiết một yêu cầu thuê
export const useGetRentalRequestDetail = (requestId: number) => {
  return useQuery({
    queryKey: ["rental-request", requestId],
    queryFn: async () => {
      const res = await rentalRequestApiRequest.detail(requestId);
      return res;
    },
    enabled: !!requestId,
  });
};

// Hook để cập nhật trạng thái yêu cầu thuê
export const useUpdateRentalRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      note,
    }: {
      id: number;
      status: RentalRequestStatus;
      note?: string;
    }) => {
      const res = await rentalRequestApiRequest.updateStatus(id, status, note);
      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rental-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tenant-rental-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["rental-request", variables.id],
      });
    },
  });
};

// Hook để hủy yêu cầu thuê (dành cho tenant)
export const useCancelRentalRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await rentalRequestApiRequest.cancel(id);
      return res;
    },
    onSuccess: (_, variables) => {
      toast.success("Đã hủy yêu cầu thuê thành công");
      queryClient.invalidateQueries({
        queryKey: ["rental-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tenant-rental-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["rental-request", variables],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.payload?.message || "Có lỗi xảy ra khi hủy yêu cầu thuê"
      );
    },
  });
};

// Hook để tạo yêu cầu thuê mới
export const useCreateRentalRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRentalRequestBodyType) => {
      const res = await rentalRequestApiRequest.create(data);
      return res;
    },
    onSuccess: () => {
      toast.success("Gửi yêu cầu thuê thành công");
      queryClient.invalidateQueries({
        queryKey: ["rental-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tenant-rental-requests"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.payload?.message || "Có lỗi xảy ra khi gửi yêu cầu thuê"
      );
    },
  });
};

// Hook để cập nhật yêu cầu thuê
export const useUpdateRentalRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      data,
    }: {
      requestId: number;
      data: UpdateRentalRequestBodyType;
    }) => {
      const res = await rentalRequestApiRequest.update(requestId, data);
      return res;
    },
    onSuccess: (_, variables) => {
      toast.success("Cập nhật yêu cầu thuê thành công");
      queryClient.invalidateQueries({
        queryKey: ["rental-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tenant-rental-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["rental-request", variables.requestId],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.payload?.message || "Có lỗi xảy ra khi cập nhật yêu cầu thuê"
      );
    },
  });
};
