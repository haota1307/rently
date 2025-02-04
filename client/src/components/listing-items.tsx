"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CameraIcon } from "lucide-react";
import Image from "next/image";

interface ListingItemProps {
  image: string; // URL hình ảnh nhà trọ
  title: string; // Tên nhà trọ
  address: string; // Địa chỉ
  price: string; // Giá thuê
  area: string; // Diện tích
  amenities: string[]; // Tiện ích
  landlord: {
    name: string; // Tên người cho thuê
    phone: string; // Số điện thoại
    avatar: string; // Hình đại diện
  };
}

const ListingItem = ({
  image,
  title,
  address,
  price,
  area,
  amenities,
  landlord,
}: ListingItemProps) => {
  return (
    <div className="flex flex-col md:flex-row border-[1.5px] rounded-lg shadow-sm overflow-hidden w-full">
      {/* Hình ảnh */}
      <div className="relative w-full md:w-1/3 h-48 md:h-auto">
        <Image src={image} alt={title} fill className="object-cover" priority />
        <div className="absolute bottom-2 right-2 bg-white opacity-70 px-2 py-1 text-xs font-semibold rounded-lg shadow-sm">
          <div className="flex items-center justify-center gap-1">
            <CameraIcon className="size-4 text-muted-foreground" />
            <p className="text-muted-foreground">5 hình ảnh</p>
          </div>
        </div>
      </div>

      {/* Nội dung */}
      <div className="flex-1 p-4 space-y-2">
        <h3 className="text-lg font-semibold truncate">{title}</h3>

        <div className="block items-center gap-2 md:flex">
          <p className="text-primary font-bold">{price}</p>
          <p className="text-muted-foreground hidden md:block">·</p>
          <p className="text-sm ">{area}</p>
          <p className="text-muted-foreground hidden md:block">·</p>
          <p className="text-sm text-muted-foreground truncate">{address}</p>
        </div>

        {/* Tiện ích */}
        <div className="flex items-center gap-2 flex-wrap">
          {amenities.map((amenity, index) => (
            <span
              key={index}
              className="text-xs bg-gray-200 rounded-full px-2 py-1"
            >
              {amenity}
            </span>
          ))}
        </div>

        {/* Thông tin người cho thuê */}
        <div className="flex items-center gap-3 my-4">
          <Avatar>
            <AvatarImage src={landlord.avatar} />
            <AvatarFallback>
              {landlord.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{landlord.name}</p>
            <p className="text-xs text-muted-foreground">{landlord.phone}</p>
          </div>
        </div>

        {/* Nút hành động */}
        <Button className="mt-2 w-full md:w-auto">Xem chi tiết</Button>
      </div>
    </div>
  );
};

export default ListingItem;
