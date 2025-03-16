"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { cn, handleErrorApi } from "@/lib/utils";
import Link from "next/link";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  RegisterBodySchema,
  RegisterBodyType,
} from "@/features/auth/schema/auth.schema";
import { GoogleIcon } from "@/features/auth/components/google-icon";
import {
  useRegisterMutation,
  useSendOTPCodeMutation,
} from "@/features/auth/useAuth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const RegisterForm = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) => {
  const router = useRouter();

  const form = useForm<RegisterBodyType>({
    resolver: zodResolver(RegisterBodySchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      code: "",
    },
  });

  const sendOtpMutation = useSendOTPCodeMutation();
  const registerMutation = useRegisterMutation();

  const handleSendOtp = async () => {
    if (sendOtpMutation.isPending) return;

    const emailValue = form.getValues("email");

    if (!emailValue) {
      toast.error("Vui lòng nhập email trước khi gửi mã OTP");
      return;
    }

    try {
      await sendOtpMutation.mutateAsync({
        email: emailValue,
        type: "REGISTER",
      });

      toast.success(`Mã OTP đã được gửi đến email ${emailValue}`);
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  const onSubmit = async (data: RegisterBodyType) => {
    if (registerMutation.isPending) return;

    try {
      await registerMutation.mutateAsync(data);

      toast.success("Đăng ký thành công!");
      router.replace("/dang-nhap");
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-4", className)}
        {...props}
        noValidate
        onSubmit={form.handleSubmit(onSubmit, (err) => {
          console.log(err);
        })}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Đăng ký</h1>
          <p className="text-sm text-muted-foreground">
            Nhập thông tin của bạn để tạo tài khoản mới
          </p>
        </div>

        <div className="grid gap-2.5">
          {/* Trường Họ Tên */}
          <FormField
            control={form.control}
            name="name"
            render={({ field, formState: { errors } }) => (
              <FormItem>
                <div className="grid gap-2">
                  <Label htmlFor="name">Họ và Tên</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    required
                    {...field}
                  />
                  <FormMessage>
                    {errors.name?.message && (
                      <span className="text-red-500 text-sm">
                        {errors.name.message}
                      </span>
                    )}
                  </FormMessage>
                </div>
              </FormItem>
            )}
          />

          {/* Trường Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field, formState: { errors } }) => (
              <FormItem>
                <div className="grid gap-x-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email">Email</Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handleSendOtp}
                      disabled={sendOtpMutation.isPending}
                      className="h-8 px-3 text-xs"
                    >
                      {sendOtpMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        "Gửi mã OTP"
                      )}
                    </Button>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@gmail.com"
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
                </div>
              </FormItem>
            )}
          />

          {/* Trường Mật khẩu */}
          <FormField
            control={form.control}
            name="password"
            render={({ field, formState: { errors } }) => (
              <FormItem>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    required
                    {...field}
                  />
                  <FormMessage>
                    {errors.password?.message && (
                      <span className="text-red-500 text-sm">
                        {errors.password.message}
                      </span>
                    )}
                  </FormMessage>
                </div>
              </FormItem>
            )}
          />

          {/* Trường Xác nhận Mật khẩu */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, formState: { errors } }) => (
              <FormItem>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Xác nhận Mật khẩu</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="********"
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
                </div>
              </FormItem>
            )}
          />

          {/* Trường Nhập mã OTP */}
          <FormField
            control={form.control}
            name="code"
            render={({ field, formState: { errors } }) => (
              <FormItem>
                <div className="grid gap-2">
                  <Label htmlFor="code">Mã OTP</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
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
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full mt-2">
            Đăng ký
          </Button>

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              Hoặc đăng ký bằng
            </span>
          </div>
          <Button variant="outline" className="w-full">
            <GoogleIcon />
            Đăng ký với Google
          </Button>
        </div>

        <div className="text-center text-sm">
          Bạn đã có tài khoản?{" "}
          <Link href="/dang-nhap" className="underline underline-offset-4">
            Đăng nhập
          </Link>
        </div>
      </form>
    </Form>
  );
};

export default RegisterForm;
