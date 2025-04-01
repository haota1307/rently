"use client";
import React from "react";
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
import { UseFormReturn } from "react-hook-form";
import AddressAutocomplete from "@/features/map/address-auto-complete";
import MapWithGeocode from "@/features/map/map-with-geocode";
import { ImageUploadSlots } from "./image-upload-slots";
import { ImageSlot } from "@/types/images.type";
import { CreateRentalBodyType, RentalType } from "@/schemas/rental.schema";

interface RentalFormProps {
  form: UseFormReturn<CreateRentalBodyType>;
  handleSubmit: (values: CreateRentalBodyType) => void;
  imageSlots: ImageSlot[];
  setImageSlots: React.Dispatch<React.SetStateAction<ImageSlot[]>>;
  onClose: () => void;
  isLoading: boolean;
  submitButtonText?: string;
  rental?: RentalType;
}

export function RentalForm({
  form,
  handleSubmit,
  onClose,
  imageSlots,
  setImageSlots,
  isLoading,
  rental,
  submitButtonText = "Tạo nhà trọ",
}: RentalFormProps) {
  const isEditMode = Boolean(rental);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {isEditMode ? (
          <>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
                  <FormControl>
                    <Input placeholder="Tiêu đề" {...field} />
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
                    <Textarea placeholder="Mô tả" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ chi tiết</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập địa chỉ chi tiết"
                      {...field}
                      value={form.watch("address") || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Bản đồ</FormLabel>
              <MapWithGeocode
                address={form.watch("address")}
                defaultCoordinate={[
                  form.getValues("lng"),
                  form.getValues("lat"),
                ]}
                onCoordinateChange={(coord) => {
                  form.setValue("lng", coord[0]);
                  form.setValue("lat", coord[1]);
                }}
                onAddressChange={(newAddress) => {
                  form.setValue("address", newAddress, {
                    shouldValidate: true,
                  });
                }}
              />
            </FormItem>
          </>
        ) : (
          <>
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

            <AddressAutocomplete
              value={form.watch("address")}
              onCoordinateChange={(coord) => {
                form.setValue("lng", coord[0]);
                form.setValue("lat", coord[1]);
              }}
              onAddressChange={(address) => {
                form.setValue("address", address, { shouldValidate: true });
              }}
            />

            <MapWithGeocode
              address={form.watch("address")}
              defaultCoordinate={[form.getValues("lng"), form.getValues("lat")]}
              onCoordinateChange={(coord) => {
                form.setValue("lng", coord[0]);
                form.setValue("lat", coord[1]);
              }}
              onAddressChange={(newAddress) => {
                form.setValue("address", newAddress, { shouldValidate: true });
              }}
            />
          </>
        )}

        <FormLabel>Hình ảnh (tối đa 5 ảnh)</FormLabel>
        <ImageUploadSlots
          imageSlots={imageSlots.map((slot) =>
            slot ? { imageUrl: slot.previewUrl || "", order: slot.order } : null
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
            newImageSlots[slotIndex] = null as any;
            setImageSlots(newImageSlots);
          }}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={!form.formState.isValid || isLoading} type="submit">
            {isLoading
              ? `Đang ${submitButtonText.toLowerCase()}...`
              : submitButtonText}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
