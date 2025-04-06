"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateRoom } from "@/features/rooms/useRoom";
import { useGetRentals } from "@/features/rental/useRental";
import { AmenitySelector } from "@/features/dashboard/components/amenity-selector";
import { AmenityType } from "@/schemas/amenity.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CreateRoomBodySchema,
  CreateRoomBodyType,
} from "@/schemas/room.schema";
import { toast } from "sonner";
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
import { ImageUploadSlots } from "@/features/rental/component/image-upload-slots";

type CreateRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateRoomModal({ open, onOpenChange }: CreateRoomModalProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityType[]>([]);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const { mutateAsync: createRoom, isPending } = useCreateRoom();
  const { mutateAsync: imageUpload, isPending: imageUploading } =
    useUploadImages();

  // Lấy danh sách nhà trọ
  const { data: rentalsData, isLoading: isRentalsLoading } = useGetRentals({
    limit: 100,
    page: 1,
  });
  const rentalOptions = rentalsData?.data ?? [];

  // Form validation
  const form = useForm<CreateRoomBodyType>({
    resolver: zodResolver(CreateRoomBodySchema),
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

  const handleSubmit = async (values: CreateRoomBodyType) => {
    try {
      // Thêm danh sách ID tiện ích
      const amenityIds = selectedAmenities.map((amenity) => amenity.id);

      // Xử lý upload ảnh
      const validSlots = imageSlots.filter(
        (slot): slot is { file: File; previewUrl: string; order: number } =>
          slot !== null
      );

      let uploadedImages: Array<{ url: string; public_id: string }> = [];
      if (validSlots.length > 0) {
        if (imageUploading || isPending) return;
        try {
          const formData = new FormData();
          validSlots.forEach((slot) => {
            formData.append("images", slot.file);
          });

          const uploadResponse = await imageUpload(formData);
          console.log("Upload response:", uploadResponse);
          uploadedImages = uploadResponse.payload;
        } catch (error) {
          console.error("Lỗi upload ảnh:", error);
          toast.error("Không thể tải lên hình ảnh, vui lòng thử lại");
          return;
        }
      }

      // Tạo payload
      const payload = {
        ...values,
        amenityIds,
        roomImages: uploadedImages.map((img, index) => ({
          imageUrl: img.url,
          order: index + 1,
        })),
      };

      await createRoom(payload);
      toast.success("Tạo phòng trọ thành công");
      resetForm();
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
        toast.error("Tạo phòng trọ thất bại");
      }
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedAmenities([]);
    setImageSlots([null, null, null, null, null]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo phòng trọ mới</DialogTitle>
          <DialogDescription>
            Vui lòng điền thông tin phòng trọ theo đúng yêu cầu.
          </DialogDescription>
        </DialogHeader>

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
                      <Input placeholder="Nhập tiêu đề phòng trọ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Chọn nhà trọ */}
              <FormField
                control={form.control}
                name="rentalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhà trọ</FormLabel>
                    <Select
                      disabled={isRentalsLoading}
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : undefined}
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
                          <SelectItem key={rental.id} value={String(rental.id)}>
                            {rental.title ||
                              rental.name ||
                              `Nhà trọ ${rental.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
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
                        type="number"
                        placeholder="Nhập giá phòng"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                        type="number"
                        placeholder="Nhập diện tích phòng"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
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
                disabled={isPending || imageUploading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending || imageUploading}>
                {isPending || imageUploading ? "Đang tạo..." : "Tạo phòng"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
