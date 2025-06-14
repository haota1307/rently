"use client";

import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Eye,
  BarChart3,
  TrendingUp,
  Target,
  Grid3X3,
  List,
} from "lucide-react";
import { RentalCard } from "@/components/rental-card";
import { Badge } from "@/components/ui/badge";
import { RecommendationMethod } from "@/types/recommendation";
import { RentalType } from "@/schemas/rental.schema";
import {
  useRecommendations,
  useTrackRecommendationClick,
} from "../hooks/useRecommendations";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface RoomRecommendationsProps {
  roomId?: number;
  method: keyof RecommendationMethod;
  limit?: number;
  maxDistance?: number;
  priceVariance?: number;
  areaVariance?: number;
  title?: string;
  showMetadata?: boolean;
  showSimilarityBreakdown?: boolean;
  className?: string;
  defaultViewMode?: "grid" | "list";
  maxColumns?: 3 | 4; // Số columns tối đa cho grid view
}

const methodLabels: Record<
  keyof RecommendationMethod,
  { label: string; icon: any; color: string }
> = {
  CONTENT_BASED: { label: "Tương tự", icon: Target, color: "bg-blue-500" },
  COLLABORATIVE: { label: "Cộng tác", icon: BarChart3, color: "bg-green-500" },
  POPULARITY: { label: "Phổ biến", icon: TrendingUp, color: "bg-purple-500" },
  LOCATION_BASED: { label: "Gần đây", icon: Eye, color: "bg-orange-500" },
  HYBRID: { label: "Kết hợp", icon: Target, color: "bg-gray-500" },
};

export function RoomRecommendations({
  roomId = 1,
  method,
  limit = 6,
  maxDistance = 5000,
  priceVariance = 0.3,
  areaVariance = 0.4,
  title,
  showMetadata = true,
  showSimilarityBreakdown = false,
  className,
  defaultViewMode = "grid",
  maxColumns = 4,
}: RoomRecommendationsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">(defaultViewMode);

  const { data, isLoading, error, refetch } = useRecommendations({
    roomId,
    method,
    limit,
    maxDistance,
    priceVariance,
    areaVariance,
  });

  const trackClickMutation = useTrackRecommendationClick();

  const handleRoomClick = (targetRoomId: number) => {
    if (data?.data && data.data.length > 0) {
      const room = data.data.find((r) => r.id === targetRoomId);
      if (room) {
        trackClickMutation.mutate({
          sourceRoomId: roomId,
          targetRoomId,
          method,
          rank: room.rank,
          similarityScore: room.similarityScore,
        });
      }
    }
  };

  const methodConfig = methodLabels[method];
  const Icon = methodConfig.icon;

  // Dynamic grid classes based on maxColumns
  const gridClasses =
    maxColumns === 4
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

  // Convert recommendation data to rental format for RentalCard
  const convertToRental = (room: any): RentalType => {
    return {
      id: room.id,
      title: room.title || "Phòng trọ",
      address: room.rental?.address || "",
      description: room.rental?.title || "",
      lat: room.rental?.lat || 0,
      lng: room.rental?.lng || 0,
      distance: room.rental?.distance || 0,
      landlordId: room.rental?.landlordId || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      rentalImages:
        room.rental?.rentalImages?.map((img: any, index: number) => ({
          id: img.id || index,
          imageUrl: img.imageUrl,
          rentalId: room.rental.id,
          order: img.order || index,
        })) || [],
      rooms: [
        {
          id: room.id,
          price: room.price || 0,
          area: room.area || 0,
          isAvailable: true,
          rentalId: room.rental?.id || room.id,
          roomImages:
            room.roomImages?.map((img: any, index: number) => ({
              id: img.id || index,
              imageUrl: img.imageUrl,
              roomId: room.id,
              order: img.order || index,
            })) || [],
          roomAmenities:
            room.roomAmenities?.map((ra: any, index: number) => ({
              roomId: room.id,
              amenityId: ra.amenity?.id || index,
              amenity: {
                id: ra.amenity?.id || index,
                name: ra.amenity?.name || "",
              },
            })) || [],
        },
      ],
    } as RentalType;
  };

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          {title && (
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title}
            </h3>
          )}
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
        <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
          <p>Lỗi khi tải gợi ý: {error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {title && (
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </h3>
        )}
        <div className={cn(viewMode === "grid" ? gridClasses : "space-y-4")}>
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div
                className={cn(
                  "bg-gray-200 rounded-lg mb-3",
                  viewMode === "grid" ? "aspect-[4/3]" : "h-32"
                )}
              ></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        {title && (
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </h3>
        )}
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <p>Không có gợi ý nào</p>
        </div>
      </div>
    );
  }

  const recommendations = data.data;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {title && (
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
              title="Xem dạng lưới"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
              title="Xem dạng danh sách"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {showMetadata && (
            <>
              <Badge variant="secondary">{recommendations.length} phòng</Badge>
            </>
          )}
        </div>
      </div>

      <div className={cn(viewMode === "grid" ? gridClasses : "space-y-4")}>
        {recommendations.map((room) => (
          <div key={room.id} className="relative group">
            {/* Recommendation metadata overlay */}
            {showSimilarityBreakdown && room.similarityScore && (
              <div
                className={cn(
                  "absolute top-2 left-2 z-20 flex gap-1",
                  viewMode === "list" ? "flex-row" : "flex-col"
                )}
              >
                <Badge variant="secondary" className="text-xs">
                  {Math.round(room.similarityScore * 100)}% phù hợp
                </Badge>
              </div>
            )}

            <div onClick={() => handleRoomClick(room.id)}>
              <RentalCard
                rental={convertToRental(room)}
                viewMode={viewMode}
                isNearbyPost={method === "LOCATION_BASED"}
              />
            </div>
          </div>
        ))}
      </div>

      {showSimilarityBreakdown && recommendations[0]?.similarityBreakdown && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Chi tiết độ tương đồng:</h4>
          <div className="text-sm text-gray-600">
            <p>
              • Giá:{" "}
              {Math.round(
                (recommendations[0].similarityBreakdown.price || 0) * 100
              )}
              %
            </p>
            <p>
              • Diện tích:{" "}
              {Math.round(
                (recommendations[0].similarityBreakdown.area || 0) * 100
              )}
              %
            </p>
            <p>
              • Tiện ích:{" "}
              {Math.round(
                (recommendations[0].similarityBreakdown.amenities || 0) * 100
              )}
              %
            </p>
            <p>
              • Vị trí:{" "}
              {Math.round(
                (recommendations[0].similarityBreakdown.location || 0) * 100
              )}
              %
            </p>
            {recommendations[0].explanation?.distance && (
              <p>
                • Khoảng cách:{" "}
                {Math.round(recommendations[0].explanation.distance)}m
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
