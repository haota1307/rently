import { useQuery } from "@tanstack/react-query";
import {
  getStatisticsOverview,
  getRevenueData,
  getRoomDistribution,
  getPostsByArea,
  getPopularAreas,
  getLandlordTransactionData,
} from "./statistics.api";
import { format } from "date-fns";

export const useGetStatisticsOverview = () => {
  return useQuery({
    queryKey: ["statistics", "overview"],
    queryFn: getStatisticsOverview,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};

export const useGetRevenueData = (
  days: number = 7,
  startDate?: Date,
  endDate?: Date,
  landlordMode: boolean = false
) => {
  const startDateStr = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
  const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : undefined;

  const transactionContent = landlordMode ? "ALL" : "NAP|RUT";

  return useQuery({
    queryKey: [
      "statistics",
      "revenue",
      days,
      startDateStr,
      endDateStr,
      transactionContent,
    ],
    queryFn: async () => {
      try {
        const data = await getRevenueData(
          days,
          transactionContent,
          startDateStr,
          endDateStr
        );
        return data;
      } catch (error) {
        throw error;
      }
    },
    // Tăng thời gian stale cho dữ liệu thống kê lâu thay đổi
    staleTime: 10 * 60 * 1000, // 10 phút
    // Cache dữ liệu lâu hơn để tránh refetch không cần thiết
    gcTime: 30 * 60 * 1000, // 30 phút
    refetchOnWindowFocus: false,
    // Thêm retry với delay tăng dần
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useGetLandlordTransactionData = (
  days: number = 7,
  startDate?: Date,
  endDate?: Date
) => {
  const startDateStr = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
  const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : undefined;

  return useQuery({
    queryKey: [
      "statistics",
      "landlord-transaction",
      days,
      startDateStr,
      endDateStr,
    ],
    queryFn: async () => {
      try {
        const data = await getLandlordTransactionData(
          days,
          startDateStr,
          endDateStr
        );
        return data;
      } catch (error) {
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 phút
    gcTime: 30 * 60 * 1000, // 30 phút
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useGetRoomDistribution = () => {
  return useQuery({
    queryKey: ["statistics", "room-distribution"],
    queryFn: getRoomDistribution,
    staleTime: 15 * 60 * 1000, // 15 phút
  });
};

export const useGetPostsByArea = (limit: number = 5) => {
  return useQuery({
    queryKey: ["statistics", "posts-by-area", limit],
    queryFn: () => getPostsByArea(limit),
    staleTime: 30 * 60 * 1000, // 30 phút
  });
};

export const useGetPopularAreas = (limit: number = 5) => {
  return useQuery({
    queryKey: ["statistics", "popular-areas", limit],
    queryFn: () => getPopularAreas(limit),
    staleTime: 60 * 60 * 1000, // 1 giờ
  });
};
