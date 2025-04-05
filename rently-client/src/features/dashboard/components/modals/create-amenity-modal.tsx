import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateAmenity } from "@/features/amenity/useAmenity";
import { toast } from "sonner";
import { CreateAmenityBodySchema } from "@/schemas/amenity.schema";

type FormValues = z.infer<typeof CreateAmenityBodySchema>;

interface CreateAmenityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAmenityModal({
  isOpen,
  onClose,
}: CreateAmenityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createAmenityMutation = useCreateAmenity();

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateAmenityBodySchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      await createAmenityMutation.mutateAsync(values);
      toast.success("Thêm tiện ích thành công");
      form.reset();
      onClose();
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
        toast.error("Thêm tiện ích thất bại");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm tiện ích mới</DialogTitle>
          <DialogDescription>
            Vui lòng nhập thông tin tiện ích bạn muốn thêm vào hệ thống.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên tiện ích</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên tiện ích" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang thêm..." : "Thêm tiện ích"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
