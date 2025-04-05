"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateRoom, useGetRoomDetail } from "@/features/rooms/useRoom";
import { useGetRentals } from "@/features/rental/useRental";
import { RoomType, UpdateRoomBodyType } from "@/schemas/room.schema";
import { toast } from "sonner";
import { AmenitySelector } from "@/features/dashboard/components/amenity-selector";
import { AmenityType } from "@/schemas/amenity.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { Checkbox } from "@/components/ui/checkbox";

type EditRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number | null;
};

export function EditRoomModal({
  open,
  onOpenChange,
  roomId,
}: EditRoomModalProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityType[]>([]);
  const { mutateAsync: updateRoom, isPending: isUpdating } = useUpdateRoom();

  const form = useForm<UpdateRoomBodyType>({
    defaultValues: {
      title: "",
      price: 0,
      area: 0,
      rentalId: 0,
      isAvailable: true,
      amenityIds: [],
    },
  });

  const {
    data: roomData,
    isLoading: isRoomLoading,
    error: roomError,
  } = useGetRoomDetail(roomId || 0);

  const { data: rentalsData, isLoading: isRentalsLoading } = useGetRentals({
    limit: 100,
    page: 1,
  });

  const rentalOptions = rentalsData?.data ?? [];

  // Khi dữ liệu phòng được tải, cập nhật form và danh sách tiện ích đã chọn
  useEffect(() => {
    if (roomData && open) {
      form.reset({
        title: roomData.title || "",
        price: roomData.price || 0,
        area: roomData.area || 0,
        rentalId: roomData.rentalId || 0,
        isAvailable:
          roomData.isAvailable !== undefined ? roomData.isAvailable : true,
      });

      // Nếu phòng có danh sách tiện ích, cập nhật danh sách đã chọn
      if (roomData.amenities && roomData.amenities.length > 0) {
        setSelectedAmenities(roomData.amenities);
      } else {
        setSelectedAmenities([]);
      }
    }
  }, [roomData, open, form]);

  const handleSubmit = async (values: UpdateRoomBodyType) => {
    if (!roomId) return;

    try {
      // Thêm danh sách ID tiện ích
      const amenityIds = selectedAmenities.map((amenity) => amenity.id);
      const payload = {
        ...values,
        amenityIds,
      };

      await updateRoom({ roomId, body: payload });
      toast.success("Cập nhật phòng trọ thành công");
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
        toast.error("Cập nhật phòng trọ thất bại");
      }
    }
  };

  if (roomError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lỗi</DialogTitle>
            <DialogDescription>
              Không thể tải thông tin phòng trọ. Vui lòng thử lại sau.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phòng trọ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin phòng trọ theo yêu cầu của bạn.
          </DialogDescription>
        </DialogHeader>
        {isRoomLoading ? (
          <div className="py-4 text-center">Đang tải dữ liệu phòng trọ...</div>
        ) : (
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
                        <Input
                          placeholder="Nhập tiêu đề phòng trọ"
                          {...field}
                        />
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
                            <SelectItem
                              key={rental.id}
                              value={String(rental.id)}
                            >
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
                          placeholder="Nhập diện tích phòng"
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
              </div>

              {/* Trạng thái phòng */}
              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Còn trống</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Phòng này hiện vẫn còn trống và có thể cho thuê
                      </p>
                    </div>
                  </FormItem>
                )}
              />

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
                  disabled={isUpdating}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
