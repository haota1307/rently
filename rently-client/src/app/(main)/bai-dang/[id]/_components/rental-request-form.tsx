import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateRentalRequestBodySchema } from "@/schemas/rental-request.schema";
import { useCreateRentalRequest } from "@/features/rental-request/useRentalRequest";
import { useAccountMe } from "@/features/profile/useProfile";
import { useGetPostDetail } from "@/features/post/usePost";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wallet, AlertCircle, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";

interface RentalRequestFormProps {
  postId: number;
}

export function RentalRequestForm({ postId }: RentalRequestFormProps) {
  const { mutateAsync: createRentalRequest, isPending } =
    useCreateRentalRequest();

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
      form.reset();
    } catch (error) {
      console.error("Error creating rental request:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          "Có lỗi xảy ra khi gửi yêu cầu thuê. Vui lòng thử lại sau."
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Thông tin số dư người dùng */}
      <div className="flex items-center justify-between p-2 bg-background rounded-md">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs sm:text-sm text-muted-foreground">
            Số dư của bạn:
          </span>
        </div>
        <span className="font-medium text-xs sm:text-sm">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(userBalance)}
        </span>
      </div>

      {/* Hiển thị thông tin về tiền đặt cọc nếu có */}
      {postDetail && postDetail.deposit && postDetail.deposit > 0 && (
        <div className="p-3 border border-amber-200 rounded-lg bg-amber-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-amber-800">
                Yêu cầu đặt cọc
              </p>
              <p className="text-[10px] sm:text-xs text-amber-700">
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
                <p className="mt-1 text-[10px] sm:text-xs font-medium text-red-600 flex items-center gap-1">
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
                <FormLabel className="text-xs sm:text-sm">
                  Ngày dự kiến chuyển vào
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal text-xs sm:text-sm h-8 sm:h-9",
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
                        <Calendar className="ml-auto h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarUI
                      mode="single"
                      selected={new Date(field.value)}
                      onSelect={(date: Date | undefined) => {
                        if (date) {
                          field.onChange(date.toISOString());
                        }
                      }}
                      disabled={(date: Date) => {
                        return date < new Date();
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription className="text-[10px] sm:text-xs">
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
                <FormLabel className="text-xs sm:text-sm">
                  Dự kiến thời gian thuê (tháng)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Nhập số tháng dự kiến thuê"
                    min={1}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                {postDetail && postDetail.deposit && postDetail.deposit > 0 && (
                  <FormDescription className="text-amber-600 text-[10px] sm:text-xs">
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
                <FormLabel className="text-xs sm:text-sm">Ghi chú</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Nhập các yêu cầu hoặc thông tin bổ sung"
                    className="resize-none text-xs sm:text-sm min-h-20"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[10px] sm:text-xs">
                  Thông tin thêm hoặc yêu cầu đặc biệt của bạn
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full text-xs sm:text-sm"
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
              <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            )}
            {postDetail &&
            postDetail.deposit &&
            postDetail.deposit > 0 &&
            userBalance < postDetail.deposit
              ? "Không đủ tiền đặt cọc"
              : "Gửi yêu cầu thuê"}
          </Button>
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
                className="w-full flex items-center gap-2 text-xs sm:text-sm"
              >
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                Nạp tiền ngay
              </Button>
            </Link>
          </div>
        )}
    </div>
  );
}
