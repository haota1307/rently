"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  SendUserEmailSchema,
  SendUserEmailType,
} from "@/schemas/contact.schema";
import { useSendUserEmail } from "@/features/contact/contact.api";
import { toast } from "sonner";
import { handleErrorApi } from "@/lib/utils";
import { User } from "@/features/dashboard/components/columns/user-columns";
import { Mail, Send } from "lucide-react";

interface SendUserEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function SendUserEmailModal({
  isOpen,
  onClose,
  user,
}: SendUserEmailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SendUserEmailType>({
    resolver: zodResolver(SendUserEmailSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const sendEmailMutation = useSendUserEmail();

  const onSubmit = async (data: SendUserEmailType) => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendEmailMutation.mutateAsync({
        userId: user.id,
        data,
      });

      toast.success(`Gửi email thành công đến ${user.name}!`);
      form.reset();
      onClose();
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gửi email liên hệ
          </DialogTitle>
          {user && (
            <p className="text-sm text-muted-foreground">
              Gửi email đến: <strong>{user.name}</strong> ({user.email})
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
                  <Input
                    placeholder="Nhập tiêu đề email"
                    {...field}
                    disabled={isSubmitting}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung</FormLabel>
                  <Textarea
                    placeholder="Nhập nội dung email..."
                    className="min-h-[150px] resize-none"
                    {...field}
                    disabled={isSubmitting}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !user}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  "Đang gửi..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Gửi email
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
