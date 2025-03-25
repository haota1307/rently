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
      lat: 0,
      lng: 0,
      rentalImages: [],
    },
  });

  const handleSubmit = async (values: CreateRentalBodyType) => {
    const validSlots = imageSlots.filter(
      (slot): slot is { file: File; previewUrl: string; order: number } =>
        slot !== null
    );

    let uploadedImages: Array<{ url: string; public_id: string }> = [];
    if (validSlots.length > 0) {
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
      const rentalResult = await rentalCreate(dataToSubmit);
      onSubmit(dataToSubmit);

      form.reset();
      setImageSlots([null, null, null, null, null]);
    } catch (error) {
      console.error("Lỗi tạo rental:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
