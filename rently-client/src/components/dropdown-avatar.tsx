"use client";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserIcon, CalendarIcon } from "lucide-react";

import { getRefreshTokenFromLocalStorage, handleErrorApi } from "@/lib/utils";
import { useAppStore } from "@/components/app-provider";
import { useLogoutMutation } from "@/features/auth/useAuth";
import { useAccountMe } from "@/features/profile/useProfile";
import { Role } from "@/constants/type";

export default function DropdownAvatar() {
  const router = useRouter();
  const { role, setRole } = useAppStore();

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

        {/* Các đường dẫn tùy thuộc vào vai trò */}
        {role === Role.Admin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/quan-ly" className="cursor-pointer">
                Quản lý trang web
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/cho-thue" className="cursor-pointer">
                Quản lý cho thuê
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {role === Role.Landlord && (
          <DropdownMenuItem asChild>
            <Link href="/cho-thue" className="cursor-pointer">
              Quản lý cho thuê
            </Link>
          </DropdownMenuItem>
        )}

        {/* Đường dẫn thông tin tài khoản - cho tất cả các role */}
        <DropdownMenuItem asChild>
          <Link href="/tai-khoan" className="cursor-pointer">
            Thông tin cá nhân
          </Link>
        </DropdownMenuItem>

        {/* Các đường dẫn khác */}
        <DropdownMenuItem asChild>
          <Link href="/tin-da-luu" className="cursor-pointer">
            Tin đã lưu
          </Link>
        </DropdownMenuItem>

        <DropdownMenuGroup>
          <Link href="/trang-ca-nhan" className="w-full">
            <DropdownMenuItem>
              Trang cá nhân
              <DropdownMenuShortcut>
                <UserIcon className="w-4 h-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/lich-xem-phong" className="w-full">
            <DropdownMenuItem>
              Lịch xem phòng
              <DropdownMenuShortcut>
                <CalendarIcon className="w-4 h-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={logout}>
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
