import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Maximize2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
}

interface RentalCardProps {
  listing: Listing;
  viewMode?: "grid" | "list";
}

export function RentalCard({ listing, viewMode = "grid" }: RentalCardProps) {
  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden group listing-card-hover">
        <div className="flex flex-col sm:flex-row">
          <div className="relative sm:w-1/3">
            <Link href={`/phong-tro/${listing.id}`}>
              <div className="aspect-video sm:aspect-square relative overflow-hidden">
                <Image
                  src={listing.images[0] || "/placeholder.svg"}
                  alt={listing.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full"
            >
              <Heart className="h-5 w-5" />
              <span className="sr-only">Lưu tin</span>
            </Button>
            {listing.isNew && (
              <Badge className="absolute top-2 left-2 bg-black text-white">
                Mới
              </Badge>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <Link
                    href={`/phong-tro/${listing.id}`}
                    className="hover:underline"
                  >
                    <h3 className="font-semibold line-clamp-1">
                      {listing.title}
                    </h3>
                  </Link>
                  <div className="flex items-center text-muted-foreground text-sm mt-1">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    <span className="line-clamp-1">{listing.address}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 pb-2 flex-1">
              <div className="flex justify-between items-center">
                <div className="text-lg font-bold text-black dark:text-white">
                  {listing.price.toLocaleString("vi-VN")}đ/tháng
                </div>
                <div className="flex items-center text-sm">
                  <Maximize2 className="h-3.5 w-3.5 mr-1" />
                  {listing.area}m²
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {listing.amenities.map((amenity, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-2 flex justify-between items-center text-sm text-muted-foreground">
              <div>Cách trung tâm {listing.distance}km</div>
              <Link href={`/phong-tro/${listing.id}`}>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  Xem chi tiết
                </Button>
              </Link>
            </CardFooter>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden group listing-card-hover">
      <div className="relative">
        <Link href={`/phong-tro/${listing.id}`}>
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={listing.images[0] || "/placeholder.svg"}
              alt={listing.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        </Link>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full"
        >
          <Heart className="h-5 w-5" />
          <span className="sr-only">Lưu tin</span>
        </Button>
        {listing.isNew && (
          <Badge className="absolute top-2 left-2 bg-black text-white">
            Mới
          </Badge>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/phong-tro/${listing.id}`} className="hover:underline">
              <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
            </Link>
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span className="line-clamp-1">{listing.address}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 pb-2">
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold text-black dark:text-white">
            {listing.price.toLocaleString("vi-VN")}đ/tháng
          </div>
          <div className="flex items-center text-sm">
            <Maximize2 className="h-3.5 w-3.5 mr-1" />
            {listing.area}m²
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
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
      </CardContent>

      <CardFooter className="p-4 pt-2 flex justify-between items-center text-sm text-muted-foreground">
        <div>Cách trung tâm {listing.distance}km</div>
        <Link href={`/phong-tro/${listing.id}`}>
          <Button variant="link" size="sm" className="p-0 h-auto">
            Xem chi tiết
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
