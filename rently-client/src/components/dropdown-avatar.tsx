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
import { useAccountMe } from "@/features/users/useAccount";

export default function DropdownAvatar() {
  const router = useRouter();

  const storeUser = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const setRole = useAppStore((state) => state.setRole);

  const enableCallApi = !!storeUser;

  const { data } = useAccountMe(enableCallApi);

  useEffect(() => {
    if (!storeUser && data?.payload) {
      setUser(data.payload);
    }
  }, [storeUser, data, setUser]);

  const user = storeUser || data?.payload;

  const refreshToken = getRefreshTokenFromLocalStorage();
  const logoutMutation = useLogoutMutation();

  const logout = async () => {
    if (logoutMutation.isPending || !refreshToken) return;
    try {
      await logoutMutation.mutateAsync({ refreshToken });

      setRole(undefined);
      setUser(undefined);

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
          <Link href="/manage/setting" className="cursor-pointer">
            Cài đặt
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>Hỗ trợ</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>Đăng xuất</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
