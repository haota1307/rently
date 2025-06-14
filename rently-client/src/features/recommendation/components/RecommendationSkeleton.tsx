"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecommendationSkeletonProps {
  count?: number;
  className?: string;
}

export function RecommendationSkeleton({
  count = 4,
  className = "",
}: RecommendationSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            {/* Image Skeleton */}
            <div className="relative">
              <Skeleton className="h-48 w-full" />
              {/* Badges */}
              <div className="absolute top-3 left-3">
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <div className="absolute top-3 right-3">
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
            </div>

            {/* Content Skeleton */}
            <CardContent className="p-4 space-y-3">
              {/* Title */}
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />

              {/* Location */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-full" />
              </div>

              {/* Price and Area */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>

              {/* Explanation */}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />

              {/* Action Button */}
              <Skeleton className="h-8 w-full rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function RecommendationSkeletonCompact({
  count = 3,
  className = "",
}: RecommendationSkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="flex">
              <Skeleton className="h-24 w-24 flex-shrink-0" />
              <div className="p-3 flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
