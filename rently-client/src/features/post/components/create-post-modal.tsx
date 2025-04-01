"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCreatePost } from "@/features/post/usePost";
import { useGetRooms } from "@/features/rooms/useRoom";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type CreatePostModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    roomId: "",
    startDate: "",
    endDate: "",
    pricePaid: "",
  });

  const { mutateAsync: createPost, isPending } = useCreatePost();
  const { data: roomsData, isLoading: isRoomsLoading } = useGetRooms({
    limit: 100,
    page: 1,
    status: "available", // Chỉ lấy phòng còn trống
  });

  const availableRooms = roomsData?.data || [];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roomId) {
      toast.error("Vui lòng chọn phòng để đăng bài");
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }

    // Chuyển đổi các giá trị số
    const payload = {
      title: formData.title,
      description: formData.description,
      roomId: Number(formData.roomId),
      startDate: formData.startDate,
      endDate: formData.endDate,
      pricePaid: Number(formData.pricePaid),
    };

    try {
      await createPost(payload);
      toast.success("Tạo bài đăng thành công");
      onClose();
      // Reset form
      setFormData({
        title: "",
        description: "",
        roomId: "",
        startDate: "",
        endDate: "",
        pricePaid: "",
      });
    } catch (err: any) {
      toast.error(
        `Tạo bài đăng thất bại: ${
          err?.payload?.message || "Lỗi không xác định"
        }`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo bài đăng mới</DialogTitle>
          <DialogDescription>
            Tạo bài đăng cho thuê phòng trọ của bạn
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Tiêu đề */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                Tiêu đề bài đăng
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            {/* Mô tả */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                Mô tả chi tiết
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            {/* Chọn phòng */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="roomId" className="text-sm font-medium">
                Chọn phòng
              </label>
              <select
                id="roomId"
                name="roomId"
                value={formData.roomId}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">
                  {isRoomsLoading ? "Đang tải phòng..." : "Chọn phòng trọ"}
                </option>
                {availableRooms.map((room: any) => (
                  <option key={room.id} value={room.id}>
                    {room.title} - {room.area}m² -{" "}
                    {new Intl.NumberFormat("vi-VN").format(room.price)}đ
                  </option>
                ))}
              </select>
            </div>

            {/* Ngày bắt đầu */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="startDate" className="text-sm font-medium">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            {/* Ngày kết thúc */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="endDate" className="text-sm font-medium">
                Ngày kết thúc
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            {/* Giá đăng bài */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="pricePaid" className="text-sm font-medium">
                Giá đăng bài (VNĐ)
              </label>
              <input
                type="number"
                id="pricePaid"
                name="pricePaid"
                value={formData.pricePaid}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang tạo..." : "Tạo bài đăng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
