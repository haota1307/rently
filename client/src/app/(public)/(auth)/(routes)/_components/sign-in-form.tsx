"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInBody, SignInBodyType } from "@/schemas/auth.schema";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import GoogleIcon from "@/app/(public)/(auth)/(routes)/_components/google-icon";
import Link from "next/link";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";

const SignInForm = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) => {
  const form = useForm<SignInBodyType>({
    resolver: zodResolver(SignInBody),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInBodyType) => {
    // Khi nhấn submit thì React hook form sẽ validate cái form bằng zod schema ở client trước
    // Nếu không pass qua vòng này thì sẽ không gọi api
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
          <h1 className="text-2xl font-bold">Đăng nhập</h1>
          <p className=" text-sm text-muted-foreground">
            Nhập email và mật khẩu của bạn vào bên dưới để tiếp tục
          </p>
        </div>
        <div className="grid gap-6">
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
                  <FormMessage>{/**TODO: Hiển thị lỗi */}</FormMessage>
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
                  <div className="flex items-center">
                    <Label htmlFor="password">Mật khẩu</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="******"
                    required
                    {...field}
                  />
                  <FormMessage>{/**TODO: Hiển thị lỗi */}</FormMessage>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Đăng nhập
          </Button>
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              Hoặc đăng nhập bằng
            </span>
          </div>
          <Button variant="outline" className="w-full">
            <GoogleIcon />
            Đăng nhập với Google
          </Button>
        </div>
        <div className="text-center text-sm">
          Bạn chưa có tài khoản?{" "}
          <Link href="/sign-up" className="underline underline-offset-4">
            Đăng ký
          </Link>
        </div>
      </form>
    </Form>
  );
};

export default SignInForm;
