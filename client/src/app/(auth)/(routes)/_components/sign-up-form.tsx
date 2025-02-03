"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpBody, SignUpBodyType } from "@/schemas/auth.schema"; // Tạo schema SignUpBody
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import GoogleIcon from "@/app/(auth)/(routes)/_components/google-icon";
import Link from "next/link";

const SignUpForm = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) => {
  const form = useForm<SignUpBodyType>({
    resolver: zodResolver(SignUpBody),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Đăng ký</h1>
        <p className=" text-sm text-muted-foreground">
          Nhập thông tin của bạn để tạo tài khoản mới
        </p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Họ và Tên</Label>
          <Input id="name" type="text" placeholder="Nguyễn Văn A" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@gmail.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Xác nhận Mật khẩu</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="********"
            required
          />
        </div>
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
        <Link href="/sign-in" className="underline underline-offset-4">
          Đăng nhập
        </Link>
      </div>
    </form>
  );
};

export default SignUpForm;
