"use client";

import { useAppStore } from "@/components/app-provider";
import { RoleIdToRole } from "@/constants/type";
import { useSetTokenToCookieMutation } from "@/features/auth/useAuth";
import {
  decodeAccessToken,
  setAccessTokenToLocalStorage,
  setRefreshTokenToLocalStorage,
} from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function OAuthPage() {
  const setRole = useAppStore((state) => state.setRole);
  const { mutateAsync } = useSetTokenToCookieMutation();

  const router = useRouter();
  const searchParams = useSearchParams();

  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  const error = searchParams.get("error");
  const blocked = searchParams.get("blocked") === "true";

  const count = useRef(0);

  useEffect(() => {
    console.log("[DEBUG] OAuth callback params:", {
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
      error,
      blocked,
      blockedRaw: searchParams.get("blocked"),
    });

    if (accessToken && refreshToken) {
      if (count.current === 0) {
        const { roleId } = decodeAccessToken(accessToken);
        const role = RoleIdToRole[roleId];

        setRole(role);
        setAccessTokenToLocalStorage(accessToken);
        setRefreshTokenToLocalStorage(refreshToken);
        mutateAsync({ accessToken, refreshToken })
          .then(() => {
            setRole(role);
            router.push("/");
          })
          .catch((e) => {
            toast.error("Đăng nhập thất bại");
          });
        count.current++;
      }
    } else {
      // Xử lý trường hợp tài khoản bị khóa
      if (blocked || searchParams.get("blocked") === "true") {
        console.log("[DEBUG] Account is blocked, showing notification");
        toast.error("Tài khoản của bạn đã bị khóa", {
          description:
            "Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.",
          duration: 8000,
        });
        setTimeout(() => {
          router.push("/dang-nhap");
        }, 1000);
      } else if (error) {
        toast.error(error || "Đăng nhập thất bại");
        setTimeout(() => {
          router.push("/dang-nhap");
        }, 1000);
      } else {
        toast.error("Đăng nhập thất bại");
        setTimeout(() => {
          router.push("/dang-nhap");
        }, 1000);
      }
    }
  }, [accessToken, refreshToken, setRole, router, error, blocked, mutateAsync]);

  return <div />;
}
