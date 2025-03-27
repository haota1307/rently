"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { UseFormReturn, useWatch } from "react-hook-form";
import { CreateRentalBodyType } from "@/schemas/rental.schema";
import AddressSelector from "@/features/rental/component/address-selector";

import { ImageSlot } from "@/features/rental/component/create-rental-modal"; // hoặc import từ file modal
import { ImageUploadSlots } from "./image-upload-slots"; // Tuỳ bạn có component con hay không
import MapWithGeocode from "@/features/map/map-with-geocode";

// Custom hook: debounce giá trị đầu vào
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface RentalFormProps {
  form: UseFormReturn<CreateRentalBodyType>;
  handleSubmit: (values: CreateRentalBodyType) => void;
  imageSlots: ImageSlot[];
  setImageSlots: React.Dispatch<React.SetStateAction<ImageSlot[]>>;
  onClose: () => void;
  isLoading: boolean;
}

export function RentalForm({
  form,
  handleSubmit,
  onClose,
  imageSlots,
  setImageSlots,
  isLoading,
}: RentalFormProps) {
  const watchedAddress = useWatch({
    control: form.control,
    name: "address",
  });
  const debouncedAddress = useDebounce(watchedAddress, 500);

  const handleAddressChange = (address: string) => {
    const currentAddress = form.getValues("address");
    if (address !== currentAddress) {
      form.setValue("address", address);
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    slotIndex: number
  ) => {
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
  };

  const removeImage = (slotIndex: number) => {
    const newImageSlots = [...imageSlots];
    newImageSlots[slotIndex] = null;
    setImageSlots(newImageSlots);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tiêu đề nhà trọ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea placeholder="Mô tả chi tiết" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormLabel>Địa chỉ</FormLabel>
              <FormControl>
                <Input placeholder="Địa chỉ chi tiết" {...field} readOnly />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <AddressSelector onAddressChange={handleAddressChange} />

        <MapWithGeocode
          address={debouncedAddress}
          onCoordinateChange={(coord) => {
            form.setValue("lng", coord[0]);
            form.setValue("lat", coord[1]);
          }}
        />

        <FormLabel>Hình ảnh (tối đa 5 ảnh)</FormLabel>

        <ImageUploadSlots
          imageSlots={
            imageSlots.map((slot) =>
              slot ? { imageUrl: slot.previewUrl, order: slot.order } : null
            ) as Array<{ imageUrl: string; order: number } | null>
          }
          handleImageUpload={handleImageUpload}
          removeImage={removeImage}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={!form.formState.isValid || isLoading} type="submit">
            {isLoading ? "Đang tạo..." : "Tạo nhà trọ"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
