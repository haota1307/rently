import http from "@/lib/http";
import queryString from "query-string";
import {
  RecommendationsResponse,
  RecommendationParams,
  TrackClickParams,
} from "@/types/recommendation";

const prefix = "/recommendations";

const recommendationApiRequest = {
  // Lấy danh sách recommendations
  getRecommendations: (params: RecommendationParams) =>
    http.get<RecommendationsResponse>(
      `${prefix}?` +
        queryString.stringify({
          roomId: params.roomId,
          limit: params.limit || 8,
          method: params.method || "CONTENT_BASED",
          maxDistance: params.maxDistance || 5000,
          priceVariance: params.priceVariance || 0.3,
          areaVariance: params.areaVariance || 0.4,
        })
    ),

  // Track click cho recommendation
  trackClick: (data: TrackClickParams) =>
    http.post<{ message: string }>(`${prefix}/track-click`, data),
};

export default recommendationApiRequest;
