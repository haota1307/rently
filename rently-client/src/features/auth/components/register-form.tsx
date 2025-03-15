"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  RegisterBodySchema,
  RegisterBodyType,
} from "@/features/auth/schema/auth.schema";
import { GoogleIcon } from "@/features/auth/components/google-icon";

const RegisterForm = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) => {
  const form = useForm<RegisterBodyType>({
    resolver: zodResolver(RegisterBodySchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterBodyType) => {
    // Khi nhấn submit, React Hook Form sẽ validate với Zod schema
    console.log({ data });
  };

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-6", className)}
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
        <div className="grid gap-4">
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

          <FormField
            control={form.control}
            name="email"
            render={({ field, formState: { errors } }) => (
              <FormItem>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
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

          <Button type="submit" className="w-full">
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
