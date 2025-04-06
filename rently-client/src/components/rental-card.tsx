import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Maximize2, Home, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

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
  listing: Listing;
  viewMode?: "grid" | "list";
  onContactClick?: () => void;
}

export const RentalCard = ({
  listing,
  viewMode = "grid",
  onContactClick = () => {},
}: RentalCardProps) => {
  // Xử lý trường hợp card là một phòng thuộc nhà trọ
  const isRoom = !!listing.rentalId && listing.id !== listing.rentalId;

  // Card theo dạng lưới (grid)
  if (viewMode === "grid") {
    return (
      <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
        <Link href={`/bai-dang/${listing.id}`}>
          <CardHeader className="p-0">
            <div className="relative aspect-[4/3] w-full">
              <Image
                alt={listing.title}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                fill
                src={
                  listing.images[0] || "/placeholder.svg?height=200&width=300"
                }
              />
              {listing.isNew && (
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
                  href={`/bai-dang/${listing.id}`}
                  className="hover:underline"
                >
                  <h3 className="font-semibold text-ellipsis line-clamp-1">
                    {listing.title}
                  </h3>
                </Link>
                {isRoom && (
                  <Link
                    href={`/bai-dang/${listing.rentalId}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Thuộc: {listing.rentalTitle}
                  </Link>
                )}
              </div>
              <div className="flex flex-col items-end">
                <p className="font-semibold text-blue-600">
                  {formatPrice(listing.price)}/tháng
                </p>
                <p className="text-xs text-muted-foreground">
                  {listing.area} m²
                </p>
              </div>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              <span className="truncate">{listing.address}</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {listing.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {listing.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{listing.amenities.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center">
              <Button
                size="sm"
                variant="outline"
                onClick={onContactClick}
                className="text-xs px-2"
              >
                <Phone className="h-3 w-3 mr-1" />
                Liên hệ
              </Button>
              <Button size="sm" asChild className="text-xs px-2">
                <Link href={`/bai-dang/${listing.id}`}>Xem chi tiết</Link>
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
        <Link href={`/bai-dang/${listing.id}`} className="sm:w-[200px]">
          <div className="relative aspect-[4/3] sm:aspect-square w-full">
            <Image
              alt={listing.title}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              fill
              src={listing.images[0] || "/placeholder.svg?height=200&width=300"}
            />
            {listing.isNew && (
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
                  href={`/bai-dang/${listing.id}`}
                  className="hover:underline"
                >
                  <h3 className="font-semibold">{listing.title}</h3>
                </Link>
                {isRoom && (
                  <Link
                    href={`/bai-dang/${listing.rentalId}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Thuộc: {listing.rentalTitle}
                  </Link>
                )}
              </div>
              <div className="flex flex-col items-end ml-2">
                <p className="font-semibold text-blue-600">
                  {formatPrice(listing.price)}/tháng
                </p>
                <p className="text-xs text-muted-foreground">
                  {listing.area} m²
                </p>
              </div>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              <span className="truncate">{listing.address}</span>
            </div>

            <div className="flex flex-wrap gap-1 flex-1">
              {listing.amenities.slice(0, 5).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {listing.amenities.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{listing.amenities.length - 5}
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center mt-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={onContactClick}
                className="text-xs px-2"
              >
                <Phone className="h-3 w-3 mr-1" />
                Liên hệ
              </Button>
              <Button size="sm" asChild className="text-xs px-2">
                <Link href={`/bai-dang/${listing.id}`}>Xem chi tiết</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
