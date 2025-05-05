"use client";

import {
  checkAndRefreshToken,
  getRefreshTokenFromLocalStorage,
} from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";

// Component riêng để xử lý refresh token với search params
function RefreshTokenHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refreshTokenFromUrl = searchParams.get("refreshToken");
  const redirectPathname = searchParams.get("redirect");

  useEffect(() => {
    if (
      refreshTokenFromUrl &&
      refreshTokenFromUrl === getRefreshTokenFromLocalStorage()
    ) {
      checkAndRefreshToken({
        onSuccess: () => {
          router.push(redirectPathname || "/");
        },
      });
    } else {
      toast.error('Ô token hết hạn ở "refresh-token page"');
      router.push("/dang-nhap");
    }
  }, [router, refreshTokenFromUrl, redirectPathname]);

  return null;
}

export default function RefreshTokenPage() {
  return (
    <div>
      <Suspense fallback={<div>Đang tải...</div>}>
        <RefreshTokenHandler />
      </Suspense>
    </div>
  );
}
