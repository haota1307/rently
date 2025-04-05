import { useEffect, useState } from "react";
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
import { useUpdateAmenity } from "@/features/amenity/useAmenity";
import { toast } from "sonner";
import { UpdateAmenityBodySchema, AmenityType } from "@/schemas/amenity.schema";

type FormValues = z.infer<typeof UpdateAmenityBodySchema>;

interface EditAmenityModalProps {
  isOpen: boolean;
  onClose: () => void;
  amenity: AmenityType | null;
}

export function EditAmenityModal({
  isOpen,
  onClose,
  amenity,
}: EditAmenityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateAmenityMutation = useUpdateAmenity();

  const form = useForm<FormValues>({
    resolver: zodResolver(UpdateAmenityBodySchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (amenity) {
      form.reset({
        name: amenity.name,
      });
    }
  }, [amenity, form]);

  const onSubmit = async (values: FormValues) => {
    if (!amenity) return;

    try {
      setIsSubmitting(true);
      await updateAmenityMutation.mutateAsync({
        amenityId: amenity.id,
        body: values,
      });
      toast.success("Cập nhật tiện ích thành công");
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
        toast.error("Cập nhật tiện ích thất bại");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tiện ích</DialogTitle>
          <DialogDescription>
            Chỉnh sửa thông tin tiện ích trong hệ thống.
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
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
