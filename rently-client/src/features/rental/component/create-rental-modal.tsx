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
  CreateRentalBodySchema,
  CreateRentalBodyType,
} from "@/schemas/rental.schema";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";
import { RentalForm } from "@/features/rental/component/rental-form";
import { useCreateRental } from "@/features/rental/useRental";
import { useUploadImages } from "@/features/media/useMedia";
import { toast } from "sonner";

export type ImageSlot = {
  file: File;
  previewUrl: string;
  order: number;
} | null;

interface CreateRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRentalBodyType) => void;
}

export function CreateRentalModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateRentalModalProps) {
  const accessToken = getAccessTokenFromLocalStorage();
  const decodedToken = accessToken ? decodeAccessToken(accessToken) : null;
  const userId = decodedToken ? decodedToken.userId : 0;

  const { mutateAsync: rentalCreate, isPending: rentalCreating } =
    useCreateRental();

  const { mutateAsync: imageUpload, isPending: imageUploading } =
    useUploadImages();

  const [imageSlots, setImageSlots] = React.useState<ImageSlot[]>([
    null,
    null,
    null,
    null,
    null,
  ]);

  const form = useForm<CreateRentalBodyType>({
    resolver: zodResolver(CreateRentalBodySchema),
    defaultValues: {
      landlordId: userId,
      title: "",
      description: "",
      address: "",
      lat: 10.762622,
      lng: 106.660172,
      rentalImages: [],
    },
  });

  const handleSubmit = async (values: CreateRentalBodyType) => {
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

      const dataToSubmit: CreateRentalBodyType = {
        ...values,
        rentalImages: uploadedImages.map((img, index) => ({
          imageUrl: img.url,
          order: index + 1,
        })),
      };

      try {
        if (rentalCreating) return;
        await rentalCreate(dataToSubmit);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm nhà trọ mới</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết về nhà trọ của bạn
          </DialogDescription>
        </DialogHeader>
        <RentalForm
          form={form}
          handleSubmit={handleSubmit}
          imageSlots={imageSlots}
          setImageSlots={setImageSlots}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
