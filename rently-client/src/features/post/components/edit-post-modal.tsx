"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUpdatePost } from "@/features/post/usePost";
import { useGetRooms } from "@/features/rooms/useRoom";
import { toast } from "sonner";
import { RentalPostStatus } from "@/schemas/post.schema";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type EditPostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  post: any;
};

export function EditPostModal({ isOpen, onClose, post }: EditPostModalProps) {
  const [formData, setFormData] = useState({
    title: post?.title || "",
    description: post?.description || "",
    status: post?.status || "",
    deposit: post?.deposit?.toString() || "0",
    roomId: "",
    startDate: "",
    endDate: "",
    pricePaid: "",
  });

  const { mutateAsync: updatePost, isPending } = useUpdatePost();
  const { data: roomsData, isLoading: isRoomsLoading } = useGetRooms({
    limit: 100,
    page: 1,
  });

  const rooms = roomsData?.data || [];

  useEffect(() => {
    if (post && isOpen) {
      const startDate = post.startDate
        ? new Date(post.startDate).toISOString().split("T")[0]
        : "";
      const endDate = post.endDate
        ? new Date(post.endDate).toISOString().split("T")[0]
        : "";

      setFormData({
        title: post.title || "",
        description: post.description || "",
        status: post.status ? post.status.toString() : "",
        deposit: post.deposit ? post.deposit.toString() : "0",
        roomId: post.roomId ? post.roomId.toString() : "",
        startDate,
        endDate,
        pricePaid: post.pricePaid ? post.pricePaid.toString() : "",
      });
    }
  }, [post, isOpen]);

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

    // Xử lý và kiểm tra giá trị tiền cọc
    const depositValue = parseFloat(formData.deposit || "0");
    if (isNaN(depositValue) || depositValue < 0) {
      toast.error("Số tiền đặt cọc không hợp lệ");
      return;
    }

    // Tìm rentalId từ phòng đã chọn
    const selectedRoom = rooms.find(
      (room) => room.id === Number(formData.roomId)
    );

    if (!selectedRoom) {
      toast.error("Không tìm thấy thông tin phòng đã chọn");
      return;
    }

    // Chuyển đổi các giá trị số
    const payload = {
      title: formData.title,
      description: formData.description,
      status: formData.status as RentalPostStatus,
      deposit: depositValue,
      pricePaid: Number(formData.pricePaid),
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      roomId: Number(formData.roomId),
      rentalId: selectedRoom.rentalId,
    };

    try {
      console.log("Payload gửi đi:", payload);
      await updatePost({ postId: post.id, body: payload });
      toast.success("Cập nhật bài đăng thành công");
      onClose();
    } catch (err: any) {
      console.error("Lỗi khi cập nhật bài đăng:", err);
      toast.error(
        `Cập nhật bài đăng thất bại: ${
          err?.payload?.message || "Lỗi không xác định"
        }`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bài đăng</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin bài đăng cho thuê phòng trọ
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
                {rooms.map((room: any) => (
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
                Giá đăng bài <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                pattern="[0-9]*"
                id="pricePaid"
                name="pricePaid"
                value={formData.pricePaid}
                placeholder="Nhập giá đăng bài"
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setFormData({
                    ...formData,
                    pricePaid: value,
                  });
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            {/* Tiền đặt cọc */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="deposit" className="text-sm font-medium">
                Tiền đặt cọc (VNĐ)
              </label>
              <input
                type="number"
                id="deposit"
                name="deposit"
                value={formData.deposit}
                onChange={handleInputChange}
                placeholder="Nhập số tiền đặt cọc (VNĐ)"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                min="0"
                step="1000"
              />
              <p className="text-xs text-muted-foreground">
                Nhập số tiền đặt cọc mà người thuê cần trả trước khi thuê phòng
              </p>
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
              {isPending ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
