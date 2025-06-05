"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  CreateRentalBodySchema,
  CreateRentalBodyType,
} from "@/schemas/rental.schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RentalForm } from "@/features/rental/component/rental-form";
import { useCreateRentalForLandlord } from "@/features/rental/useRental";
import { useGetLandlords } from "@/features/user/useUser";
import { useUploadImages } from "@/features/media/useMedia";
import { toast } from "sonner";
import { ImageSlot } from "@/types/images.type";

// Extend schema to include landlordId for admin
const CreateRentalForLandlordSchema = CreateRentalBodySchema.extend({
  landlordId: z.number().min(1, "Vui lòng chọn người cho thuê"),
});

type CreateRentalForLandlordType = z.infer<
  typeof CreateRentalForLandlordSchema
>;

interface CreateRentalForLandlordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: CreateRentalForLandlordType) => void;
}

export function CreateRentalForLandlordModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateRentalForLandlordModalProps) {
  const [selectedLandlordId, setSelectedLandlordId] = useState<number | null>(
    null
  );

  const { mutateAsync: createRentalForLandlord, isPending: rentalCreating } =
    useCreateRentalForLandlord();

  const { mutateAsync: imageUpload, isPending: imageUploading } =
    useUploadImages();

  // Get list of landlords
  const { data: landlordsData, isLoading: isLandlordsLoading } =
    useGetLandlords({
      limit: 999,
      status: "ACTIVE",
    });
  const landlordOptions = landlordsData?.data ?? [];

  const [imageSlots, setImageSlots] = React.useState<ImageSlot[]>([
    null,
    null,
    null,
    null,
    null,
  ]);

  const form = useForm<CreateRentalForLandlordType>({
    resolver: zodResolver(CreateRentalForLandlordSchema),
    defaultValues: {
      landlordId: 0,
      title: "",
      description: "",
      address: "",
      lat: 10.762622,
      lng: 106.660172,
      rentalImages: [],
    },
  });

  const handleLandlordChange = (landlordId: string) => {
    const id = Number(landlordId);
    setSelectedLandlordId(id);
    form.setValue("landlordId", id);
  };

  const handleSubmit = async (values: CreateRentalForLandlordType) => {
    try {
      const validSlots = imageSlots.filter(
        (slot): slot is { file: File; previewUrl: string; order: number } =>
          slot !== null
      );

      let uploadedImages: Array<{ url: string; public_id: string }> = [];
      if (validSlots.length > 0) {
        if (imageUploading || rentalCreating) return;
        try {
          const formData = new FormData();
          validSlots.forEach((slot) => {
            formData.append("images", slot.file);
          });

          const uploadResponse = await imageUpload(formData);
          uploadedImages = uploadResponse.payload;
        } catch (error) {
          console.error("Lỗi upload ảnh:", error);
          return;
        }
      }

      const { landlordId, ...rentalData } = values;
      const dataToSubmit: CreateRentalBodyType = {
        ...rentalData,
        landlordId,
        rentalImages: uploadedImages.map((img, index) => ({
          imageUrl: img.url,
          order: index + 1,
        })),
      };

      try {
        if (rentalCreating) return;
        await createRentalForLandlord(dataToSubmit);

        toast.success("Tạo nhà trọ thành công");
      } catch (error) {
        toast.error("Tạo nhà trọ thất bại");
      }

      form.reset();
      setImageSlots([null, null, null, null, null]);
    } catch (error) {
      console.error("Lỗi tạo rental:", error);
      if (error instanceof Error) {
        console.error("Chi tiết lỗi:", error.message);
      }
    }
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo nhà trọ cho người cho thuê</DialogTitle>
          <DialogDescription>
            Chọn người cho thuê và điền thông tin chi tiết về nhà trọ
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Chọn người cho thuê */}
          <div className="border-b pb-4">
            <label className="text-base font-medium block mb-2">
              Chọn người cho thuê
            </label>
            <Select
              disabled={isLandlordsLoading}
              onValueChange={handleLandlordChange}
              value={
                selectedLandlordId ? String(selectedLandlordId) : undefined
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLandlordsLoading
                      ? "Đang tải danh sách..."
                      : "Chọn người cho thuê"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {landlordOptions.map((landlord: any) => (
                  <SelectItem key={landlord.id} value={String(landlord.id)}>
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
            {!selectedLandlordId && (
              <p className="text-sm text-red-600 mt-1">
                Vui lòng chọn người cho thuê trước khi tiếp tục
              </p>
            )}
          </div>

          {/* Form tạo nhà trọ */}
          {selectedLandlordId && (
            <RentalForm
              form={form}
              handleSubmit={handleSubmit}
              imageSlots={imageSlots}
              setImageSlots={setImageSlots}
              onClose={onClose}
              isLoading={rentalCreating || imageUploading}
              submitButtonText="Tạo nhà trọ"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
