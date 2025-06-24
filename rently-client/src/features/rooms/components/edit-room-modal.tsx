"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateRoom, useGetRoomDetail } from "@/features/rooms/useRoom";
import { useGetRentals } from "@/features/rental/useRental";
import { RoomType, UpdateRoomBodyType } from "@/schemas/room.schema";
import { toast } from "sonner";
import { AmenitySelector } from "@/features/dashboard/components/amenity-selector";
import { AmenityType } from "@/schemas/amenity.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUploadImages } from "@/features/media/useMedia";
import { ImageSlot } from "@/types/images.type";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploadSlots } from "@/features/rental/component/image-upload-slots";

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
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityType[]>([]);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [hasActiveContract, setHasActiveContract] = useState<boolean>(false);
  const { mutateAsync: updateRoom, isPending: isUpdating } = useUpdateRoom();
  const { mutateAsync: imageUpload, isPending: imageUploading } =
    useUploadImages();

  const form = useForm<UpdateRoomBodyType>({
    defaultValues: {
      title: "",
      price: 0,
      area: 0,
      rentalId: 0,
      isAvailable: true,
      amenityIds: [],
      roomImages: [],
    },
  });

  const {
    data: roomData,
    isLoading: isRoomLoading,
    error: roomError,
  } = useGetRoomDetail(roomId || 0);

  const { data: rentalsData, isLoading: isRentalsLoading } = useGetRentals({
    limit: 10,
    page: 1,
  });

  const rentalOptions = rentalsData?.data ?? [];

  // Khi dữ liệu phòng được tải, cập nhật form và danh sách tiện ích đã chọn
  useEffect(() => {
    if (roomData && open && !isRentalsLoading) {
      // Chỉ set form khi rentalOptions đã load xong để đảm bảo Select component có data
      const currentRental = rentalOptions.find(
        (rental) => rental.id === roomData.rentalId
      );

      if (!currentRental && rentalOptions.length > 0) {
        console.warn(
          `Rental ID ${roomData.rentalId} not found in available rentals. This room might belong to a different landlord.`
        );
      }

      // Kiểm tra xem phòng có đang được thuê không
      const isRented = roomData.isAvailable === false;

      // Nếu phòng đang được thuê, kiểm tra xem có hợp đồng đang hoạt động không
      if (isRented) {
        // Giả định rằng nếu phòng không available thì có hợp đồng đang hoạt động
        // Trong thực tế, chúng ta có thể gọi API để kiểm tra chính xác
        setHasActiveContract(true);
      } else {
        setHasActiveContract(false);
      }

      // Sử dụng setTimeout để đảm bảo Select component đã được render với options
      setTimeout(() => {
        form.reset({
          title: roomData.title || "",
          price: roomData.price || 0,
          area: roomData.area || 0,
          rentalId: roomData.rentalId,
          isAvailable:
            roomData.isAvailable !== undefined ? roomData.isAvailable : true,
        });
      }, 50);

      setSelectedAmenities(
        roomData.roomAmenities
          ? roomData.roomAmenities.map((ra) => ra.amenity)
          : []
      );

      // Nếu phòng có hình ảnh, cập nhật các slot hình ảnh
      if (roomData.roomImages && roomData.roomImages.length > 0) {
        const newImageSlots: ImageSlot[] = [null, null, null, null, null];
        roomData.roomImages.forEach((image, index) => {
          if (index < 5) {
            newImageSlots[index] = {
              file: null,
              previewUrl: image.imageUrl,
              order: image.order || index + 1,
            };
          }
        });
        setImageSlots(newImageSlots);
      } else {
        setImageSlots([null, null, null, null, null]);
      }
    }
  }, [roomData, open, form, rentalOptions, isRentalsLoading]);

  const handleSubmit = async (values: UpdateRoomBodyType) => {
    console.log(values);
    if (!roomId) return;

    // Kiểm tra nếu phòng đang có hợp đồng và đang cố gắng thay đổi trạng thái
    if (hasActiveContract && !roomData?.isAvailable && values.isAvailable) {
      toast.error(
        "Không thể thay đổi trạng thái phòng vì đang có hợp đồng thuê còn hiệu lực"
      );
      return;
    }

    try {
      // Thêm danh sách ID tiện ích
      const amenityIds = selectedAmenities.map((amenity) => amenity.id);

      // Xử lý upload ảnh
      const validSlots = imageSlots.filter(
        (slot): slot is { file: File; previewUrl: string; order: number } =>
          slot !== null
      );

      let roomImages = roomData?.roomImages || [];

      // Nếu có ảnh mới được tải lên (có file)
      const newImageSlots = validSlots.filter((slot) => slot.file !== null);
      if (newImageSlots.length > 0) {
        if (imageUploading || isUpdating) return;
        try {
          const formData = new FormData();
          newImageSlots.forEach((slot) => {
            formData.append("images", slot.file);
          });

          const uploadResponse = await imageUpload(formData);
          const newUploadedImages = uploadResponse.payload;

          // Kết hợp ảnh cũ (không có file) và ảnh mới
          const existingImages = validSlots
            .filter((slot) => slot.file === null)
            .map((slot, index) => ({
              imageUrl: slot.previewUrl || "",
              order: slot.order,
            }));

          roomImages = [
            ...existingImages,
            ...newUploadedImages.map((img, index) => ({
              imageUrl: img.url,
              order: newImageSlots[index].order,
            })),
          ];
        } catch (error) {
          console.error("Lỗi upload ảnh:", error);
          toast.error("Không thể tải lên hình ảnh, vui lòng thử lại");
          return;
        }
      } else {
        // Chỉ có ảnh cũ hoặc không có ảnh
        roomImages = validSlots.map((slot) => ({
          imageUrl: slot.previewUrl || "",
          order: slot.order,
        }));
      }

      // Tạo payload
      const payload = {
        ...values,
        amenityIds,
        roomImages,
      };

      await updateRoom({ roomId, body: payload });
      toast.success("Cập nhật phòng trọ thành công");
      onOpenChange(false);
    } catch (error: any) {
      if (error.response?.data?.message) {
        if (typeof error.response.data.message === "string") {
          toast.error(error.response.data.message);
        } else if (Array.isArray(error.response.data.message)) {
          error.response.data.message.forEach((err: any) => {
            toast.error(`Lỗi: ${err.message}`);
          });
        }
      } else {
        toast.error("Cập nhật phòng trọ thất bại");
      }
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
      <DialogContent className="sm:max-w-[550px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phòng trọ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin phòng trọ theo yêu cầu của bạn.
          </DialogDescription>
        </DialogHeader>
        {isRoomLoading ? (
          <div className="py-4 text-center">Đang tải dữ liệu phòng trọ...</div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tiêu đề */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiêu đề</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập tiêu đề phòng trọ"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Chọn nhà trọ */}
                <FormField
                  control={form.control}
                  name="rentalId"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>Nhà trọ</FormLabel>
                        <Select
                          key={`rental-select-${field.value}-${rentalOptions.length}`} // Force re-mount khi data thay đổi
                          disabled={isRentalsLoading}
                          onValueChange={(value) => {
                            field.onChange(Number(value));
                          }}
                          value={field.value ? String(field.value) : ""}
                          defaultValue={
                            field.value ? String(field.value) : undefined
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isRentalsLoading
                                    ? "Đang tải nhà trọ..."
                                    : "Chọn nhà trọ"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rentalOptions.map((rental: any) => (
                              <SelectItem
                                key={rental.id}
                                value={String(rental.id)}
                              >
                                {rental.title ||
                                  rental.name ||
                                  `Nhà trọ ${rental.id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Giá */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá (VNĐ)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          pattern="[0-9]*"
                          placeholder="Nhập giá phòng"
                          {...field}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            field.onChange(value ? Number(value) : 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Diện tích */}
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diện tích (m²)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          pattern="[0-9]*"
                          placeholder="Nhập diện tích phòng"
                          {...field}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            field.onChange(value ? Number(value) : 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Trạng thái */}
                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!field.value && hasActiveContract}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Còn trống</FormLabel>
                        {!field.value && hasActiveContract && (
                          <p className="text-xs text-red-500 mt-1">
                            Không thể thay đổi trạng thái vì đang có hợp đồng
                            thuê còn hiệu lực
                          </p>
                        )}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Hình ảnh */}
              <div>
                <FormLabel>Hình ảnh (tối đa 5 ảnh)</FormLabel>
                <ImageUploadSlots
                  imageSlots={imageSlots.map((slot) =>
                    slot
                      ? { imageUrl: slot.previewUrl || "", order: slot.order }
                      : null
                  )}
                  handleImageUpload={(e, slotIndex) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      const previewUrl = URL.createObjectURL(file);
                      const newImageSlots = [...imageSlots];
                      newImageSlots[slotIndex] = {
                        file,
                        previewUrl,
                        order: slotIndex + 1,
                      };
                      setImageSlots(newImageSlots);
                    }
                  }}
                  removeImage={(slotIndex) => {
                    const newImageSlots = [...imageSlots];
                    newImageSlots[slotIndex] = null;
                    setImageSlots(newImageSlots);
                  }}
                />
              </div>

              {/* Tiện ích */}
              <div>
                <FormLabel>Tiện ích</FormLabel>
                <AmenitySelector
                  selectedAmenities={selectedAmenities}
                  onChange={setSelectedAmenities}
                  maxHeight="180px"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isUpdating || imageUploading}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isUpdating || imageUploading}>
                  {isUpdating || imageUploading
                    ? "Đang cập nhật..."
                    : "Cập nhật"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
