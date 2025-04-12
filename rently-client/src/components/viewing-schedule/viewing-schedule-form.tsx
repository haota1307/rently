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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useViewingSchedule } from "@/features/viewing-schedule/useViewingSchedule";

const formSchema = z.object({
  viewingDate: z.date({
    required_error: "Vui lòng chọn ngày xem phòng",
  }),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ViewingScheduleFormProps {
  postId: number;
}

export function ViewingScheduleForm({ postId }: ViewingScheduleFormProps) {
  const { createViewingSchedule } = useViewingSchedule();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    createViewingSchedule.mutate({
      postId,
      viewingDate: values.viewingDate.toISOString(),
      note: values.note,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="viewingDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
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
          disabled={createViewingSchedule.isPending}
        >
          Đặt lịch xem phòng
        </Button>
      </form>
    </Form>
  );
}
