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
  const message = searchParams.get("message");

  const count = useRef(0);

  useEffect(() => {
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
      console.log(message);
      toast.error("Đăng nhập thất bại");
    }
  }, [accessToken, refreshToken, setRole, router, message, mutateAsync]);

  return <div />;
}
