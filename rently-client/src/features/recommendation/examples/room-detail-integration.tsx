"use client";

import { RoomRecommendations } from "../components/RoomRecommendations";
import { Suspense } from "react";
import { RecommendationSkeleton } from "../components/RecommendationSkeleton";

interface RoomDetailPageProps {
  roomId: number;
  className?: string;
}

/**
 * Ví dụ integration recommendation vào trang chi tiết phòng
 * Usage:
 * <RoomDetailRecommendations roomId={123} />
 */
export function RoomDetailRecommendations({
  roomId,
  className = "",
}: RoomDetailPageProps) {
  return (
    <section className={`py-12 bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4">
        <Suspense fallback={<RecommendationSkeleton count={4} />}>
          <RoomRecommendations
            roomId={roomId}
            method="CONTENT_BASED"
            limit={8}
            title="Các phòng trọ tương tự"
            showMetadata={true}
            showSimilarityBreakdown={false}
          />
        </Suspense>
      </div>
    </section>
  );
}

/**
 * Compact version cho sidebar hoặc không gian nhỏ
 */
export function RoomDetailRecommendationsCompact({
  roomId,
  className = "",
}: RoomDetailPageProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <Suspense fallback={<RecommendationSkeleton count={3} />}>
        <RoomRecommendations
          roomId={roomId}
          method="CONTENT_BASED"
          limit={3}
          title="Phòng tương tự"
          showMetadata={false}
          showSimilarityBreakdown={false}
          className="bg-white rounded-lg p-4 shadow-sm"
        />
      </Suspense>
    </div>
  );
}

/**
 * Advanced version với nhiều tùy chọn
 */
export function RoomDetailRecommendationsAdvanced({
  roomId,
  className = "",
}: RoomDetailPageProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Content-based recommendations */}
      <Suspense fallback={<RecommendationSkeleton count={4} />}>
        <RoomRecommendations
          roomId={roomId}
          method="CONTENT_BASED"
          limit={6}
          title="Phòng có đặc điểm tương tự"
          showMetadata={true}
          showSimilarityBreakdown={true}
        />
      </Suspense>

      {/* Popular recommendations */}
      <Suspense fallback={<RecommendationSkeleton count={4} />}>
        <RoomRecommendations
          roomId={roomId}
          method="POPULARITY"
          limit={4}
          title="Phòng được quan tâm nhiều"
          showMetadata={false}
          showSimilarityBreakdown={false}
        />
      </Suspense>
    </div>
  );
}
