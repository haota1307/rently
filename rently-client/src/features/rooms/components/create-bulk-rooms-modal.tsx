"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateBulkRooms } from "@/features/rooms/useRoom";
import { useGetRentalsById } from "@/features/rental/useRental";
import { AmenitySelector } from "@/features/dashboard/components/amenity-selector";
import { AmenityType } from "@/schemas/amenity.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CreateBulkRoomsBodySchema,
  CreateBulkRoomsBodyType,
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
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Building, Hash, ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type CreateBulkRoomsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CreateBulkRoomsModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateBulkRoomsModalProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityType[]>([]);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const { mutateAsync: createBulkRooms, isPending } = useCreateBulkRooms();
  const { mutateAsync: imageUpload, isPending: imageUploading } =
    useUploadImages();

  // Lấy userId từ token
  const accessToken = getAccessTokenFromLocalStorage();
  const userId = accessToken ? decodeAccessToken(accessToken).userId : null;

  // Lấy danh sách nhà trọ của chủ trọ đang đăng nhập
  const { data: rentalsData, isLoading: isRentalsLoading } = useGetRentalsById(
    userId!,
    {
      limit: 100,
      page: 1,
    }
  );
  const rentalOptions = rentalsData?.data ?? [];

  // Form validation
  const form = useForm<CreateBulkRoomsBodyType>({
    resolver: zodResolver(CreateBulkRoomsBodySchema),
    defaultValues: {
      baseName: "Phòng",
      startNumber: 1,
      count: 5,
      price: 0,
      area: 0,
      rentalId: 0,
      isAvailable: true,
      amenityIds: [],
      roomImages: [],
    },
  });

  // Watch form values for preview
  const watchedValues = form.watch();

  // Lấy tên nhà trọ đã chọn
  const selectedRental = rentalOptions.find(
    (rental) => rental.id === watchedValues.rentalId
  );
  const rentalName = selectedRental?.title || "";

  const previewRooms = Array.from(
    { length: watchedValues.count || 0 },
    (_, index) => {
      const roomNumber = watchedValues.startNumber + index;
      const baseName = `${watchedValues.baseName} ${roomNumber}`;
      return rentalName ? `${baseName} - ${rentalName}` : baseName;
    }
  );

  const handleSubmit = async (values: CreateBulkRoomsBodyType) => {
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

      const result = await createBulkRooms(payload);
      toast.success(`Tạo thành công ${result.totalCreated} phòng trọ`);
      resetForm();
      onSuccess?.();
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
        toast.error("Tạo phòng trọ hàng loạt thất bại");
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
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Tạo phòng trọ hàng loạt
          </DialogTitle>
          <DialogDescription>
            Tạo nhiều phòng trọ cùng một lúc với thông tin tương tự. Hệ thống sẽ
            tự động đánh số phòng theo thứ tự.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Thông tin cơ bản */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chọn nhà trọ */}
                <FormField
                  control={form.control}
                  name="rentalId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nhà trọ</FormLabel>
                      <Select
                        disabled={isRentalsLoading}
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value ? String(field.value) : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn nhà trọ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rentalOptions.map((rental) => (
                            <SelectItem
                              key={rental.id}
                              value={String(rental.id)}
                            >
                              {rental.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tên cơ bản */}
                <FormField
                  control={form.control}
                  name="baseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên cơ bản</FormLabel>
                      <FormControl>
                        <Input placeholder="Phòng" {...field} />
                      </FormControl>
                      <FormDescription>
                        Tên sẽ được đánh số tự động: {field.value} 1
                        {rentalName ? ` - ${rentalName}` : ""}, {field.value} 2
                        {rentalName ? ` - ${rentalName}` : ""}, ...
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Số bắt đầu */}
                <FormField
                  control={form.control}
                  name="startNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số bắt đầu</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Số lượng phòng */}
                <FormField
                  control={form.control}
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số lượng phòng</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          placeholder="5"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>Tối đa 50 phòng</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Trạng thái */}
                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Phòng còn trống
                          </FormLabel>
                          <FormDescription>
                            Đánh dấu phòng có sẵn để cho thuê
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Thông tin phòng */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin phòng</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Giá phòng */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá phòng (VNĐ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="3000000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
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
                          min="0"
                          placeholder="25"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Tiện ích */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tiện ích</CardTitle>
                <CardDescription>
                  Chọn các tiện ích sẽ áp dụng cho tất cả phòng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AmenitySelector
                  selectedAmenities={selectedAmenities}
                  onChange={setSelectedAmenities}
                  maxHeight="180px"
                />
              </CardContent>
            </Card>

            {/* Hình ảnh */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Hình ảnh phòng
                </CardTitle>
                <CardDescription>
                  Hình ảnh sẽ được áp dụng cho tất cả phòng được tạo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploadSlots
                  imageSlots={
                    imageSlots.map((slot) =>
                      slot
                        ? { imageUrl: slot.previewUrl || "", order: slot.order }
                        : null
                    ) as Array<{ imageUrl: string; order: number } | null>
                  }
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
              </CardContent>
            </Card>

            {/* Preview */}
            {previewRooms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Xem trước tên phòng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {previewRooms.map((roomName, index) => (
                      <div
                        key={index}
                        className="text-sm bg-muted px-3 py-2 rounded-md"
                      >
                        {roomName}
                      </div>
                    ))}
                  </div>
                  {previewRooms.length > 12 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ... và {previewRooms.length - 12} phòng khác
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Warning */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Lưu ý: Tất cả phòng sẽ được tạo với cùng thông tin (giá, diện
                tích, tiện ích, hình ảnh). Bạn có thể chỉnh sửa từng phòng riêng
                lẻ sau khi tạo.
              </AlertDescription>
            </Alert>

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
                {isPending || imageUploading
                  ? "Đang tạo..."
                  : `Tạo ${form.watch("count") || 0} phòng`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
