"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCreatePost } from "@/features/post/usePost";
import { useGetRooms } from "@/features/rooms/useRoom";
import { useGetRentalsById } from "@/features/rental/useRental";
import { toast } from "sonner";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";
import { RentalPostStatus } from "@/schemas/post.schema";
import { Input } from "@/components/ui/input";
import { useAccountMe } from "@/features/profile/useProfile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, InfoIcon } from "lucide-react";
import { Role } from "@/constants/type";
import { addDays, format } from "date-fns";

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
    deposit: "",
  });

  // State để lưu trữ các phòng trọ đã được lọc theo nhà trọ đã chọn
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  // State để lưu thông tin phòng đã chọn
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const accessToken = getAccessTokenFromLocalStorage();
  const userId = accessToken ? decodeAccessToken(accessToken).userId : null;

  const { mutateAsync: createPost, isPending } = useCreatePost();
  const { data: meData } = useAccountMe();
  const userBalance = meData?.payload?.balance || 0;
  const userRole = meData?.payload?.role?.name || "";
  const isAdmin = userRole === Role.Admin;
  const POST_FEE = 10000; // Phí đăng bài 10,000 VNĐ

  // Lấy danh sách nhà trọ của người dùng
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

  // Cập nhật phòng đã chọn khi người dùng chọn phòng
  useEffect(() => {
    if (formData.roomId && filteredRooms.length > 0) {
      const room = filteredRooms.find(
        (room) => room.id === parseInt(formData.roomId)
      );
      setSelectedRoom(room || null);
    } else {
      setSelectedRoom(null);
    }
  }, [formData.roomId, filteredRooms]);

  // Tự động cập nhật ngày kết thúc khi người dùng chọn ngày bắt đầu
  useEffect(() => {
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const endDate = addDays(startDate, 7);

      // Format ngày theo định dạng YYYY-MM-DD cho input type="date"
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      setFormData((prev) => ({
        ...prev,
        endDate: formattedEndDate,
      }));
    }
  }, [formData.startDate]);

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

    if (!selectedRoom) {
      toast.error("Không tìm thấy thông tin phòng đã chọn");
      return;
    }

    if (!formData.title) {
      toast.error("Vui lòng nhập tiêu đề bài đăng");
      return;
    }

    // Kiểm tra số dư tài khoản nếu không phải admin
    if (!isAdmin && userBalance < POST_FEE) {
      toast.error(
        `Số dư tài khoản không đủ để đăng bài. Vui lòng nạp thêm tiền.`
      );
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

    const payload = {
      title: formData.title,
      description: formData.description,
      rentalId: Number(formData.rentalId),
      roomId: Number(formData.roomId),
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      pricePaid: selectedRoom.price, // Sử dụng giá của phòng đã chọn
      deposit: depositValue, // Thêm giá trị tiền cọc
      status: RentalPostStatus.ACTIVE,
    };

    console.log("Sending payload:", payload);

    try {
      await createPost(payload);
      toast.success("Tạo bài đăng thành công");
      onClose();
      // Reset form
      setFormData({
        title: "",
        description: "",
        rentalId: "",
        roomId: "",
        startDate: "",
        endDate: "",
        deposit: "",
      });
      setSelectedRoom(null);
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
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo bài đăng mới</DialogTitle>
          <DialogDescription>
            Tạo bài đăng cho thuê phòng trọ của bạn
          </DialogDescription>
        </DialogHeader>

        <Alert
          className={
            isAdmin
              ? "mt-2 bg-green-50 border-green-200"
              : "mt-2 bg-amber-50 border-amber-200"
          }
        >
          {isAdmin ? (
            <InfoIcon className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          )}
          <AlertTitle className={isAdmin ? "text-green-800" : "text-amber-800"}>
            {isAdmin ? "Miễn phí đăng bài" : "Phí đăng bài"}
          </AlertTitle>
          <AlertDescription
            className={isAdmin ? "text-green-700" : "text-amber-700"}
          >
            {isAdmin ? (
              <span>
                Bạn là admin nên được <strong>miễn phí</strong> khi đăng bài.
              </span>
            ) : (
              <>
                Khi đăng bài, hệ thống sẽ thu phí{" "}
                <strong>{POST_FEE.toLocaleString()} VNĐ</strong> cho thời hạn{" "}
                <strong>7 ngày</strong>. Số dư hiện tại của bạn:{" "}
                <strong>{userBalance.toLocaleString()} VNĐ</strong>.
                {userBalance < POST_FEE && (
                  <div className="mt-2 text-red-600 font-medium">
                    Số dư không đủ, vui lòng nạp thêm tiền để đăng bài.
                  </div>
                )}
              </>
            )}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Tiêu đề - giờ bắt buộc phải gửi đến API */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                Tiêu đề bài đăng <span className="text-red-500">*</span>
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

            {/* Mô tả - giờ sẽ gửi đến API */}
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                Mô tả chi tiết
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Thêm trường tiền đặt cọc */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chọn nhà trọ TRƯỚC */}
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="rentalId" className="text-sm font-medium">
                  Chọn nhà trọ <span className="text-red-500">*</span>
                </label>
                <select
                  id="rentalId"
                  name="rentalId"
                  value={formData.rentalId}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

              {/* Chọn phòng SAU khi đã chọn nhà trọ - bây giờ sẽ gửi đến API */}
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="roomId" className="text-sm font-medium">
                  Chọn phòng trọ <span className="text-red-500">*</span>
                </label>
                <select
                  id="roomId"
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  disabled={!formData.rentalId || filteredRooms.length === 0}
                >
                  <option value="">
                    {!formData.rentalId
                      ? "Vui lòng chọn nhà trọ trước"
                      : isRoomsLoading
                      ? "Đang tải phòng..."
                      : filteredRooms.length === 0
                      ? "Không có phòng trống trong nhà trọ này"
                      : "Chọn phòng trọ"}
                  </option>
                  {filteredRooms.map((room: any) => (
                    <option key={room.id} value={room.id}>
                      {room.title} - {room.area}m² -{" "}
                      {new Intl.NumberFormat("vi-VN").format(room.price)}đ
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ngày bắt đầu */}
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="startDate" className="text-sm font-medium">
                  Ngày bắt đầu <span className="text-red-500">*</span>
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

              {/* Ngày kết thúc (tự động cập nhật sau 7 ngày) */}
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="endDate" className="text-sm font-medium">
                  Ngày kết thúc{" "}
                  <span className="text-text-muted">(Hết hạn sau 7N)</span>
                </label>
                <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm items-center">
                  {formData.endDate
                    ? format(new Date(formData.endDate), "dd/MM/yyyy")
                    : "---"}
                </div>
              </div>
            </div>

            {/* Hiển thị giá phòng đã chọn */}
            {selectedRoom && (
              <div className="p-3 rounded-md bg-blue-50 border border-blue-100">
                <p className="text-sm font-medium text-blue-800">
                  Phòng đã chọn: {selectedRoom.title}
                </p>
                <p className="text-sm text-blue-700">
                  Giá phòng:{" "}
                  <strong>
                    {new Intl.NumberFormat("vi-VN").format(selectedRoom.price)}đ
                  </strong>{" "}
                  (sẽ được dùng làm giá đăng bài)
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="mt-6 flex-col space-y-2 sm:space-y-0 sm:flex-row">
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
