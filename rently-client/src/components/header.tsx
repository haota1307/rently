"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Bookmark,
  Menu,
  Home,
  Settings,
  CalendarIcon,
  BarChart2,
  MessageCircle,
} from "lucide-react";
import { useAppStore } from "@/components/app-provider";
import DropdownAvatar from "@/components/dropdown-avatar";
import { normalizePath } from "@/lib/utils";
import { Role } from "@/constants/type";
import { ModeToggle } from "@/components/mode-toggle";

// Link cơ bản cho tất cả người dùng
const baseLinks = [
  { name: "Trang chủ", href: "/", icon: Home },
  { name: "So sánh phòng trọ", href: "/so-sanh", icon: BarChart2 },
];

// Link cho người dùng đã đăng nhập
const authLinks = [
  { name: "Tin nhắn", href: "/tin-nhan", icon: MessageCircle },
  { name: "Tin đã lưu", href: "/tin-da-luu", icon: Bookmark },
];

// Link cho client (người dùng bình thường)
const clientLinks = [
  { name: "Lịch xem phòng", href: "/lich-xem-phong", icon: CalendarIcon },
];

// Link cho landlord
const landlordLinks = [
  { name: "Quản lý cho thuê", href: "/cho-thue", icon: Settings },
  { name: "Lịch hẹn xem nhà", href: "/lich-xem-phong", icon: CalendarIcon },
];

// Link cho admin
const adminLinks = [
  { name: "Quản lý hệ thống", href: "/quan-ly", icon: Settings },
];

export function Header() {
  const { isAuth, role } = useAppStore();
  const [search, setSearch] = useState("");
  const pathname = usePathname();
  const normalizedPathname = normalizePath(pathname || "");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  // Đánh dấu hydration đã hoàn tất
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Đặt giá trị search từ URL
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  // Tạo danh sách link dựa vào vai trò người dùng
  const getLinksForRole = () => {
    let links = [...baseLinks];

    if (isAuth) {
      // Thêm link tin nhắn cho tất cả người dùng đã đăng nhập
      links = [...links, ...authLinks];

      if (role === Role.Admin) {
        // Admin thấy cả hai liên kết quản lý
        links = [...links, ...adminLinks, ...landlordLinks];
      } else if (role === Role.Landlord) {
        links = [...links, ...landlordLinks];
      } else if (role === Role.Client) {
        // Client thấy lịch xem phòng
        links = [...links, ...clientLinks];
      }
    }

    return links;
  };

  const links = getLinksForRole();

  // Xử lý khi người dùng tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/phong-tro?search=${encodeURIComponent(search)}`);
  };

  return (
    <header className="sticky top-0 z-[999] border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-4 shadow-sm dark:shadow-gray-900/20">
      <div className="mx-auto flex w-full items-center justify-between px-4 md:px-8">
        {/* Left section: Logo */}
        <div className="flex items-center">
          {/* Logo */}
          <Link href="/">
            <h2 className="text-2xl font-black uppercase tracking-wider text-primary dark:text-primary">
              Rently
            </h2>
          </Link>
        </div>

        {/* Center section: Desktop navigation */}
        <nav className="hidden lg:flex items-center justify-center gap-2 text-sm">
          {links.map((link) => {
            const isActive = normalizedPathname === normalizePath(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`font-medium transition-colors flex items-center justify-center px-3 py-2 rounded-md ${
                  isActive
                    ? "font-bold text-primary dark:text-primary bg-primary/10 dark:bg-primary/20"
                    : "text-gray-800 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <link.icon
                  className={`h-5 w-5 mr-1 ${
                    isActive ? "text-primary dark:text-primary" : ""
                  }`}
                />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right section: Search and actions */}
        <div className="flex items-center">
          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-2">
            <ModeToggle />
            {isHydrated ? (
              isAuth ? (
                <DropdownAvatar />
              ) : (
                <Button asChild>
                  <Link href="/dang-nhap">Đăng nhập</Link>
                </Button>
              )
            ) : (
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            )}
          </div>

          {/* Mobile burger menu */}
          <div className="block md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-800 dark:text-gray-200"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent className="p-6 dark:bg-gray-900 dark:text-gray-100">
                <div className="mb-4 flex items-center justify-between">
                  <SheetTitle className="dark:text-gray-100">Menu</SheetTitle>
                </div>
                <nav className="flex flex-col gap-2">
                  {links.map((link) => {
                    const isActive =
                      normalizedPathname === normalizePath(link.href);
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`font-medium transition-colors flex items-center px-3 py-2 rounded-md ${
                          isActive
                            ? "font-bold text-primary dark:text-primary bg-primary/10 dark:bg-primary/20"
                            : "text-gray-800 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <link.icon
                          className={`h-5 w-5 mr-2 ${
                            isActive ? "text-primary dark:text-primary" : ""
                          }`}
                        />
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-6 flex items-center justify-between gap-2">
                  <ModeToggle />

                  {isHydrated ? (
                    !isAuth ? (
                      <Button className="w-full" asChild>
                        <Link href="/dang-nhap">Đăng nhập</Link>
                      </Button>
                    ) : (
                      <DropdownAvatar />
                    )
                  ) : (
                    <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
