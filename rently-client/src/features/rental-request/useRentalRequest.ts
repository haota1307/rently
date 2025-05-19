"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import rentalRequestApiRequest from "./rental-request.api";
import {
  CreateRentalRequestBodyType,
  GetRentalRequestsQueryType,
  RentalRequestStatus,
  UpdateRentalRequestBodyType,
} from "@/schemas/rental-request.schema";

// Hook to fetch rental requests for landlords
export const useGetRentalRequests = (
  params: Partial<GetRentalRequestsQueryType> = { limit: 10, page: 1 }
) => {
  return useQuery({
    queryKey: ["rental-requests", params],
    queryFn: () =>
      rentalRequestApiRequest.list(params as GetRentalRequestsQueryType),
  });
};

// Hook to fetch rental requests for tenants
export const useGetTenantRentalRequests = (
  params: Partial<GetRentalRequestsQueryType> = { limit: 10, page: 1 }
) => {
  return useQuery({
    queryKey: ["tenant-rental-requests", params],
    queryFn: () =>
      rentalRequestApiRequest.list({
        ...params,
        role: "TENANT",
      } as GetRentalRequestsQueryType),
  });
};

// Hook to fetch rental request detail
export const useGetRentalRequestDetail = (id: number) => {
  return useQuery({
    queryKey: ["rental-request", id],
    queryFn: () => rentalRequestApiRequest.detail(id),
    enabled: !!id,
  });
};

// Hook to update rental request status
export const useUpdateRentalRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: number;
      status: RentalRequestStatus;
      note?: string;
    }) => rentalRequestApiRequest.updateStatus(id, status, note),
    onSuccess: (data) => {
      // Làm mới các truy vấn yêu cầu thuê
      queryClient.invalidateQueries({ queryKey: ["rental-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-rental-requests"] });

      // Làm mới truy vấn bài đăng để cập nhật trạng thái phòng
      if (data?.postId) {
        queryClient.invalidateQueries({ queryKey: ["post", data.postId] });
      }

      // Làm mới danh sách bài đăng
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
    },
  });
};

// Hook to cancel rental request (for tenants)
export const useCancelRentalRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rentalRequestApiRequest.cancel(id),
    onSuccess: (data) => {
      // Làm mới các truy vấn yêu cầu thuê
      queryClient.invalidateQueries({ queryKey: ["rental-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-rental-requests"] });

      // Làm mới truy vấn bài đăng để cập nhật trạng thái phòng
      if (data?.postId) {
        queryClient.invalidateQueries({ queryKey: ["post", data.postId] });
      }

      // Làm mới danh sách bài đăng
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
    },
  });
};

// Hook to create a new rental request
export const useCreateRentalRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRentalRequestBodyType) =>
      rentalRequestApiRequest.create(data),
    onSuccess: (response) => {
      // Làm mới các truy vấn yêu cầu thuê
      queryClient.invalidateQueries({ queryKey: ["rental-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-rental-requests"] });

      // Làm mới truy vấn bài đăng để cập nhật trạng thái
      if (response?.postId) {
        queryClient.invalidateQueries({ queryKey: ["post", response.postId] });
      }

      // Làm mới danh sách bài đăng
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
    },
    onError: (error: any) => {
      // Trả về message lỗi từ server để component có thể hiển thị
      const errorMessage =
        error.response?.data?.message ||
        "Có lỗi xảy ra khi gửi yêu cầu thuê. Vui lòng thử lại sau.";
      throw new Error(errorMessage);
    },
  });
};

// Hook to update a rental request
export const useUpdateRentalRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateRentalRequestBodyType;
    }) => {
      return rentalRequestApiRequest.update(id, data);
    },
    onSuccess: (response) => {
      // Làm mới các truy vấn yêu cầu thuê
      queryClient.invalidateQueries({ queryKey: ["rental-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-rental-requests"] });

      // Làm mới truy vấn bài đăng để cập nhật trạng thái phòng
      if (response?.postId) {
        queryClient.invalidateQueries({ queryKey: ["post", response.postId] });
      }

      // Làm mới danh sách bài đăng
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
    },
  });
};
