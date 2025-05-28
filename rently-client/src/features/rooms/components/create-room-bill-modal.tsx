import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import {
  useCreateRoomBill,
  useGetTenantInfo,
  useGetLatestBillInfo,
  TenantInfoResponseNew,
} from "@/features/rooms/useRoomBill";
import { toast } from "sonner";
import {
  CreateRoomBillType,
  CreateRoomBillSchema,
  OtherFeeType,
} from "@/schemas/room-bill.schema";
import { addMonths } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Định nghĩa kiểu dữ liệu cho thông tin người thuê
interface TenantInfoData {
  tenantId: number;
  tenantName: string;
  tenantEmail: string;
  roomPrice: number;
  contractRent: number;
}

interface TenantInfoResponse {
  success: boolean;
  message?: string;
  data?: TenantInfoData;
}

interface CreateRoomBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number;
}

export const CreateRoomBillModal: React.FC<CreateRoomBillModalProps> = ({
  open,
  onOpenChange,
  roomId,
}) => {
  const [otherFees, setOtherFees] = useState<OtherFeeType[]>([]);
  const { mutateAsync: createRoomBill, isPending } = useCreateRoomBill();
  const { data: tenantInfoResponse, isLoading: isLoadingTenant } =
    useGetTenantInfo(roomId);
  const { data: latestBillInfo, isLoading: isLoadingLatestBill } =
    useGetLatestBillInfo(roomId);

  // Kiểm tra phòng có đang được cho thuê hay không
  const isTenantAvailable =
    tenantInfoResponse?.tenant !== null &&
    tenantInfoResponse?.tenant !== undefined;

  // Chuẩn bị dữ liệu mặc định
  const currentDate = new Date();
  const billingMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ); // Ngày đầu tháng hiện tại
  const dueDate = addMonths(billingMonth, 1); // Hạn thanh toán là 1 tháng sau

  const form = useForm<CreateRoomBillType>({
    resolver: zodResolver(CreateRoomBillSchema),
    defaultValues: {
      roomId,
      electricityOld: 0,
      electricityNew: 0,
      electricityPrice: 3500,
      waterOld: 0,
      waterNew: 0,
      waterPrice: 15000,
      totalAmount: 0,
      billingMonth,
      dueDate,
    },
  });

  // Tự động cập nhật form khi có dữ liệu từ hóa đơn gần nhất
  useEffect(() => {
    if (latestBillInfo) {
      const oldElectricity = latestBillInfo.electricityNew;
      const oldWater = latestBillInfo.waterNew;

      form.setValue("electricityOld", oldElectricity);
      form.setValue("electricityNew", oldElectricity);
      form.setValue("waterOld", oldWater);
      form.setValue("waterNew", oldWater);
      form.setValue("electricityPrice", latestBillInfo.electricityPrice);
      form.setValue("waterPrice", latestBillInfo.waterPrice);
    }
  }, [latestBillInfo, form]);

  // Tính tổng tiền khi các giá trị thay đổi
  useEffect(() => {
    const values = form.getValues();
    const electricityUsage = values.electricityNew - values.electricityOld;
    const waterUsage = values.waterNew - values.waterOld;

    const electricityAmount = electricityUsage * values.electricityPrice;
    const waterAmount = waterUsage * values.waterPrice;

    const otherFeesTotal = otherFees.reduce((sum, fee) => sum + fee.amount, 0);

    const totalAmount = electricityAmount + waterAmount + otherFeesTotal;

    form.setValue("totalAmount", totalAmount);
  }, [
    form.watch("electricityOld"),
    form.watch("electricityNew"),
    form.watch("electricityPrice"),
    form.watch("waterOld"),
    form.watch("waterNew"),
    form.watch("waterPrice"),
    otherFees,
  ]);

  const handleAddOtherFee = () => {
    setOtherFees([...otherFees, { name: "", amount: 0 }]);
  };

  const handleRemoveOtherFee = (index: number) => {
    setOtherFees(otherFees.filter((_, i) => i !== index));
  };

  const handleOtherFeeChange = (
    index: number,
    field: keyof OtherFeeType,
    value: string | number
  ) => {
    const updatedFees = [...otherFees];
    if (field === "amount") {
      updatedFees[index][field] = Number(value);
    } else {
      updatedFees[index][field] = value as string;
    }
    setOtherFees(updatedFees);
  };

  // Handler cho việc chọn tháng hóa đơn
  const handleBillingMonthSelect = (date?: Date) => {
    if (date) {
      // Đảm bảo là ngày đầu tháng
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      form.setValue("billingMonth", firstDayOfMonth);
    } else {
      // Nếu không chọn ngày, sử dụng ngày đầu tháng hiện tại
      const currentDate = new Date();
      const firstDayOfCurrentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      form.setValue("billingMonth", firstDayOfCurrentMonth);
    }
  };

  const onSubmit = async (data: CreateRoomBillType) => {
    try {
      const submitData = {
        ...data,
        otherFees: otherFees.length > 0 ? otherFees : undefined,
      };

      console.log("Submitting bill data:", submitData);

      await createRoomBill(submitData);

      toast.success("Tạo hóa đơn thành công");
      onOpenChange(false);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tạo hóa đơn");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo hóa đơn mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin hóa đơn tiền phòng, điện, nước và các khoản phí khác
          </DialogDescription>
        </DialogHeader>

        {isLoadingTenant ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Đang tải thông tin phòng...</span>
          </div>
        ) : !isTenantAvailable ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Không thể tạo hóa đơn</AlertTitle>
            <AlertDescription>
              Phòng này chưa được cho thuê hoặc không có hợp đồng thuê đang hoạt
              động. Chỉ có thể tạo hóa đơn cho phòng đã có người thuê.
            </AlertDescription>
            <div className="mt-4 flex justify-end">
              <Button variant="default" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
            </div>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chỉ số điện */}
                <div className="space-y-4">
                  <h3 className="font-medium">Tiền điện</h3>
                  <FormField
                    control={form.control}
                    name="electricityOld"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Chỉ số cũ (kWh)
                          {isLoadingLatestBill && (
                            <RefreshCw className="ml-2 h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            value={field.value.toString()}
                            onChange={(e) => {
                              // Chỉ cho phép nhập số
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              field.onChange(value === "" ? "0" : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="electricityNew"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chỉ số mới (kWh)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            value={field.value.toString()}
                            onChange={(e) => {
                              // Chỉ cho phép nhập số
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              field.onChange(value === "" ? "0" : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="electricityPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đơn giá điện (VNĐ/kWh)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            value={field.value.toString()}
                            onChange={(e) => {
                              // Chỉ cho phép nhập số
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              field.onChange(value === "" ? "0" : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Chỉ số nước */}
                <div className="space-y-4">
                  <h3 className="font-medium">Tiền nước</h3>
                  <FormField
                    control={form.control}
                    name="waterOld"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Chỉ số cũ (m³)
                          {isLoadingLatestBill && (
                            <RefreshCw className="ml-2 h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            value={field.value.toString()}
                            onChange={(e) => {
                              // Chỉ cho phép nhập số
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              field.onChange(value === "" ? "0" : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="waterNew"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chỉ số mới (m³)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            value={field.value.toString()}
                            onChange={(e) => {
                              // Chỉ cho phép nhập số
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              field.onChange(value === "" ? "0" : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="waterPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đơn giá nước (VNĐ/m³)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            value={field.value.toString()}
                            onChange={(e) => {
                              // Chỉ cho phép nhập số
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              field.onChange(value === "" ? "0" : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Hiển thị thông tin người thuê nếu có */}
              {tenantInfoResponse?.tenant && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <h3 className="font-medium mb-2">Thông tin người thuê:</h3>
                  <p>Tên: {tenantInfoResponse.tenant.name}</p>
                  <p>Email: {tenantInfoResponse.tenant.email}</p>
                </div>
              )}

              {/* Thông báo về chỉ số cũ tự động */}
              {latestBillInfo && latestBillInfo.electricityNew > 0 && (
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="flex items-center text-green-700">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span className="font-medium">Thông tin tự động</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Chỉ số điện và nước cũ được tự động lấy từ hóa đơn gần nhất.
                  </p>
                </div>
              )}

              {/* Danh sách các khoản phí khác */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Các khoản phí khác</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOtherFee}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm phí
                  </Button>
                </div>

                {otherFees.map((fee, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-1">
                      <FormLabel>Tên phí</FormLabel>
                      <Input
                        value={fee.name}
                        onChange={(e) =>
                          handleOtherFeeChange(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <FormLabel>Số tiền (VNĐ)</FormLabel>
                      <Input
                        type="text"
                        value={fee.amount.toString()}
                        onChange={(e) => {
                          // Chỉ cho phép nhập số
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          handleOtherFeeChange(
                            index,
                            "amount",
                            value === "" ? 0 : Number(value)
                          );
                        }}
                      />
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOtherFee(index)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tháng hóa đơn và hạn thanh toán */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billingMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tháng hóa đơn</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onSelect={handleBillingMonthSelect}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hạn thanh toán</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Ghi chú */}
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tổng tiền */}
              <div className="flex justify-between items-center bg-muted p-3 rounded-md">
                <p className="font-medium">Tổng tiền:</p>
                <p className="text-xl font-bold">
                  {form
                    .watch("totalAmount")
                    .toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })
                    .replace("₫", "đ")}
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Tạo hóa đơn
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
