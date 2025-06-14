import { useQuery, useMutation } from "@tanstack/react-query";
import {
  RecommendationsResponse,
  RecommendationParams,
  TrackClickParams,
} from "@/types/recommendation";
import recommendationApiRequest from "../recommendation.api";

// Hook để lấy recommendations - sử dụng React Query
export function useRecommendations(
  params: RecommendationParams,
  options?: { enabled?: boolean }
) {
  return useQuery<RecommendationsResponse>({
    queryKey: ["recommendations", params],
    queryFn: async () => {
      const res = await recommendationApiRequest.getRecommendations(params);
      // res.payload = { success: true, message: "...", data: { data: [...], metadata: {...} } }
      // Trả về đúng structure với type assertion để fix TypeScript
      return res.payload.data as unknown as RecommendationsResponse;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!params.roomId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook để track click - sử dụng mutation
export function useTrackRecommendationClick() {
  return useMutation({
    mutationFn: async (params: TrackClickParams) => {
      const res = await recommendationApiRequest.trackClick(params);
      return res.payload;
    },
    onError: (error) => {
      console.warn("Error tracking recommendation click:", error);
    },
  });
}
