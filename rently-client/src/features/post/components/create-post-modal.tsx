"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCreatePost } from "@/features/post/usePost";
import { useGetRooms } from "@/features/rooms/useRoom";
import { useGetRentalsById } from "@/features/rental/useRental";
import { toast } from "sonner";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";

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
    rentalId: "",
    roomId: "",
    startDate: "",
    endDate: "",
    pricePaid: "",
  });

  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);

  const accessToken = getAccessTokenFromLocalStorage();
  const userId = accessToken ? decodeAccessToken(accessToken).userId : null;

  const { mutateAsync: createPost, isPending } = useCreatePost();

  const { data: rentalsData, isLoading: isRentalsLoading } = useGetRentalsById(
    userId!,
    {
      page: 1,
      limit: 100,
    }
  );

  const { data: roomsData, isLoading: isRoomsLoading } = useGetRooms({
    limit: 100,
    page: 1,
    status: "available",
  });

  const rentalOptions = rentalsData?.data || [];
  const allRooms = roomsData?.data || [];

  useEffect(() => {
    if (formData.rentalId && allRooms.length > 0) {
      const availableRooms = allRooms.filter(
        (room) =>
          room.rentalId === parseInt(formData.rentalId) && room.isAvailable
      );
      setFilteredRooms(availableRooms);
    } else {
      setFilteredRooms([]);
    }
  }, [formData.rentalId, allRooms]);

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

    if (name === "rentalId") {
      setFormData((prev) => ({
        ...prev,
        roomId: "",
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rentalId) {
      toast.error("Vui lòng chọn nhà trọ");
      return;
    }

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

    const payload = {
      rentalId: Number(formData.rentalId),
      startDate: formData.startDate,
      endDate: formData.endDate,
      pricePaid: Number(formData.pricePaid),
    };

    try {
      await createPost(payload);
      toast.success("Tạo bài đăng thành công");
      onClose();
      setFormData({
        title: "",
        description: "",
        rentalId: "",
        roomId: "",
        startDate: "",
        endDate: "",
        pricePaid: "",
      });
    } catch (err: any) {
      console.error("Error creating post:", err);
      toast.error(
        `Tạo bài đăng thất bại: ${
          err?.payload?.message || "Lỗi không xác định"
        }`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl">Tạo bài đăng mới</DialogTitle>
          <DialogDescription className="text-sm">
            Tạo bài đăng cho thuê phòng trọ của bạn
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="space-y-4">
            {/* Tiêu đề */}
            <div className="grid w-full gap-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                Tiêu đề bài đăng
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary"
                required
              />
              <p className="text-xs text-muted-foreground">
                Tiêu đề bài đăng sẽ được tạo tự động từ thông tin phòng trọ
              </p>
            </div>

            {/* Mô tả */}
            <div className="grid w-full gap-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                Mô tả chi tiết
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary"
                required
              />
              <p className="text-xs text-muted-foreground">
                Mô tả bài đăng sẽ được tạo tự động từ thông tin phòng trọ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chọn nhà trọ */}
              <div className="grid w-full gap-1.5">
                <label htmlFor="rentalId" className="text-sm font-medium">
                  Chọn nhà trọ <span className="text-red-500">*</span>
                </label>
                <select
                  id="rentalId"
                  name="rentalId"
                  value={formData.rentalId}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary"
                  required
                >
                  <option value="">
                    {isRentalsLoading ? "Đang tải nhà trọ..." : "Chọn nhà trọ"}
                  </option>
                  {rentalOptions.map((rental: any) => (
                    <option key={rental.id} value={rental.id}>
                      {rental.title || `Nhà trọ ${rental.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn phòng */}
              <div className="grid w-full gap-1.5">
                <label htmlFor="roomId" className="text-sm font-medium">
                  Chọn phòng trọ <span className="text-red-500">*</span>
                </label>
                <select
                  id="roomId"
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary"
                  required
                  disabled={!formData.rentalId || filteredRooms.length === 0}
                >
                  <option value="">
                    {!formData.rentalId
                      ? "Vui lòng chọn nhà trọ trước"
                      : isRoomsLoading
                      ? "Đang tải phòng..."
                      : filteredRooms.length === 0
                      ? "Không có phòng trống"
                      : "Chọn phòng trọ"}
                  </option>
                  {filteredRooms.map((room: any) => (
                    <option key={room.id} value={room.id}>
                      {room.title} - {room.area}m² -{" "}
                      {new Intl.NumberFormat("vi-VN").format(room.price)}đ
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Chọn phòng trọ để hiển thị thông tin
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ngày bắt đầu */}
              <div className="grid w-full gap-1.5">
                <label htmlFor="startDate" className="text-sm font-medium">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary"
                  required
                />
              </div>

              {/* Ngày kết thúc */}
              <div className="grid w-full gap-1.5">
                <label htmlFor="endDate" className="text-sm font-medium">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Giá đăng bài */}
            <div className="grid w-full gap-1.5">
              <label htmlFor="pricePaid" className="text-sm font-medium">
                Giá đăng bài (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="pricePaid"
                name="pricePaid"
                value={formData.pricePaid}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary"
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-6 flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? "Đang tạo..." : "Tạo bài đăng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
