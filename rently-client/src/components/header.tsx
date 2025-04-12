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
  Search,
  Heart,
  Bookmark,
  Menu,
  Home,
  Plus,
  Settings,
  UserIcon,
  CalendarIcon,
} from "lucide-react";
import { useAppStore } from "@/components/app-provider";
import DropdownAvatar from "@/components/dropdown-avatar";
import { normalizePath } from "@/lib/utils";
import { Role } from "@/constants/type";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

// Link cơ bản cho tất cả người dùng
const baseLinks = [
  { name: "Trang chủ", href: "/", icon: Home },
  { name: "Tin đã lưu", href: "/tin-da-luu", icon: Bookmark },
];

// Link cho client (người dùng bình thường)
const clientLinks = [
  { name: "Lịch xem phòng", href: "/lich-xem-phong", icon: CalendarIcon },
];

// Link cho admin
const adminLinks = [{ name: "Quản lý", href: "/quan-ly", icon: Settings }];

// Link cho landlord
const landlordLinks = [
  { name: "Quản lý cho thuê", href: "/cho-thue", icon: Settings },
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
    <header className="sticky top-0 z-[999] border-b border-gray-200 bg-white py-4 shadow-sm">
      <div className="mx-auto flex w-full items-center justify-between px-4 md:px-8">
        {/* Left section: Logo */}
        <div className="flex items-center">
          {/* Logo */}
          <Link href="/">
            <h2 className="text-2xl font-black uppercase tracking-wider text-primary">
              Rently
            </h2>
          </Link>
        </div>

        {/* Center section: Desktop navigation */}
        <nav className="hidden lg:flex items-center justify-center gap-6 text-sm">
          {links.map((link) => {
            const isActive = normalizedPathname === normalizePath(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`font-medium transition-colors flex items-center justify-center ${
                  isActive
                    ? "font-bold text-muted-foreground"
                    : "text-gray-800 hover:text-primary"
                }`}
              >
                <link.icon className="h-5 w-5 mr-1" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right section: Search and actions */}
        <div className="flex items-center">
          {/* Desktop search */}
          <form
            className="relative mr-3 hidden md:block"
            onSubmit={handleSearch}
          >
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-[150px] md:w-[200px] lg:w-[300px]"
            />
            <Search className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-500" />
          </form>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isHydrated ? (
              isAuth ? (
                <DropdownAvatar />
              ) : (
                <Button asChild>
                  <Link href="/dang-nhap">Đăng nhập</Link>
                </Button>
              )
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            )}
          </div>

          {/* Mobile burger menu */}
          <div className="block md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <SheetTitle>Menu</SheetTitle>
                </div>
                <nav className="flex flex-col gap-4">
                  {links.map((link) => {
                    const isActive =
                      normalizedPathname === normalizePath(link.href);
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`font-medium transition-colors ${
                          isActive
                            ? "font-bold text-muted-foreground"
                            : "text-gray-800 hover:text-primary"
                        }`}
                      >
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>
                {/* Mobile search */}
                <div className="mt-6">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full"
                  />
                  <Button className="mt-3 w-full" onClick={handleSearch}>
                    Tìm kiếm
                  </Button>
                </div>
                {/* Mobile login button */}
                <div className="mt-6">
                  {isHydrated ? (
                    !isAuth ? (
                      <Button className="w-full" asChild>
                        <Link href="/dang-nhap">Đăng nhập</Link>
                      </Button>
                    ) : (
                      <DropdownAvatar />
                    )
                  ) : (
                    <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
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
