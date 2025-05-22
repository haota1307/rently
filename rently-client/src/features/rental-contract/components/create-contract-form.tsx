import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateContractFormValues,
  createContractSchema,
} from "../contract.schema";
import { Button } from "@/components/ui/button";
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
import { CalendarIcon, Home, User } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import contractApiRequest from "../contract.api";
import rentalRequestApiRequest from "@/features/rental-request/rental-request.api";
import {
  RentalRequestDetailType,
  RentalRequestStatus,
} from "@/schemas/rental-request.schema";
import { Card, CardContent } from "@/components/ui/card";

interface CreateContractFormProps {
  onSuccess: () => void;
}

export function CreateContractForm({ onSuccess }: CreateContractFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [rentalRequests, setRentalRequests] = useState<
    RentalRequestDetailType[]
  >([]);
  const [selectedRequest, setSelectedRequest] =
    useState<RentalRequestDetailType | null>(null);

  const form = useForm<CreateContractFormValues>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      monthlyRent: 0,
      deposit: 0,
      paymentDueDate: 1,
    },
  });

  // Fetch danh sách yêu cầu thuê khi component được load
  useEffect(() => {
    const fetchRentalRequests = async () => {
      try {
        setLoadingRequests(true);
        const response = await rentalRequestApiRequest.list({
          status: RentalRequestStatus.APPROVED,
          page: 1,
          limit: 50,
        });

        // Chỉ lấy những yêu cầu đã được chấp nhận và chưa có hợp đồng
        const eligibleRequests = response.data.filter(
          (req: RentalRequestDetailType) =>
            req.status === RentalRequestStatus.APPROVED && !req.contractSigned
        );

        setRentalRequests(eligibleRequests);
      } catch (error) {
        console.error("Lỗi khi tải danh sách yêu cầu thuê:", error);
        toast.error("Không thể tải danh sách yêu cầu thuê");
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRentalRequests();
  }, []);

  // Xử lý khi chọn yêu cầu thuê
  const handleRentalRequestChange = async (requestId: string) => {
    try {
      const id = parseInt(requestId, 10);
      // Tìm yêu cầu từ danh sách đã tải
      const request = rentalRequests.find((req) => req.id === id);

      if (request) {
        setSelectedRequest(request);

        // Tự động điền thông tin từ yêu cầu thuê
        form.setValue("rentalRequestId", id);

        // Điền giá thuê từ thông tin phòng
        if (request.post.price) {
          form.setValue("monthlyRent", request.post.price);
        }

        // Điền tiền cọc (thường là 1-2 tháng tiền thuê)
        if (request.depositAmount) {
          form.setValue("deposit", request.depositAmount);
        } else if (request.post.price) {
          form.setValue("deposit", request.post.price);
        }

        // Điền ngày bắt đầu theo ngày chuyển đến dự kiến
        const moveDate = new Date(request.expectedMoveDate);
        form.setValue("startDate", moveDate);

        // Điền ngày kết thúc theo thời hạn
        const endDate = new Date(moveDate);
        endDate.setMonth(endDate.getMonth() + request.duration);
        form.setValue("endDate", endDate);
      }
    } catch (error) {
      console.error("Lỗi khi chọn yêu cầu thuê:", error);
      toast.error("Không thể tải thông tin yêu cầu thuê");
    }
  };

  const onSubmit = async (data: CreateContractFormValues) => {
    setLoading(true);
    try {
      // Convert dates to ISO strings for API
      const apiData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      };

      await contractApiRequest.create(apiData);
      toast.success("Tạo hợp đồng thành công");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.payload?.message || "Có lỗi xảy ra khi tạo hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rentalRequestId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yêu cầu thuê</FormLabel>
              <FormControl>
                <Select
                  disabled={loadingRequests}
                  onValueChange={(value) => {
                    field.onChange(parseInt(value, 10));
                    handleRentalRequestChange(value);
                  }}
                  value={field.value ? String(field.value) : undefined}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loadingRequests ? "Đang tải..." : "Chọn yêu cầu thuê"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {rentalRequests.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Không có yêu cầu thuê nào
                      </SelectItem>
                    ) : (
                      rentalRequests.map((request) => (
                        <SelectItem key={request.id} value={String(request.id)}>
                          {`#${request.id} - ${request.post.title} - ${request.tenant.name}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedRequest && (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium flex items-center">
                    <Home className="mr-2 h-4 w-4" /> Thông tin phòng
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tên: {selectedRequest.post.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Địa chỉ: {selectedRequest.post.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Giá: {formatPrice(selectedRequest.post.price || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Diện tích: {selectedRequest.post.area} m²
                  </p>
                </div>
                <div>
                  <h3 className="font-medium flex items-center">
                    <User className="mr-2 h-4 w-4" /> Thông tin người thuê
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tên: {selectedRequest.tenant.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Email: {selectedRequest.tenant.email}
                  </p>
                  {selectedRequest.tenant.phoneNumber && (
                    <p className="text-sm text-muted-foreground">
                      Điện thoại: {selectedRequest.tenant.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          format(field.value, "dd/MM/yyyy", { locale: vi })
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
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
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
                          format(field.value, "dd/MM/yyyy", { locale: vi })
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
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date <= form.getValues("startDate")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="monthlyRent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giá thuê hàng tháng (VNĐ)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiền đặt cọc (VNĐ)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="paymentDueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ngày thanh toán hàng tháng</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  min={1}
                  max={31}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormDescription>
                Ngày hàng tháng mà người thuê cần thanh toán tiền thuê (1-31)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo hợp đồng"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
