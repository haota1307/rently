"use client";

import { checkAndRefreshToken } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Những page sẽ không check refresh token
const UNAUTHENTICATED_PATH = [
  "/dang-nhap",
  "/dang-xuat",
  "/refresh-token",
  "/dang-ky",
];

export default function RefreshToken() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathname)) return;
    let interval: any = null;
    const onRefreshToken = (force?: boolean) =>
      checkAndRefreshToken({
        onError: () => {
          clearInterval(interval);
          router.push("/dang-nhap");
        },
        force,
      });

    onRefreshToken();
  }, [pathname, router]);

  return null;
}
