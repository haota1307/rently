"use client";

import { Skeleton } from "@/components/ui/skeleton";
import ResetPasswordForm from "@/features/auth/components/reset-password-form";
import ForgotPasswordForm from "@/features/auth/components/reset-password-form";
import SendOTPForm from "@/features/auth/components/send-otp-form";
import { House } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const ForgotPasswordPage = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 h-full w-full" />
        )}
        <Image
          src="/hero_img.jpg"
          alt="Sign up"
          fill
          className={`absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale transition-opacity duration-500 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

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
            {email ? (
              <ResetPasswordForm email={email} />
            ) : (
              <SendOTPForm onSuccess={(email) => setEmail(email)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
