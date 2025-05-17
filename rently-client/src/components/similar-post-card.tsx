"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, createPostSlug } from "@/lib/utils";
import { PostType } from "@/schemas/post.schema";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

interface SimilarPostCardProps {
  post: PostType;
  className?: string;
}

export function SimilarPostCard({ post, className }: SimilarPostCardProps) {
  const room = post.room;
  const rental = post.rental;

  let imageUrl = "/placeholder.svg?height=150&width=200";

  if (room?.roomImages && room.roomImages.length > 0) {
    imageUrl = room.roomImages[0].imageUrl;
  } else if (rental?.rentalImages && rental.rentalImages.length > 0) {
    imageUrl = rental.rentalImages[0].imageUrl;
  }

  // Tạo slug cho bài đăng
  const postSlug = createPostSlug(post.title, post.id);

  return (
    <Link href={`/bai-dang/${postSlug}`} className={className}>
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow group">
        <div className="relative aspect-[4/3]">
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {!room?.isAvailable && (
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="destructive" className="bg-red-600 px-3 py-1">
                Đã cho thuê
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-1">{post.title}</h3>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{rental?.address}</span>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <div className="font-semibold text-primary text-sm">
              {room ? formatPrice(room.price) : "Liên hệ"}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                /tháng
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{room?.area} m²</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
