import { useGeolocation } from "@/hooks/use-geolocation";
import { useGetNearbyPosts } from "@/features/post/usePost";
import { RentalCard } from "@/components/rental-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { formatDistanceValue } from "@/lib/utils";
import { Badge } from "./ui/badge";

export function NearbyPostsSection() {
  const {
    coordinates,
    loading: locationLoading,
    error: locationError,
    getLocation,
  } = useGeolocation();
  const { data, isLoading, error } = useGetNearbyPosts(coordinates);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  if (locationLoading) {
    return (
      <div className="flex flex-col items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Đang lấy vị trí của bạn...</p>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="flex flex-col items-center py-8">
        <p className="text-muted-foreground">Không thể lấy vị trí của bạn</p>
        <Button onClick={getLocation} variant="outline" className="mt-4">
          Thử lại
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">
          Đang tìm bài đăng gần bạn...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8">
        <p className="text-muted-foreground">
          Đã có lỗi xảy ra khi tìm bài đăng
        </p>
        <Button
          onClick={() => getLocation()}
          variant="outline"
          className="mt-4"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  if (!data?.data?.length) {
    return (
      <div className="flex flex-col items-center py-8">
        <p className="text-muted-foreground">Không có bài đăng nào gần bạn</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data.data.map((post) => (
          <RentalCard
            key={post.id}
            listing={{
              id: post.id.toString(),
              title: post.title,
              address: post.address,
              price: Number(post.price),
              area: Number(post.area),
              images: post.images.map((img) => img.url),
              amenities: post.amenities,
              distance: Number(post.distance || 0),
              isAvailable: post.status === "ACTIVE",
            }}
            isNearbyPost={true}
          />
        ))}
      </div>
    </div>
  );
}
