"use client";

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { House } from "lucide-react";
import { useState } from "react";
import RegisterForm from "@/features/auth/components/register-form";

const RegisterPage = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

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
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
