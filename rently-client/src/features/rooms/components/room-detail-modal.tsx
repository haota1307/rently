"use client";

import { Button } from "@/components/ui/button";
import { useGetRoomDetail } from "@/features/rooms/useRoom";
import { formatPrice } from "@/lib/utils";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Tiêu đề:</div>
              <div className="text-sm">{room.title}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Giá thuê:</div>
              <div className="text-sm">{formatPrice(room.price)}/tháng</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Diện tích:</div>
              <div className="text-sm">{room.area} m²</div>
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
