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
import MapWithGeocode from "@/features/map/map-with-geocode";
import { ImageUploadSlots } from "@/features/rental/component/image-upload-slots";

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
  imageSlots: Array<{ imageUrl: string; order: number } | null>;
  setImageSlots: React.Dispatch<
    React.SetStateAction<Array<{ imageUrl: string; order: number } | null>>
  >;
  onClose: () => void;
}

export function RentalForm({
  form,
  handleSubmit,
  onClose,
  imageSlots,
  setImageSlots,
}: RentalFormProps) {
  // Sử dụng useWatch để theo dõi giá trị "address" mà không gây render lại không cần thiết
  const watchedAddress = useWatch({
    control: form.control,
    name: "address",
  });
  const debouncedAddress = useDebounce(watchedAddress, 500);

  // Khi AddressSelector thay đổi, cập nhật giá trị address trong form nếu có sự thay đổi thực sự
  const handleAddressChange = (address: string) => {
    const currentAddress = form.getValues("address");
    if (address !== currentAddress) {
      form.setValue("address", address);
    }
  };

  // Xử lý upload hình ảnh
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    slotIndex: number
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      const newImageSlots = [...imageSlots];
      newImageSlots[slotIndex] = {
        imageUrl,
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
        {/* Trường tiêu đề */}
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

        {/* Trường mô tả */}
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

        {/* Trường địa chỉ (readOnly) */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Địa chỉ</FormLabel>
              <FormControl>
                <Input placeholder="Địa chỉ chi tiết" {...field} readOnly />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Thành phần chọn địa chỉ */}
        <AddressSelector onAddressChange={handleAddressChange} />

        {/* Bản đồ hiển thị dựa trên địa chỉ đã debounce */}
        <MapWithGeocode
          address={debouncedAddress}
          onCoordinateChange={(coord) => {
            // MapBox trả về [lng, lat] nên cập nhật form: lat = coord[1], lng = coord[0]
            form.setValue("lat", coord[1]);
            form.setValue("lng", coord[0]);
          }}
        />

        {/* Hình ảnh */}
        <FormLabel>Hình ảnh (tối đa 5 ảnh)</FormLabel>
        <ImageUploadSlots
          imageSlots={imageSlots}
          handleImageUpload={handleImageUpload}
          removeImage={removeImage}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit">Tạo nhà trọ</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
