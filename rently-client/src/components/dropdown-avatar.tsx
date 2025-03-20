"use client";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getRefreshTokenFromLocalStorage, handleErrorApi } from "@/lib/utils";
import { useAppStore } from "@/components/app-provider";
import { useLogoutMutation } from "@/features/auth/useAuth";
import { useAccountMe } from "@/features/profile/useProfile";

export default function DropdownAvatar() {
  const router = useRouter();
  const setRole = useAppStore((state) => state.setRole);

  const { data } = useAccountMe();

  const user = data?.payload;

  const refreshToken = getRefreshTokenFromLocalStorage();
  const logoutMutation = useLogoutMutation();

  const logout = async () => {
    if (logoutMutation.isPending || !refreshToken) return;
    try {
      await logoutMutation.mutateAsync({ refreshToken });

      setRole(undefined);

      toast.success("Đăng xuất thành công!");
      router.push("/");
    } catch (error: any) {
      handleErrorApi({ error });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full"
        >
          <Avatar>
            <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
            <AvatarFallback>
              {user?.name ? user.name.slice(0, 1).toUpperCase() : ""}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/tai-khoan" className="cursor-pointer">
            Thông tin cá nhân
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/tai-khoan/quen-mat-khau" className="cursor-pointer">
            Quên mật khẩu
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={logout}>
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
