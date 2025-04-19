"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useCreateRentalRequest } from "@/features/rental-request/useRentalRequest";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Role } from "@/constants/type";
import { useAppStore } from "@/components/app-provider";
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gửi yêu cầu thuê phòng</DialogTitle>
            <DialogDescription>
              Điền thông tin để gửi yêu cầu thuê phòng trọ này
            </DialogDescription>
          </DialogHeader>

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
                          onSelect={(date: Date | undefined) => {
                            if (date) field.onChange(date.toISOString());
                          }}
                          disabled={(date: Date) => date < new Date()}
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

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời hạn thuê (tháng)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Nhập số tháng dự kiến thuê"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Thời gian bạn dự kiến sẽ thuê phòng này
                    </FormDescription>
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
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Gửi yêu cầu
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
