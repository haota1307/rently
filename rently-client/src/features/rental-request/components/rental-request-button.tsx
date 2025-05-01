"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  CheckCircle,
  Wallet,
} from "lucide-react";
import { useCreateRentalRequest } from "@/features/rental-request/useRentalRequest";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Role } from "@/constants/type";
import { useAppStore } from "@/components/app-provider";
import { useGetPostDetail } from "@/features/post/usePost";
import { useAccountMe } from "@/features/profile/useProfile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateRentalRequestBodySchema } from "@/schemas/rental-request.schema";
import { z } from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

type RentalRequestButtonProps = {
  postId: number;
  isAvailable?: boolean;
  existingRequest?: boolean;
  className?: string;
};

export function RentalRequestButton({
  postId,
  isAvailable = true,
  existingRequest = false,
  className,
}: RentalRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { mutateAsync: createRentalRequest, isPending } =
    useCreateRentalRequest();
  const { isAuthenticated, userId } = useAuth();
  const role = useAppStore((state) => state.role);

  // Lấy thông tin chi tiết bài đăng để biết có yêu cầu đặt cọc hay không
  const { data: postDetail } = useGetPostDetail(postId);

  // Lấy thông tin tài khoản người dùng để kiểm tra số dư
  const { data: accountData } = useAccountMe();
  const userBalance = accountData?.payload?.balance || 0;

  const form = useForm<z.infer<typeof CreateRentalRequestBodySchema>>({
    resolver: zodResolver(CreateRentalRequestBodySchema),
    defaultValues: {
      postId,
      expectedMoveDate: new Date().toISOString(),
      duration: 6, // 6 tháng mặc định
      note: "",
    },
  });

  // Kiểm tra xem người dùng có phải là landlord hoặc admin không
  const isLandlordOrAdmin = role === Role.Landlord || role === Role.Admin;

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để gửi yêu cầu thuê");
      return;
    }

    if (isLandlordOrAdmin) {
      toast.error("Chủ nhà không thể gửi yêu cầu thuê");
      return;
    }

    if (existingRequest) {
      toast.error("Bạn đã có yêu cầu thuê cho bài đăng này");
      return;
    }

    if (!isAvailable) {
      toast.error("Phòng trọ này đã được thuê");
      return;
    }

    setIsOpen(true);
  };

  const onSubmit = async (
    values: z.infer<typeof CreateRentalRequestBodySchema>
  ) => {
    try {
      // Kiểm tra số dư tài khoản nếu bài đăng yêu cầu đặt cọc
      if (postDetail && postDetail.deposit && postDetail.deposit > 0) {
        if (userBalance < postDetail.deposit) {
          toast.error(
            `Số dư tài khoản không đủ để đặt cọc. Bạn cần nạp thêm ${new Intl.NumberFormat(
              "vi-VN",
              {
                style: "currency",
                currency: "VND",
              }
            ).format(postDetail.deposit - userBalance)} để tiếp tục.`
          );
          return;
        }
      }

      await createRentalRequest({
        ...values,
        postId,
      });
      toast.success("Yêu cầu thuê đã được gửi thành công!");
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating rental request:", error);
      // Hiển thị thông báo lỗi từ server
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          "Có lỗi xảy ra khi gửi yêu cầu thuê. Vui lòng thử lại sau."
        );
      }
    }
  };

  // Xác định trạng thái và thông báo của nút
  const getButtonState = () => {
    if (!isAuthenticated) {
      return {
        disabled: true,
        message: "Vui lòng đăng nhập để gửi yêu cầu thuê",
        icon: <AlertCircle className="h-4 w-4" />,
        variant: "outline" as const,
      };
    }

    if (isLandlordOrAdmin) {
      return {
        disabled: true,
        message: "Chủ nhà không thể gửi yêu cầu thuê",
        icon: <AlertCircle className="h-4 w-4" />,
        variant: "outline" as const,
      };
    }

    if (existingRequest) {
      return {
        disabled: true,
        message: "Bạn đã có yêu cầu thuê cho bài đăng này",
        icon: <CheckCircle className="h-4 w-4" />,
        variant: "secondary" as const,
        label: "Đã gửi yêu cầu thuê",
      };
    }

    if (!isAvailable) {
      return {
        disabled: true,
        message: "Phòng trọ này đã được thuê",
        icon: <AlertCircle className="h-4 w-4" />,
        variant: "outline" as const,
      };
    }

    return {
      disabled: false,
      message: "Gửi yêu cầu thuê phòng này",
      icon: <CalendarIcon className="h-4 w-4" />,
      variant: "secondary" as const,
      label: "Gửi yêu cầu thuê",
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="flex flex-col">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                onClick={handleClick}
                variant={buttonState.variant}
                className={cn("flex items-center gap-2", className)}
                disabled={buttonState.disabled}
              >
                {buttonState.icon}
                {buttonState.label || "Gửi yêu cầu thuê"}
              </Button>
            </div>
          </TooltipTrigger>
          {buttonState.disabled && (
            <TooltipContent>
              <p>{buttonState.message}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gửi yêu cầu thuê nhà</DialogTitle>
            <DialogDescription>
              Điền thông tin của bạn để gửi yêu cầu thuê nhà đến chủ nhà trọ
            </DialogDescription>
          </DialogHeader>

          {/* Thông tin số dư người dùng */}
          <div className="flex items-center justify-between mb-2 p-2 bg-background rounded-md">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Số dư của bạn:
              </span>
            </div>
            <span className="font-medium">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(userBalance)}
            </span>
          </div>

          {/* Hiển thị thông tin về tiền đặt cọc nếu có */}
          {postDetail && postDetail.deposit && postDetail.deposit > 0 && (
            <div className="mb-4 p-3 border border-amber-200 rounded-lg bg-amber-50">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Yêu cầu đặt cọc
                  </p>
                  <p className="text-xs text-amber-700">
                    Chủ nhà yêu cầu đặt cọc{" "}
                    <span className="font-semibold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(postDetail.deposit)}
                    </span>{" "}
                    khi thuê phòng này.
                  </p>

                  {/* Thêm cảnh báo nếu số dư không đủ */}
                  {userBalance < postDetail.deposit && (
                    <p className="mt-1 text-xs font-medium text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Số dư của bạn không đủ để đặt cọc. Vui lòng nạp thêm tiền.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="expectedMoveDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày dự kiến chuyển vào</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
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
                          selected={new Date(field.value)}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date.toISOString());
                            }
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Ngày bạn dự kiến sẽ chuyển vào phòng trọ
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hiển thị thông tin về tiền đặt cọc trong trường dự kiến thuê */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dự kiến thời gian thuê (tháng)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Nhập số tháng dự kiến thuê"
                        min={1}
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </FormControl>
                    {postDetail &&
                      postDetail.deposit &&
                      postDetail.deposit > 0 && (
                        <FormDescription className="text-amber-600">
                          Sẽ yêu cầu đặt cọc{" "}
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(postDetail.deposit)}
                        </FormDescription>
                      )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập các yêu cầu hoặc thông tin bổ sung"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Thông tin thêm hoặc yêu cầu đặc biệt của bạn
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isPending ||
                    !!(
                      postDetail &&
                      postDetail.deposit &&
                      postDetail.deposit > 0 &&
                      userBalance < postDetail.deposit
                    )
                  }
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {postDetail &&
                  postDetail.deposit &&
                  postDetail.deposit > 0 &&
                  userBalance < postDetail.deposit
                    ? "Không đủ tiền đặt cọc"
                    : "Gửi yêu cầu"}
                </Button>
              </DialogFooter>
            </form>
          </Form>

          {/* Hiển thị nút nạp tiền nếu số dư không đủ */}
          {postDetail &&
            postDetail.deposit &&
            postDetail.deposit > 0 &&
            userBalance < postDetail.deposit && (
              <div className="pt-2 border-t mt-2">
                <Link href="/nap-tien">
                  <Button
                    variant="secondary"
                    className="w-full flex items-center gap-2"
                  >
                    <Wallet className="h-4 w-4" />
                    Nạp tiền ngay
                  </Button>
                </Link>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
