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

  const [imageSlots, setImageSlots] = React.useState<
    Array<{ imageUrl: string; order: number } | null>
  >([null, null, null, null, null]);

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

  const handleSubmit = (values: CreateRentalBodyType) => {
    const images = imageSlots
      .filter(
        (slot): slot is { imageUrl: string; order: number } => slot !== null
      )
      .map((image, index) => ({
        ...image,
        order: index + 1,
      }));

    const dataToSubmit = {
      ...values,
      rentalImages: images,
    };

    console.log({ dataToSubmit });

    onSubmit(dataToSubmit);
    form.reset();
    setImageSlots([null, null, null, null, null]);
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
