"use client";

import { useState } from "react";
import Image from "next/image";
import { House } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SignInForm from "@/features/auth/components/login-form";

const SignInPage = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
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
          onLoadingComplete={() => setImageLoaded(true)}
        />
      </div>
    </div>
  );
};

export default SignInPage;
