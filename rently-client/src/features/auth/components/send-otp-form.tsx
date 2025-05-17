"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useSendOTPCodeMutation } from "@/features/auth/useAuth";
import { handleErrorApi } from "@/lib/utils";

const SendOTPSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export type SendOTPBodyType = z.infer<typeof SendOTPSchema>;

interface SendOTPFormProps {
  onSuccess: (email: string) => void;
}

const SendOTPForm = ({ onSuccess }: SendOTPFormProps) => {
  const { mutateAsync: sendOTP, isPending } = useSendOTPCodeMutation();

  const form = useForm<SendOTPBodyType>({
    resolver: zodResolver(SendOTPSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: SendOTPBodyType) => {
    try {
      await sendOTP({ email: data.email, type: "FORGOT_PASSWORD" });
      toast.success(`Mã OTP đã được gửi đến email ${data.email}`);
      onSuccess(data.email);
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
          <p className="text-sm text-muted-foreground">
            Nhập email của bạn để nhận mã OTP đặt lại mật khẩu.
          </p>
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field, formState: { errors } }) => (
            <FormItem>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                required
                {...field}
              />
              <FormMessage>
                {errors.email?.message && (
                  <span className="text-red-500 text-sm">
                    {errors.email.message}
                  </span>
                )}
              </FormMessage>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Đang gửi...
            </>
          ) : (
            "Gửi mã OTP"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default SendOTPForm;
