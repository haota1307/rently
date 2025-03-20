"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn, handleErrorApi } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { GoogleIcon } from "@/features/auth/components/google-icon";
import { LoginBodySchema, LoginBodyType } from "@/schemas/auth.schema";
import { useLoginMutation } from "@/features/auth/useAuth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/components/app-provider";
import { RoleIdToRole } from "@/constants/type";

const LoginForm = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) => {
  const router = useRouter();

  const setRole = useAppStore((state) => state.setRole);

  const form = useForm<LoginBodyType>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useLoginMutation();

  const onSubmit = async (data: LoginBodyType) => {
    if (loginMutation.isPending) return;

    try {
      const result = await loginMutation.mutateAsync(data);

      if (result) {
        const roleId = result?.payload?.user?.roleId;
        const role = RoleIdToRole[roleId];

        setRole(role);
      }

      toast.success("Đăng nhập thành công!");
      router.replace("/");
    } catch (error) {
      console.log({ error });
      handleErrorApi({
        error,
        setError: form.setError,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-6", className)}
        {...props}
        noValidate
        onSubmit={form.handleSubmit(onSubmit, (err) => console.log(err))}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Đăng nhập</h1>
          <p className="text-sm text-muted-foreground">
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
                    placeholder="******"
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

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              Hoặc đăng nhập bằng
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // Redirect đến endpoint Google login của backend
              window.location.href = "/api/auth/google";
            }}
          >
            <GoogleIcon />
            Đăng nhập với Google
          </Button>
        </div>
        <div className="text-center text-sm">
          Bạn chưa có tài khoản?{" "}
          <Link href="/dang-ky" className="underline underline-offset-4">
            Đăng ký
          </Link>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
