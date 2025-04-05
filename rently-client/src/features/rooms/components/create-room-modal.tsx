"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateRoom } from "@/features/rooms/useRoom";
import { useGetRentals } from "@/features/rental/useRental";
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

type CreateRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateRoomModal({ open, onOpenChange }: CreateRoomModalProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityType[]>([]);
  const { mutateAsync: createRoom, isPending } = useCreateRoom();

  // Lấy danh sách nhà trọ
  const { data: rentalsData, isLoading: isRentalsLoading } = useGetRentals({
    limit: 100,
    page: 1,
  });
  const rentalOptions = rentalsData?.data ?? [];

  // Form validation
  const form = useForm<CreateRoomBodyType>({
    resolver: zodResolver(CreateRoomBodySchema),
    defaultValues: {
      title: "",
      price: 0,
      area: 0,
      rentalId: 0,
      isAvailable: true,
      amenityIds: [],
    },
  });

  const handleSubmit = async (values: CreateRoomBodyType) => {
    try {
      // Thêm danh sách ID tiện ích
      const amenityIds = selectedAmenities.map((amenity) => amenity.id);
      const payload = {
        ...values,
        amenityIds,
      };

      await createRoom(payload);
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Tạo phòng trọ mới</DialogTitle>
          <DialogDescription>
            Vui lòng điền thông tin phòng trọ theo đúng yêu cầu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
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
                      disabled={isRentalsLoading}
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isRentalsLoading
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
                        type="number"
                        placeholder="Nhập giá phòng"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                        placeholder="Nhập diện tích phòng"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tiện ích */}
            <div>
              <FormLabel>Tiện ích</FormLabel>
              <AmenitySelector
                selectedAmenities={selectedAmenities}
                onChange={setSelectedAmenities}
                maxHeight="200px"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang tạo..." : "Tạo phòng"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
