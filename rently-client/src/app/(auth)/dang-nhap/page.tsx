"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { House } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SignInForm from "@/features/auth/components/login-form";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Component riêng để xử lý Search Params
function HandleSearchParams() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Kiểm tra nếu có tham số blocked=true trong URL
    const blocked = searchParams.get("blocked");
    if (blocked === "true") {
      toast.error("Tài khoản của bạn đã bị khóa", {
        description:
          "Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.",
        duration: 8000,
      });
    }
  }, [searchParams]);

  return null;
}

const SignInPage = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Sử dụng Suspense để bọc component sử dụng useSearchParams */}
      <Suspense fallback={null}>
        <HandleSearchParams />
      </Suspense>

      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <House className="size-4" />
            </div>
            Rently
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 h-full w-full" />
        )}
        <Image
          src="/placeholder.svg"
          alt="Sign up"
          fill
          className={`absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale transition-opacity duration-500 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
        />
      </div>
    </div>
  );
};

export default SignInPage;
