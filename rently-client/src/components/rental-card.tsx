"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Navigation } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RentalType } from "@/schemas/rental.schema";
import { FavoriteButton } from "@/features/favorite/components/favorite-button";
import { ComparisonButton } from "@/components/ui/comparison-button";

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
  isAvailable?: boolean;
}

export interface RentalCardProps {
  listing?: Listing;
  rental?: RentalType;
  viewMode?: "grid" | "list";
  onContactClick?: () => void;
}

export const RentalCard = ({
  listing,
  rental,
  viewMode = "grid",
  onContactClick = () => {},
}: RentalCardProps) => {
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
        amenities:
          rental.rooms && rental.rooms.length > 0 && rental.rooms[0].amenities
            ? rental.rooms[0].amenities.map((amenity) => amenity.name)
            : [],
        distance: rental.distance || 0,
        isNew: false,
        isRental: true,
        isAvailable:
          rental.rooms && rental.rooms.length > 0
            ? rental.rooms[0].isAvailable
            : true,
      }
    : listing;

  if (!processedListing) {
    return null;
  }

  // Card theo dạng lưới (grid)
  if (viewMode === "grid") {
    return (
      <Card
        className={cn(
          "overflow-hidden group hover:shadow-lg transition-shadow",
          processedListing.isAvailable === false &&
            "opacity-75 grayscale-[40%] bg-gray-100"
        )}
      >
        <Link href={`/bai-dang/${processedListing.id}`}>
          <CardHeader className="p-0">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                alt={processedListing.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={
                  processedListing.images && processedListing.images.length > 0
                    ? processedListing.images[0]
                    : "/placeholder.svg?height=200&width=300"
                }
                priority={true}
              />
              {processedListing.isNew && (
                <Badge
                  className="absolute top-2 left-2 z-10"
                  variant="destructive"
                >
                  Mới
                </Badge>
              )}
              {processedListing.isAvailable === false && (
                <div className="absolute top-1/2 left-0 right-0 text-center z-20 transform -rotate-6">
                  <Badge
                    className="text-white bg-red-600 px-6 py-2 text-lg font-bold shadow-xl"
                    variant="destructive"
                  >
                    Đã cho thuê
                  </Badge>
                </div>
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
              <FavoriteButton
                rentalId={Number(processedListing.id)}
                variant="outline"
                size="sm"
                className="text-xs px-2"
              />

              <div className="flex gap-1">
                {rental && (
                  <ComparisonButton
                    rental={rental}
                    variant="outline"
                    size="sm"
                    className="text-xs px-2"
                    showText={true}
                  />
                )}
                <Button size="sm" asChild className="text-xs px-2">
                  <Link href={`/bai-dang/${processedListing.id}`}>
                    Xem chi tiết
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Card theo dạng danh sách (list)
  return (
    <Card
      className={cn(
        "overflow-hidden group hover:shadow-lg transition-shadow",
        processedListing.isAvailable === false &&
          "opacity-75 grayscale-[40%] bg-gray-100"
      )}
    >
      <div className="flex flex-col sm:flex-row">
        <Link
          href={`/bai-dang/${processedListing.id}`}
          className="sm:w-[220px] sm:min-w-[220px]"
        >
          <div className="relative aspect-[4/3] sm:aspect-[4/3] w-full overflow-hidden h-full">
            <Image
              alt={processedListing.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              fill
              sizes="(max-width: 768px) 100vw, 220px"
              src={
                processedListing.images && processedListing.images.length > 0
                  ? processedListing.images[0]
                  : "/placeholder.svg?height=200&width=300"
              }
              priority={true}
            />
            {processedListing.isNew && (
              <Badge
                className="absolute top-2 left-2 z-10"
                variant="destructive"
              >
                Mới
              </Badge>
            )}
            {processedListing.isAvailable === false && (
              <div className="absolute top-1/2 left-0 right-0 text-center z-20 transform -rotate-6">
                <Badge
                  className="text-white bg-red-600 px-6 py-2 text-lg font-bold shadow-xl"
                  variant="destructive"
                >
                  Đã cho thuê
                </Badge>
              </div>
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
              <FavoriteButton
                rentalId={Number(processedListing.id)}
                variant="outline"
                size="sm"
              />

              <div className="flex gap-1">
                {rental && (
                  <ComparisonButton
                    rental={rental}
                    variant="outline"
                    size="sm"
                    showText={true}
                  />
                )}
                <Button size="sm" asChild>
                  <Link href={`/bai-dang/${processedListing.id}`}>
                    Xem chi tiết
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
