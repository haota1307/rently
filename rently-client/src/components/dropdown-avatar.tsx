"use client";
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

import { getRefreshTokenFromLocalStorage, handleErrorApi } from "@/lib/utils";

import { useAppStore } from "@/components/app-provider";
import { useRouter } from "next/navigation";
import { useLogoutMutation } from "@/features/auth/useAuth";
import Link from "next/link";
import { toast } from "sonner";

export default function DropdownAvatar() {
  const router = useRouter();

  const { user, role } = useAppStore();
  const setRole = useAppStore((state) => state.setRole);
  const setUser = useAppStore((state) => state.setUser);

  const refreshToken = getRefreshTokenFromLocalStorage();

  const logoutMutation = useLogoutMutation();

  console.log(user, role);

  const logout = async () => {
    if (logoutMutation.isPending || !refreshToken) return;
    try {
      await logoutMutation.mutateAsync({ refreshToken });

      setRole();
      setUser();

      toast.success("Đăng xuất thành công!");

      router.push("/");
    } catch (error: any) {
      handleErrorApi({
        error,
      });
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
              {user?.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={"/manage/setting"} className="cursor-pointer">
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
