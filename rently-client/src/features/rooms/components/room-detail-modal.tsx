"use client";

import { Button } from "@/components/ui/button";
import { useGetRoomDetail } from "@/features/rooms/useRoom";
import { formatPrice } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type RoomDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number | null;
};

export function RoomDetailModal({
  open,
  onOpenChange,
  roomId,
}: RoomDetailModalProps) {
  const { data: room, isLoading, error } = useGetRoomDetail(roomId || 0);

  console.log(room);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết phòng trọ</DialogTitle>
          <DialogDescription>Thông tin chi tiết về phòng trọ</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-4 text-center">Đang tải dữ liệu phòng trọ...</div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">
            Không thể tải thông tin phòng trọ. Vui lòng thử lại sau.
          </div>
        ) : room ? (
          <div className="space-y-4">
            {/* Hình ảnh phòng */}
            {room.roomImages && room.roomImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {room.roomImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-md overflow-hidden"
                  >
                    <Image
                      src={image.imageUrl || "/placeholder.svg"}
                      alt={`Ảnh ${index + 1} của ${room.title}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative aspect-video rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500 text-sm">Không có hình ảnh</p>
              </div>
            )}

            {/* Thông tin phòng */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Tiêu đề:</div>
                <div className="text-sm font-semibold">{room.title}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Giá thuê:</div>
                <div className="text-sm font-semibold text-green-600">
                  {formatPrice(room.price)}/tháng
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Diện tích:</div>
                <div className="text-sm font-semibold">{room.area} m²</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Trạng thái:</div>
                <div className="text-sm">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      room.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {room.isAvailable ? "Còn trống" : "Đã thuê"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Mã nhà trọ:</div>
                <div className="text-sm">{room.rentalId}</div>
              </div>

              {/* Tiện ích phòng */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Tiện ích:</div>
                <div className="flex flex-wrap gap-1.5">
                  {room.roomAmenities && room.roomAmenities.length > 0 ? (
                    room.roomAmenities.map((amenityItem) => (
                      <Badge
                        key={amenityItem.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {amenityItem.amenity.name}
                      </Badge>
                    ))
                  ) : room.amenities && room.amenities.length > 0 ? (
                    room.amenities.map((amenity) => (
                      <Badge
                        key={amenity.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {amenity.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">Không có tiện ích</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Ngày tạo:</div>
                <div className="text-sm">
                  {room.createdAt
                    ? new Date(room.createdAt).toLocaleDateString("vi-VN")
                    : "Không có"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Cập nhật lần cuối:</div>
                <div className="text-sm">
                  {room.updatedAt
                    ? new Date(room.updatedAt).toLocaleDateString("vi-VN")
                    : "Không có"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            Không tìm thấy thông tin phòng trọ
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
