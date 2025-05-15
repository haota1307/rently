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
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserIcon,
  LogOut,
  Home,
  Shield,
  Bookmark,
  MessageCircle,
} from "lucide-react";

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
          className="overflow-hidden rounded-full border-2 border-primary/10 hover:border-primary/20 transition-all"
        >
          <Avatar>
            <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
            <AvatarFallback className="bg-primary/5 text-primary">
              {user?.name ? user.name.slice(0, 1).toUpperCase() : ""}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-medium flex flex-col gap-1">
          <span className="text-base truncate">{user?.name}</span>
          <span className="text-xs text-muted-foreground truncate">
            {user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {/* Admin và Landlord */}
          {role === Role.Admin && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href="/quan-ly"
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>Quản lý trang web</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/cho-thue"
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Quản lý cho thuê</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {role === Role.Landlord && (
            <DropdownMenuItem asChild>
              <Link
                href="/cho-thue"
                className="cursor-pointer flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span>Quản lý cho thuê</span>
              </Link>
            </DropdownMenuItem>
          )}

          {/* Đường dẫn thông tin tài khoản - cho tất cả các role */}
          <DropdownMenuItem asChild>
            <Link
              href="/tai-khoan"
              className="cursor-pointer flex items-center gap-2"
            >
              <UserIcon className="h-4 w-4" />
              <span>Thông tin cá nhân</span>
            </Link>
          </DropdownMenuItem>

          {/* Các đường dẫn khác */}
          <DropdownMenuItem asChild>
            <Link
              href="/tin-da-luu"
              className="cursor-pointer flex items-center gap-2"
            >
              <Bookmark className="h-4 w-4" />
              <span>Tin đã lưu</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="/tin-nhan"
              className="cursor-pointer flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Tin nhắn</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
