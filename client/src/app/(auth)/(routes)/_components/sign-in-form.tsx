"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInBody, SignInBodyType } from "@/schemas/auth.schema";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import GoogleIcon from "@/app/(auth)/(routes)/_components/google-icon";
import Link from "next/link";

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
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Đăng nhập</h1>
        <p className=" text-sm text-muted-foreground">
          Nhập email và mật khẩu của bạn vào bên dưới để tiếp tục
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@gmail.com" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Mật khẩu</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Quên mật khẩu?
            </a>
          </div>
          <Input id="password" type="password" required />
        </div>
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
  );
};

export default SignInForm;
