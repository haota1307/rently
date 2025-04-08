"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MapPin,
  Maximize2,
  Home,
  Phone,
  Navigation,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { cn, formatPrice } from "@/lib/utils";
import { RentalType } from "@/schemas/rental.schema";
import { FavoriteButton } from "@/features/favorite/components/favorite-button";

interface Listing {
  id: string;
  title: string;
  address: string;
  price: number;
  area: number;
  images: string[];
  amenities: string[];
  distance: number;
  isNew?: boolean;
  isRental?: boolean;
  rentalId?: string;
  rentalTitle?: string;
}

export interface RentalCardProps {
  listing?: Listing;
  rental?: RentalType;
  viewMode?: "grid" | "list";
  onContactClick?: () => void;
  showFavoriteButton?: boolean;
}

export const RentalCard = ({
  listing,
  rental,
  viewMode = "grid",
  onContactClick = () => {},
  showFavoriteButton = false,
}: RentalCardProps) => {
  // Nếu có rental (từ API), chuyển đổi sang định dạng listing
  const processedListing = rental
    ? {
        id: rental.id.toString(),
        title: rental.title,
        address: rental.address,
        price:
          rental.rooms && rental.rooms.length > 0 ? rental.rooms[0].price : 0,
        area:
          rental.rooms && rental.rooms.length > 0 ? rental.rooms[0].area : 0,
        images: rental.rentalImages
          ? rental.rentalImages.map((img) => img.imageUrl)
          : [],
        amenities: [], // Dữ liệu amenities sẽ được thêm sau
        distance: rental.distance || 0,
        isNew: false, // Có thể tính dựa trên createdAt
        isRental: true,
      }
    : listing;

  if (!processedListing) {
    return null;
  }

  // Xử lý trường hợp card là một phòng thuộc nhà trọ
  const isRoom =
    !!processedListing.rentalId &&
    processedListing.id !== processedListing.rentalId;

  // Card theo dạng lưới (grid)
  if (viewMode === "grid") {
    return (
      <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
        <Link href={`/bai-dang/${processedListing.id}`}>
          <CardHeader className="p-0">
            <div className="relative aspect-[4/3] w-full">
              <Image
                alt={processedListing.title}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                fill
                src={
                  processedListing.images && processedListing.images.length > 0
                    ? processedListing.images[0]
                    : "/placeholder.svg?height=200&width=300"
                }
              />
              {processedListing.isNew && (
                <Badge
                  className="absolute top-2 left-2 z-10"
                  variant="destructive"
                >
                  Mới
                </Badge>
              )}
              {isRoom && (
                <Badge
                  className="absolute top-2 right-2 z-10"
                  variant="outline"
                >
                  Phòng trọ
                </Badge>
              )}
            </div>
          </CardHeader>
        </Link>

        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <Link
                  href={`/bai-dang/${processedListing.id}`}
                  className="hover:underline"
                >
                  <h3 className="font-semibold text-ellipsis line-clamp-1">
                    {processedListing.title}
                  </h3>
                </Link>
                {isRoom && (
                  <Link
                    href={`/bai-dang/${processedListing.rentalId}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Thuộc: {processedListing.rentalTitle}
                  </Link>
                )}
              </div>
              <div className="flex flex-col items-end">
                <p className="font-semibold text-blue-600">
                  {formatPrice(processedListing.price)}/tháng
                </p>
                <p className="text-xs text-muted-foreground">
                  {processedListing.area} m²
                </p>
              </div>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              <span className="truncate">{processedListing.address}</span>
            </div>

            {processedListing.distance > 0 && (
              <div className="flex items-center text-sm">
                <Navigation className="mr-1 h-4 w-4 text-blue-500" />
                <span className="font-medium text-blue-600">
                  {processedListing.distance < 1
                    ? `${(processedListing.distance * 1000).toFixed(0)} m`
                    : `${processedListing.distance.toFixed(1)} km`}
                </span>
                <span className="ml-1 text-muted-foreground">
                  Từ Đại học Nam Cần Thơ
                </span>
              </div>
            )}

            {processedListing.amenities &&
              processedListing.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {processedListing.amenities
                    .slice(0, 3)
                    .map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  {processedListing.amenities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{processedListing.amenities.length - 3}
                    </Badge>
                  )}
                </div>
              )}

            <div className="flex justify-between items-center">
              {showFavoriteButton && rental ? (
                <FavoriteButton
                  rentalId={rental.id}
                  variant="outline"
                  size="sm"
                  className="text-xs px-2"
                />
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onContactClick}
                  className="text-xs px-2"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Liên hệ
                </Button>
              )}

              <Button size="sm" asChild className="text-xs px-2">
                <Link href={`/bai-dang/${processedListing.id}`}>
                  Xem chi tiết
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Card theo dạng danh sách (list)
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row">
        <Link
          href={`/bai-dang/${processedListing.id}`}
          className="sm:w-[200px]"
        >
          <div className="relative aspect-[4/3] sm:aspect-square w-full">
            <Image
              alt={processedListing.title}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              fill
              src={
                processedListing.images && processedListing.images.length > 0
                  ? processedListing.images[0]
                  : "/placeholder.svg?height=200&width=300"
              }
            />
            {processedListing.isNew && (
              <Badge
                className="absolute top-2 left-2 z-10"
                variant="destructive"
              >
                Mới
              </Badge>
            )}
            {isRoom && (
              <Badge className="absolute top-2 right-2 z-10" variant="outline">
                Phòng trọ
              </Badge>
            )}
          </div>
        </Link>

        <CardContent className="p-4 flex-1">
          <div className="space-y-3 h-full flex flex-col">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <Link
                  href={`/bai-dang/${processedListing.id}`}
                  className="hover:underline"
                >
                  <h3 className="font-semibold">{processedListing.title}</h3>
                </Link>
                {isRoom && (
                  <Link
                    href={`/bai-dang/${processedListing.rentalId}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Thuộc: {processedListing.rentalTitle}
                  </Link>
                )}
              </div>
              <div className="flex flex-col items-end ml-2">
                <p className="font-semibold text-blue-600">
                  {formatPrice(processedListing.price)}/tháng
                </p>
                <p className="text-xs text-muted-foreground">
                  {processedListing.area} m²
                </p>
              </div>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              <span className="truncate">{processedListing.address}</span>
            </div>

            {processedListing.distance > 0 && (
              <div className="flex items-center text-sm">
                <Navigation className="mr-1 h-4 w-4 text-blue-500" />
                <span className="font-medium text-blue-600">
                  {processedListing.distance < 1
                    ? `${(processedListing.distance * 1000).toFixed(0)} m`
                    : `${processedListing.distance.toFixed(1)} km`}
                </span>
                <span className="ml-1 text-muted-foreground">từ trung tâm</span>
              </div>
            )}

            {processedListing.amenities &&
              processedListing.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 flex-1">
                  {processedListing.amenities
                    .slice(0, 5)
                    .map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  {processedListing.amenities.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{processedListing.amenities.length - 5}
                    </Badge>
                  )}
                </div>
              )}

            <div className="flex justify-between items-center mt-auto">
              {showFavoriteButton && rental ? (
                <FavoriteButton
                  rentalId={rental.id}
                  variant="outline"
                  size="sm"
                />
              ) : (
                <Button size="sm" variant="outline" onClick={onContactClick}>
                  <Phone className="h-4 w-4 mr-1" />
                  Liên hệ
                </Button>
              )}

              <Button size="sm" asChild>
                <Link href={`/bai-dang/${processedListing.id}`}>
                  Xem chi tiết
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
