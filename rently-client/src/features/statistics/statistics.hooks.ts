import { useQuery } from "@tanstack/react-query";
import {
  getStatisticsOverview,
  getRevenueData,
  getRoomDistribution,
  getPostsByArea,
  getPopularAreas,
} from "./statistics.api";

export const useGetStatisticsOverview = () => {
  return useQuery({
    queryKey: ["statistics", "overview"],
    queryFn: getStatisticsOverview,
  });
};

export const useGetRevenueData = (days: number = 7) => {
  return useQuery({
    queryKey: ["statistics", "revenue", days],
    queryFn: () => getRevenueData(days, "SEVQR NAP"),
  });
};

export const useGetRoomDistribution = () => {
  return useQuery({
    queryKey: ["statistics", "room-distribution"],
    queryFn: getRoomDistribution,
  });
};

export const useGetPostsByArea = (limit: number = 5) => {
  return useQuery({
    queryKey: ["statistics", "posts-by-area", limit],
    queryFn: () => getPostsByArea(limit),
  });
};

export const useGetPopularAreas = (limit: number = 5) => {
  return useQuery({
    queryKey: ["statistics", "popular-areas", limit],
    queryFn: () => getPopularAreas(limit),
  });
};
