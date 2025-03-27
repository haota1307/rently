"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  UpdateRentalBodySchema,
  UpdateRentalBodyType,
  RentalType,
} from "@/schemas/rental.schema";
import { RentalForm } from "@/features/rental/component/rental-form";
import { useUpdateRental } from "@/features/rental/useRental";
import { useUploadImages } from "@/features/media/useMedia";
import { toast } from "sonner";
import { ImageSlot } from "@/types/images.type";

interface UpdateRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: RentalType;
}

export function UpdateRentalModal({
  isOpen,
  onClose,
  rental,
}: UpdateRentalModalProps) {
  // Khởi tạo form với giá trị mặc định từ rental cần cập nhật
  const form = useForm<UpdateRentalBodyType>({
    resolver: zodResolver(UpdateRentalBodySchema),
    defaultValues: {
      landlordId: rental.landlordId,
      title: rental.title,
      description: rental.description,
      address: rental.address,
      lat: rental.lat,
      lng: rental.lng,
      rentalImages: rental.rentalImages,
    },
  });

  const initialImageSlots: ImageSlot[] =
    rental.rentalImages?.map((img) => ({
      file: null,
      previewUrl: img.imageUrl,
      order: img.order,
    })) || [];

  // Giới hạn số slot ảnh (ví dụ: 5 ảnh)
  const slotsCount = 5;
  const paddedImageSlots = [
    ...initialImageSlots,
    ...new Array(slotsCount - initialImageSlots.length).fill(null),
  ];

  const [imageSlots, setImageSlots] =
    React.useState<ImageSlot[]>(paddedImageSlots);

  // Hook cập nhật rental và upload ảnh
  const { mutateAsync: updateRental, isPending: updating } = useUpdateRental();
  const { mutateAsync: imageUpload, isPending: imageUploading } =
    useUploadImages();

  const handleSubmit = async (values: UpdateRentalBodyType) => {
    try {
      // Lọc ra những slot chứa file mới được upload
      const newImageSlots = imageSlots.filter(
        (slot): slot is { file: File; previewUrl: string; order: number } =>
          slot !== null && typeof slot.file === "object"
      );

      let uploadedImages: Array<{ url: string; public_id: string }> = [];
      if (newImageSlots.length > 0) {
        if (imageUploading || updating) return;
        try {
          const formData = new FormData();
          newImageSlots.forEach((slot) => {
            formData.append("images", slot.file);
          });
          const uploadResponse = await imageUpload(formData);
          uploadedImages = uploadResponse.payload;
        } catch (error) {
          console.error("Lỗi upload ảnh:", error);
          return;
        }
      }

      // Xử lý mảng ảnh cập nhật:
      // Nếu có ảnh mới upload cho một slot, thay thế ảnh cũ;
      // Nếu slot không có file mới, giữ nguyên ảnh hiện có.
      const updatedImages = imageSlots
        .map((slot, index) => {
          if (slot && slot.file) {
            // Thay thế bằng ảnh mới upload theo thứ tự slot
            const uploaded = uploadedImages.shift();
            return uploaded
              ? { imageUrl: uploaded.url, order: index + 1 }
              : null;
          } else if (slot && !slot.file) {
            // Giữ nguyên ảnh hiện có
            return { imageUrl: slot.previewUrl, order: slot.order };
          }
          return null;
        })
        .filter((img) => img !== null) as Array<{
        imageUrl: string;
        order: number;
      }>;

      const dataToSubmit: UpdateRentalBodyType = {
        ...values,
        rentalImages: updatedImages,
      };
      if (updating) return;
      await updateRental({ rentalId: rental.id, body: dataToSubmit });
      toast.success("Cập nhật nhà trọ thành công");
      onClose();
    } catch (error) {
      console.error("Lỗi cập nhật rental:", error);
      toast.error("Cập nhật nhà trọ thất bại");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật nhà trọ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin chi tiết về nhà trọ của bạn
          </DialogDescription>
        </DialogHeader>
        <RentalForm
          form={form}
          handleSubmit={handleSubmit}
          imageSlots={imageSlots}
          setImageSlots={setImageSlots}
          onClose={onClose}
          isLoading={updating || imageUploading}
          submitButtonText="Cập nhật nhà trọ"
          rental={rental}
        />
      </DialogContent>
    </Dialog>
  );
}
