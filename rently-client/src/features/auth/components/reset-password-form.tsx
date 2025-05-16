"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForgotPasswordMutation } from "@/features/auth/useAuth";
import { handleErrorApi } from "@/lib/utils";

const ResetPasswordSchema = z
  .object({
    code: z.string().length(6, "Mã xác thực phải đúng 6 ký tự"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z
      .string()
      .min(6, "Mật khẩu xác nhận phải có ít nhất 6 ký tự"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"],
      });
    }
  });

export type ResetPasswordBodyType = z.infer<typeof ResetPasswordSchema>;

interface ResetPasswordFormProps {
  email: string;
}

const ResetPasswordForm = ({ email }: ResetPasswordFormProps) => {
  const router = useRouter();
  const { mutateAsync: forgotPassword, isPending } =
    useForgotPasswordMutation();

  const form = useForm<ResetPasswordBodyType>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordBodyType) => {
    try {
      await forgotPassword({ email, ...data });
      toast.success("Đặt lại mật khẩu thành công!");
      router.push("/dang-nhap");
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
          <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
          <p className="text-sm text-muted-foreground">
            Nhập mã OTP và mật khẩu mới cho email <strong>{email}</strong>.
          </p>
        </div>
        <FormField
          control={form.control}
          name="code"
          render={({ field, formState: { errors } }) => (
            <FormItem>
              <Label htmlFor="code">Mã OTP</Label>
              <Input
                id="code"
                type="text"
                placeholder="Nhập mã OTP"
                required
                {...field}
              />
              <FormMessage>
                {errors.code?.message && (
                  <span className="text-red-500 text-sm">
                    {errors.code.message}
                  </span>
                )}
              </FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field, formState: { errors } }) => (
            <FormItem>
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Nhập mật khẩu mới"
                required
                {...field}
              />
              <FormMessage>
                {errors.newPassword?.message && (
                  <span className="text-red-500 text-sm">
                    {errors.newPassword.message}
                  </span>
                )}
              </FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field, formState: { errors } }) => (
            <FormItem>
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                required
                {...field}
              />
              <FormMessage>
                {errors.confirmPassword?.message && (
                  <span className="text-red-500 text-sm">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </FormMessage>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full mt-2" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Đang xử lý...
            </>
          ) : (
            "Đặt lại mật khẩu"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ResetPasswordForm;
