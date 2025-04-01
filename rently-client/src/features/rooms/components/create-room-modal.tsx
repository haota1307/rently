"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateRoom } from "@/features/rooms/useRoom";
import { useGetRentals } from "@/features/rental/useRental";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type CreateRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateRoomModal({ open, onOpenChange }: CreateRoomModalProps) {
  const [newRoom, setNewRoom] = useState({
    title: "",
    price: "",
    area: "",
    rentalId: "",
  });

  const { mutateAsync: createRoom } = useCreateRoom();

  // Lấy danh sách nhà trọ
  const { data: rentalsData, isLoading: isRentalsLoading } = useGetRentals({
    limit: 100,
    page: 1,
  });
  const rentalOptions = rentalsData?.data ?? [];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setNewRoom({
      ...newRoom,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Chuyển đổi các giá trị số
    const payload = {
      title: newRoom.title,
      price: Number(newRoom.price),
      area: Number(newRoom.area),
      rentalId: Number(newRoom.rentalId),
      isAvailable: true,
    };

    try {
      await createRoom(payload);
      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating room:", err);
    }
  };

  const resetForm = () => {
    setNewRoom({ title: "", price: "", area: "", rentalId: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo phòng trọ mới</DialogTitle>
          <DialogDescription>
            Vui lòng điền thông tin phòng trọ theo đúng yêu cầu.
          </DialogDescription>
        </DialogHeader>
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
                value={newRoom.title}
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
                value={newRoom.price}
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
                value={newRoom.area}
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
                value={newRoom.rentalId}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                disabled={isRentalsLoading}
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
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit">Tạo phòng</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
