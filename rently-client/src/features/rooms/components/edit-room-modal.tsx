"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateRoom, useGetRoomDetail } from "@/features/rooms/useRoom";
import { useGetRentals } from "@/features/rental/useRental";
import { RoomType } from "@/schemas/room.schema";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type EditRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number | null;
};

export function EditRoomModal({
  open,
  onOpenChange,
  roomId,
}: EditRoomModalProps) {
  const [room, setRoom] = useState({
    title: "",
    price: "",
    area: "",
    rentalId: "",
    isAvailable: true,
  });

  const { mutateAsync: updateRoom, isPending: isUpdating } = useUpdateRoom();
  const {
    data: roomData,
    isLoading: isRoomLoading,
    error: roomError,
  } = useGetRoomDetail(roomId || 0);

  const { data: rentalsData, isLoading: isRentalsLoading } = useGetRentals({
    limit: 100,
    page: 1,
  });

  const rentalOptions = rentalsData?.data ?? [];

  useEffect(() => {
    if (roomData && open) {
      setRoom({
        title: roomData.title || "",
        price: roomData.price ? roomData.price.toString() : "",
        area: roomData.area || "",
        rentalId: roomData.rentalId ? roomData.rentalId.toString() : "",
        isAvailable:
          roomData.isAvailable !== undefined ? roomData.isAvailable : true,
      });
    }
  }, [roomData, open]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, type } = e.target;
    const value =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setRoom({
      ...room,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

    // Chuyển đổi các giá trị số
    const payload = {
      title: room.title,
      price: Number(room.price),
      area: Number(room.area),
      rentalId: Number(room.rentalId),
      isAvailable: room.isAvailable,
    };

    try {
      await updateRoom({ roomId, body: payload });
      toast.success("Cập nhật phòng trọ thành công");
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating room:", err);
      toast.error("Có lỗi xảy ra khi cập nhật phòng trọ");
    }
  };

  if (roomError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lỗi</DialogTitle>
            <DialogDescription>
              Không thể tải thông tin phòng trọ. Vui lòng thử lại sau.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phòng trọ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin phòng trọ theo yêu cầu của bạn.
          </DialogDescription>
        </DialogHeader>
        {isRoomLoading ? (
          <div className="py-4 text-center">Đang tải dữ liệu phòng trọ...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Tiêu đề */}
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="title" className="text-sm font-medium">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={room.title}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              {/* Giá */}
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="price" className="text-sm font-medium">
                  Giá (VNĐ)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={room.price}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              {/* Diện tích */}
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="area" className="text-sm font-medium">
                  Diện tích (m²)
                </label>
                <input
                  type="number"
                  id="area"
                  name="area"
                  value={room.area}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              {/* Chọn nhà trọ qua combobox */}
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="rentalId" className="text-sm font-medium">
                  Nhà trọ
                </label>
                <select
                  id="rentalId"
                  name="rentalId"
                  value={room.rentalId}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">
                    {isRentalsLoading ? "Đang tải nhà trọ..." : "Chọn nhà trọ"}
                  </option>
                  {rentalOptions.map((rental: any) => (
                    <option key={rental.id} value={rental.id}>
                      {rental.title || rental.name || `Nhà trọ ${rental.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trạng thái phòng */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={room.isAvailable}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="isAvailable" className="text-sm font-medium">
                  Còn trống
                </label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUpdating}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
