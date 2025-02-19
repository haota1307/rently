"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  CalendarClockIcon,
  CameraIcon,
  HouseIcon,
  MapPinnedIcon,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ListingItemProps {
  id: number;
  image: string;
  title: string;
  address: string;
  price: string;
  area: string;
  amenities: string[];
  landlord: {
    name: string;
    phone: string;
    avatar: string;
  };
}

const ListingItem = ({
  id,
  image,
  title,
  address,
  price,
  area,
  amenities,
  landlord,
}: ListingItemProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-col mx-12 overflow-hidden border rounded-lg bg-white text-gray-900 md:flex-row">
      {/* Ảnh bên trái */}
      <div className="relative h-48 w-full flex-none md:h-auto md:w-1/4">
        <Image src={image} alt={title} fill className="object-cover" priority />
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-xs font-semibold text-gray-600 shadow">
          <CameraIcon className="h-4 w-4" />
          <p>5 hình ảnh</p>
        </div>
      </div>

      {/* Nội dung bên phải */}
      <div className="flex flex-1 flex-col gap-2 p-4 md:p-6">
        {/* Badge danh mục (ví dụ: "Phòng trọ") */}
        <div className="inline-block w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
          Phòng trọ
        </div>

        {/* Tiêu đề + Ngày đăng (hoặc "Hôm nay") */}
        <div className="flex items-start justify-between">
          <h3 className="mr-4 text-lg tracking-wide leading-snug  font-semibold md:text-xl">
            {title}
          </h3>
          {/* Chỗ hiển thị ngày hoặc thời gian */}
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <CalendarClockIcon className="size-4" />
            <p className="">Hôm nay</p>
          </div>
        </div>

        {/* Mô tả ngắn (tuỳ ý) */}
        <p className="text-sm text-gray-600">
          Đây là mô tả ngắn về phòng trọ hoặc giới thiệu sơ lược...
        </p>

        {/* Thông tin giá & diện tích */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span className="font-semibold text-rose-500 flex items-center gap-1">
            <Wallet className="size-4" />
            {price}
          </span>
          <span className="text-gray-300">·</span>
          <span className="truncate flex items-center justify-center gap-1 ">
            <HouseIcon className="size-4" />
            {area}
          </span>
          <span className="text-gray-300">·</span>
          <span className="truncate flex items-center justify-center gap-1 ">
            <MapPinnedIcon className="size-4" />
            {address}
          </span>
        </div>

        {/* Tiện ích */}
        <div className="flex flex-wrap gap-2 pt-2">
          {amenities.map((amenity, index) => (
            <span
              key={index}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
            >
              {amenity}
            </span>
          ))}
        </div>

        {/* Thông tin chủ nhà & nút hành động */}
        <div className="mt-auto flex items-center gap-3 pt-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={landlord.avatar} />
            <AvatarFallback>
              {landlord.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{landlord.name}</p>
            <p className="text-xs text-gray-400">{landlord.phone}</p>
          </div>

          <div className="ml-auto">
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => router.push(`/listings/${id}`)}
            >
              Xem chi tiết
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingItem;
