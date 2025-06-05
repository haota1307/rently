"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateRoomForLandlord } from "@/features/rooms/useRoom";
import { useGetRentals } from "@/features/rental/useRental";
import { useGetLandlords } from "@/features/user/useUser";
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

// Extend the schema to include landlordId for admin
const CreateRoomForLandlordSchema = CreateRoomBodySchema.extend({
  landlordId: z.number().min(1, "Vui lòng chọn người cho thuê"),
});

type CreateRoomForLandlordType = z.infer<typeof CreateRoomForLandlordSchema>;

type CreateRoomForLandlordModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateRoomForLandlordModal({
  open,
  onOpenChange,
}: CreateRoomForLandlordModalProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityType[]>([]);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [selectedLandlordId, setSelectedLandlordId] = useState<number | null>(
    null
  );

  const { mutateAsync: createRoomForLandlord, isPending } =
    useCreateRoomForLandlord();
  const { mutateAsync: imageUpload, isPending: imageUploading } =
    useUploadImages();

  // Lấy danh sách người cho thuê (landlord + admin)
  const { data: landlordsData, isLoading: isLandlordsLoading } =
    useGetLandlords({
      limit: 999,
      status: "ACTIVE",
    });
  const landlordOptions = landlordsData?.data ?? [];

  // Lấy danh sách nhà trọ theo landlord được chọn
  const { data: rentalsData, isLoading: isRentalsLoading } = useGetRentals({
    page: 1,
    limit: 999,
    landlordId: selectedLandlordId || undefined,
  });
  const rentalOptions = rentalsData?.data ?? [];

  // Form validation
  const form = useForm<CreateRoomForLandlordType>({
    resolver: zodResolver(CreateRoomForLandlordSchema),
    defaultValues: {
      title: "",
      price: 0,
      area: 0,
      rentalId: 0,
      landlordId: 0,
      isAvailable: true,
      amenityIds: [],
      roomImages: [],
    },
  });

  const handleLandlordChange = (landlordId: string) => {
    const id = Number(landlordId);
    setSelectedLandlordId(id);
    form.setValue("landlordId", id);
    form.setValue("rentalId", 0); // Reset rental selection
  };

  const handleSubmit = async (values: CreateRoomForLandlordType) => {
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

      // Tạo payload với landlordId
      const { landlordId, ...roomData } = values;
      const payload = {
        ...roomData,
        landlordId,
        amenityIds,
        roomImages: uploadedImages.map((img, index) => ({
          imageUrl: img.url,
          order: index + 1,
        })),
      };

      await createRoomForLandlord(payload);
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
    setSelectedLandlordId(null);
  };

  // Hiển thị vai trò
  const getRoleText = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "Admin";
      case 2:
        return "Chủ trọ";
      case 3:
        return "Khách hàng";
      default:
        return `Vai trò #${roleId}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo phòng trọ cho người cho thuê</DialogTitle>
          <DialogDescription>
            Vui lòng chọn người cho thuê và điền thông tin phòng trọ theo đúng
            yêu cầu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Chọn người cho thuê */}
            <FormField
              control={form.control}
              name="landlordId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chọn người cho thuê</FormLabel>
                  <Select
                    disabled={isLandlordsLoading}
                    onValueChange={handleLandlordChange}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLandlordsLoading
                              ? "Đang tải danh sách..."
                              : "Chọn người cho thuê"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {landlordOptions.map((landlord: any) => (
                        <SelectItem
                          key={landlord.id}
                          value={String(landlord.id)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{landlord.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {landlord.email} - {getRoleText(landlord.roleId)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      disabled={isRentalsLoading || !selectedLandlordId}
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedLandlordId
                                ? "Vui lòng chọn người cho thuê trước"
                                : isRentalsLoading
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
            </div>

            {/* Hình ảnh */}
            <div>
              <label className="text-sm font-medium">
                Hình ảnh (tối đa 5 ảnh)
              </label>
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
              <label className="text-sm font-medium">Tiện ích</label>
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
