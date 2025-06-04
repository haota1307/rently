import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import rentalApiRequest from "@/features/rental/rental.api";
import {
  GetRentalsQueryType,
  RentalType,
  CreateRentalBodyType,
  UpdateRentalBodyType,
} from "@/schemas/rental.schema";

export const useGetRentals = (queryParams: GetRentalsQueryType) => {
  return useQuery({
    queryKey: ["rentals", queryParams],
    queryFn: async () => {
      const res = await rentalApiRequest.list(queryParams);
      return res.payload;
    },
  });
};

export const useGetRentalsById = (
  userId: number,
  queryParams: GetRentalsQueryType
) => {
  return useQuery({
    queryKey: ["rentals", queryParams],
    queryFn: async () => {
      const res = await rentalApiRequest.getRentalsById(userId, queryParams);
      return res.payload;
    },
  });
};

export const useGetRentalDetail = (
  rentalId: number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["rental", rentalId],
    queryFn: async () => {
      const res = await rentalApiRequest.detail(rentalId);
      return res.payload as RentalType;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!rentalId,
  });
};

export const useCreateRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateRentalBodyType) => {
      const res = await rentalApiRequest.create(body);
      return res.payload as RentalType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
  });
};

// Hook để admin tạo nhà trọ cho người cho thuê
export const useCreateRentalForLandlord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateRentalBodyType & { landlordId: number }) => {
      const res = await rentalApiRequest.createForLandlord(body);
      return res.payload as RentalType;
    },
    onSuccess: () => {
      // Invalidate các query liên quan
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
  });
};

// Cập nhật bất động sản
export const useUpdateRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      rentalId,
      body,
    }: {
      rentalId: number;
      body: UpdateRentalBodyType;
    }) => {
      const res = await rentalApiRequest.update(rentalId, body);
      return res.payload as RentalType;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rental", variables.rentalId],
      });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
  });
};

// Xóa bất động sản
export const useDeleteRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rentalId: number) => {
      const res = await rentalApiRequest.delete(rentalId);
      return res.payload as RentalType;
    },
    onSuccess: (_, rentalId) => {
      queryClient.invalidateQueries({ queryKey: ["rental", rentalId] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
  });
};
