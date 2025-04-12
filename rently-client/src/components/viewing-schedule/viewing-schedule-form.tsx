import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, set } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { useViewingSchedule } from "@/features/viewing-schedule/useViewingSchedule";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";

const formSchema = z.object({
  viewingDate: z.date({
    required_error: "Vui lòng chọn ngày xem phòng",
  }),
  viewingTime: z.string({
    required_error: "Vui lòng chọn giờ xem phòng",
  }),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Tạo các mốc giờ từ 8:00 đến 17:00
const timeSlots = Array.from({ length: 19 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = (i % 2) * 30;
  return {
    value: `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`,
    label: `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`,
  };
});

interface ViewingScheduleFormProps {
  postId: number;
  onSuccess?: () => void;
}

export function ViewingScheduleForm({
  postId,
  onSuccess,
}: ViewingScheduleFormProps) {
  const { createViewingSchedule, getViewingSchedules } = useViewingSchedule();
  const [error, setError] = useState<string | null>(null);
  const [isCheckingExistingSchedule, setIsCheckingExistingSchedule] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lấy danh sách lịch xem hiện tại của người dùng cho phòng trọ này
  const { data: schedules } = getViewingSchedules({
    page: 1,
    limit: 10,
    status: "PENDING", // Chỉ lấy trạng thái PENDING
  });

  // Kiểm tra xem người dùng đã có lịch hẹn chưa bị hủy cho phòng này chưa
  useEffect(() => {
    if (schedules?.data) {
      const existingSchedule = schedules.data.find(
        (schedule) =>
          schedule.post.id === postId && schedule.status !== "REJECTED"
      );

      if (existingSchedule) {
        setError(
          "Bạn đã có lịch hẹn xem phòng này. Vui lòng hủy lịch cũ trước khi đặt lịch mới."
        );
      } else {
        setError(null);
      }
    }
  }, [schedules, postId]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setSubmitting(true);
      // Kết hợp ngày và giờ
      const [hours, minutes] = values.viewingTime.split(":").map(Number);
      const dateWithTime = set(values.viewingDate, {
        hours,
        minutes,
        seconds: 0,
        milliseconds: 0,
      });

      await createViewingSchedule.mutateAsync({
        postId,
        viewingDate: dateWithTime.toISOString(),
        note: values.note,
      });

      toast.success("Đặt lịch xem phòng thành công!");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Nếu đang kiểm tra hoặc đã có lịch, hiển thị thông báo
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Không thể đặt lịch</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormField
              control={form.control}
              name="viewingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày xem phòng</FormLabel>
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
                            format(field.value, "PPP", { locale: vi })
                          ) : (
                            <span>Chọn ngày xem phòng</span>
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
                          date < new Date() ||
                          date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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

          <div>
            <FormField
              control={form.control}
              name="viewingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giờ xem phòng</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giờ xem phòng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nhập ghi chú (nếu có)"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={
            createViewingSchedule.isPending ||
            isCheckingExistingSchedule ||
            submitting
          }
        >
          Đặt lịch xem phòng
        </Button>
      </form>
    </Form>
  );
}
