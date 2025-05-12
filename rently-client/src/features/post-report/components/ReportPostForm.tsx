import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CreatePostReportSchema,
  CreatePostReportType,
} from "@/schemas/post-report.schema";
import { useCreatePostReport } from "../usePostReport";

interface ReportPostFormProps {
  postId: number;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function ReportPostForm({
  postId,
  trigger,
  onSuccess,
}: ReportPostFormProps) {
  const [open, setOpen] = useState(false);
  const { mutate: createPostReport, isPending } = useCreatePostReport();

  const form = useForm<CreatePostReportType>({
    resolver: zodResolver(CreatePostReportSchema),
    defaultValues: {
      reason: "",
      description: "",
      postId,
    },
  });

  function onSubmit(data: CreatePostReportType) {
    createPostReport(data, {
      onSuccess: () => {
        toast.success("Báo cáo đã được gửi thành công");
        setOpen(false);
        form.reset();
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(
          error.message ||
            "Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại sau."
        );
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Báo cáo bài đăng</DialogTitle>
          <DialogDescription>
            Vui lòng cung cấp thông tin chi tiết về vấn đề với bài đăng này
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-2"
          >
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do báo cáo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập lý do báo cáo" {...field} />
                  </FormControl>
                  <FormDescription>
                    Tóm tắt ngắn gọn lý do báo cáo bài đăng này
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả chi tiết</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả chi tiết về vấn đề với bài đăng này"
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Cung cấp thông tin chi tiết giúp chúng tôi hiểu vấn đề tốt
                    hơn
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                type="button"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang gửi..." : "Gửi báo cáo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
