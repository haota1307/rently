"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateBulkPosts } from "@/features/post/usePost";
import { useGetRentalsById } from "@/features/rental/useRental";
import { useGetMyRooms } from "@/features/rooms/useRoom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CreateBulkPostsBodySchema,
  CreateBulkPostsBodyType,
  RentalPostStatus,
} from "@/schemas/post.schema";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Building,
  Hash,
  Calendar as CalendarIcon2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type CreateBulkPostsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CreateBulkPostsModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateBulkPostsModalProps) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const { mutateAsync: createBulkPosts, isPending } = useCreateBulkPosts();

  // Lấy userId từ token
  const accessToken = getAccessTokenFromLocalStorage();
  const userId = accessToken ? decodeAccessToken(accessToken).userId : null;

  // Lấy danh sách nhà trọ của chủ trọ đang đăng nhập
  const { data: rentalsData, isLoading: isRentalsLoading } = useGetRentalsById(
    userId!,
    {
      limit: 100,
      page: 1,
    }
  );
  const rentalOptions = rentalsData?.data ?? [];

  // Form validation
  const form = useForm({
    resolver: zodResolver(CreateBulkPostsBodySchema),
    defaultValues: {
      baseName: "Cho thuê",
      roomIds: [] as number[],
      rentalId: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: "",
      status: RentalPostStatus.ACTIVE,
      deposit: 0,
    } as any,
  });

  // Watch form values
  const watchedValues = form.watch();
  const selectedRental = rentalOptions.find(
    (rental) => rental.id === watchedValues.rentalId
  );

  // Lấy danh sách phòng thuộc nhà trọ đã chọn
  const { data: roomsData, isLoading: isRoomsLoading } = useGetMyRooms({
    limit: 100,
    page: 1,
    // Lọc theo nhà trọ đã chọn thông qua ownerId (landlordId của rental)
  });

  // Lọc rooms theo rental đã chọn
  const availableRooms =
    roomsData?.data?.filter(
      (room) =>
        selectedRental &&
        room.rentalId === selectedRental.id &&
        room.isAvailable // Chỉ hiển thị phòng còn trống
    ) ?? [];

  // Preview posts
  const previewPosts = selectedRoomIds
    .map((roomId) => {
      const room = availableRooms.find((r) => r.id === roomId);
      const rentalName = selectedRental?.title || "";
      return room
        ? `${watchedValues.baseName} ${room.title}${rentalName ? ` - ${rentalName}` : ""}`
        : "";
    })
    .filter(Boolean);

  const handleRoomToggle = (roomId: number, checked: boolean) => {
    if (checked) {
      setSelectedRoomIds((prev) => [...prev, roomId]);
    } else {
      setSelectedRoomIds((prev) => prev.filter((id) => id !== roomId));
    }
    // Cập nhật form value
    const newRoomIds = checked
      ? [...selectedRoomIds, roomId]
      : selectedRoomIds.filter((id) => id !== roomId);
    form.setValue("roomIds", newRoomIds);
  };

  const handleSelectAll = () => {
    const allRoomIds = availableRooms.map((room) => room.id);
    setSelectedRoomIds(allRoomIds);
    form.setValue("roomIds", allRoomIds);
  };

  const handleDeselectAll = () => {
    setSelectedRoomIds([]);
    form.setValue("roomIds", []);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        roomIds: selectedRoomIds,
      };

      const result = await createBulkPosts(payload);
      toast.success(`Tạo thành công ${result.totalCreated} bài đăng`);
      resetForm();
      onSuccess?.();
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
        toast.error("Tạo bài đăng hàng loạt thất bại");
      }
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedRoomIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Tạo bài đăng hàng loạt
          </DialogTitle>
          <DialogDescription>
            Tạo nhiều bài đăng cùng một lúc cho các phòng trống trong nhà trọ.
            Mỗi phòng sẽ có một bài đăng riêng với thông tin tương tự.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Thông tin cơ bản */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chọn nhà trọ */}
                <FormField
                  control={form.control}
                  name="rentalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nhà trọ</FormLabel>
                      <Select
                        disabled={isRentalsLoading}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          // Reset selected rooms khi đổi rental
                          setSelectedRoomIds([]);
                          form.setValue("roomIds", []);
                        }}
                        value={field.value ? String(field.value) : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn nhà trọ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rentalOptions.map((rental) => (
                            <SelectItem
                              key={rental.id}
                              value={String(rental.id)}
                            >
                              {rental.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tên cơ bản */}
                <FormField
                  control={form.control}
                  name="baseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên cơ bản bài đăng</FormLabel>
                      <FormControl>
                        <Input placeholder="Cho thuê" {...field} />
                      </FormControl>
                      <FormDescription>
                        Tên sẽ được kết hợp với tên phòng: {field.value} [Tên
                        phòng]
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Chọn phòng */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chọn phòng trống</CardTitle>
                <CardDescription>
                  Chọn các phòng trống để tạo bài đăng. Chỉ hiển thị các phòng
                  còn trống.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRental ? (
                  <div className="space-y-4">
                    {availableRooms.length > 0 ? (
                      <>
                        {/* Buttons chọn tất cả/bỏ chọn */}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            disabled={
                              selectedRoomIds.length === availableRooms.length
                            }
                          >
                            Chọn tất cả ({availableRooms.length})
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDeselectAll}
                            disabled={selectedRoomIds.length === 0}
                          >
                            Bỏ chọn tất cả
                          </Button>
                        </div>

                        {/* Hiển thị số phòng đã chọn */}
                        {selectedRoomIds.length > 0 && (
                          <Badge variant="secondary">
                            Đã chọn {selectedRoomIds.length} phòng
                          </Badge>
                        )}

                        {/* Grid các phòng */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                          {availableRooms.map((room) => (
                            <div
                              key={room.id}
                              className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <Checkbox
                                id={`room-${room.id}`}
                                checked={selectedRoomIds.includes(room.id)}
                                onCheckedChange={(checked) =>
                                  handleRoomToggle(room.id, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`room-${room.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="font-medium">{room.title}</div>
                                <div className="text-sm text-gray-500">
                                  {room.price?.toLocaleString("vi-VN")} VNĐ -{" "}
                                  {room.area}m²
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>Không có phòng trống nào trong nhà trọ này</p>
                        <p className="text-sm">
                          Vui lòng chọn nhà trọ khác hoặc thêm phòng mới
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>Vui lòng chọn nhà trọ trước</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Thông tin bài đăng */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin bài đăng</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ngày bắt đầu */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Ngày bắt đầu</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", {
                                  locale: vi,
                                })
                              ) : (
                                <span>Chọn ngày</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(date?.toISOString())
                            }
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ngày kết thúc */}
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Ngày kết thúc</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", {
                                  locale: vi,
                                })
                              ) : (
                                <span>Chọn ngày</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(date?.toISOString())
                            }
                            disabled={(date) =>
                              date < new Date(watchedValues.startDate)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tiền cọc */}
                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiền cọc (VNĐ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="1000000"
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

                {/* Mô tả */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Mô tả chi tiết về phòng trọ..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Preview */}
            {previewPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Xem trước bài đăng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {previewPosts.map((postTitle, index) => (
                      <div
                        key={index}
                        className="text-sm bg-muted px-3 py-2 rounded-md"
                      >
                        {postTitle}
                      </div>
                    ))}
                  </div>
                  {previewPosts.length > 8 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ... và {previewPosts.length - 8} bài đăng khác
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Warning */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Lưu ý: Tất cả bài đăng sẽ được tạo với cùng thông tin (ngày bắt
                đầu, kết thúc, tiền cọc, mô tả). Giá thuê sẽ được lấy từ giá
                phòng. Bạn có thể chỉnh sửa từng bài đăng riêng lẻ sau khi tạo.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isPending || selectedRoomIds.length === 0}
              >
                {isPending
                  ? "Đang tạo..."
                  : `Tạo ${selectedRoomIds.length} bài đăng`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
