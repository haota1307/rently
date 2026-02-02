"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  ChevronDown,
  User,
  Building,
  Search,
} from "lucide-react";
import { useAppStore } from "@/components/app-provider";
import DropdownAvatar from "@/components/dropdown-avatar";
import { normalizePath, cn } from "@/lib/utils";
import { Role } from "@/constants/type";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationPopover } from "@/features/notification/notification-popover";
import { useUiSettings } from "@/features/system-setting/hooks/useUiSettings";

// Định nghĩa interface cho một link
interface NavLink {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  category?: string;
}

// Định nghĩa interface cho một danh mục
interface Category {
  name: string;
  icon: React.ComponentType<any>;
}

// Link cơ bản cho tất cả người dùng
const baseLinks: NavLink[] = [
  { name: "Trang chủ", href: "/", icon: Home },
  { name: "So sánh phòng trọ", href: "/so-sanh", icon: BarChart2 },
];

// Link cho người dùng đã đăng nhập - Gộp tin nhắn vào danh mục cá nhân
const authLinks: NavLink[] = [
  {
    name: "Tin nhắn",
    href: "/tin-nhan",
    icon: MessageCircle,
    category: "personal", // Đã chuyển từ "communication" sang "personal"
  },
  {
    name: "Tin đã lưu",
    href: "/tin-da-luu",
    icon: Bookmark,
    category: "personal",
  },
];

// Link cho client (người dùng bình thường)
const clientLinks: NavLink[] = [
  {
    name: "Phòng đã thuê",
    href: "/thue-phong",
    icon: Building,
    category: "personal",
  },
  {
    name: "Lịch xem phòng",
    href: "/lich-xem-phong",
    icon: CalendarIcon,
    category: "personal",
  },
];

// Link cho landlord
const landlordLinks: NavLink[] = [
  {
    name: "Quản lý cho thuê",
    href: "/cho-thue",
    icon: Settings,
    category: "management",
  },
  {
    name: "Lịch hẹn xem nhà",
    href: "/lich-xem-phong",
    icon: CalendarIcon,
    category: "management",
  },
];

// Link cho admin
const adminLinks: NavLink[] = [
  {
    name: "Quản lý hệ thống",
    href: "/quan-ly",
    icon: Settings,
    category: "management",
  },
];

// Nhóm các link thành các danh mục (đã loại bỏ danh mục "communication")
const categories: Record<string, Category> = {
  personal: { name: "Cá nhân", icon: User },
  management: { name: "Quản lý", icon: Settings },
};

// Component riêng để xử lý SearchParams
function SearchHandler({
  onSearchChange,
}: {
  onSearchChange: (value: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onSearchChange(searchParams.get("search") || "");
  }, [searchParams, onSearchChange]);

  return null;
}

export function Header() {
  const { isAuth, role } = useAppStore();
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const normalizedPathname = normalizePath(pathname || "");
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const { settings, isLoading, defaultSettings } = useUiSettings();

  // Đánh dấu hydration đã hoàn tất
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Xử lý khi người dùng tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/phong-tro?search=${encodeURIComponent(search)}`);
    setIsSearchOpen(false);
  };

  // Tạo danh sách link dựa vào vai trò người dùng
  const getAllLinks = () => {
    let links = [...baseLinks];

    if (isAuth) {
      // Thêm link cho tất cả người dùng đã đăng nhập
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

  // Nhóm các link theo danh mục
  const getCategorizedLinks = () => {
    const allLinks = getAllLinks();
    const categorized: Record<string, NavLink[]> = {};

    // Đặt các link không có danh mục vào danh sách chính
    const mainLinks = allLinks.filter((link) => !link.category);

    // Nhóm các link theo danh mục
    allLinks.forEach((link) => {
      if (link.category) {
        if (!categorized[link.category]) {
          categorized[link.category] = [];
        }
        categorized[link.category].push(link);
      }
    });

    return { mainLinks, categorized };
  };

  const { mainLinks, categorized } = getCategorizedLinks();

  // Component tùy chỉnh cho các dropdown menu
  const CustomDropdownMenu = ({
    categoryKey,
    links,
    category,
  }: {
    categoryKey: string;
    links: NavLink[];
    category: { icon: any; name: string };
  }) => {
    const hasActiveLink = links.some(
      (link: NavLink) => normalizedPathname === normalizePath(link.href)
    );

    return (
      <div className="relative z-40" key={categoryKey}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-800",
                hasActiveLink &&
                  "font-semibold bg-primary/10 text-primary dark:bg-primary/20"
              )}
            >
              <category.icon className="h-4 w-4" />
              {category.name}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1 z-[99999]" align="end">
            <div className="grid gap-1">
              {links.map((link) => {
                const isActive =
                  normalizedPathname === normalizePath(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors duration-200 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-800",
                      isActive &&
                        "font-semibold bg-primary/10 text-primary dark:bg-primary/20"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-[999] border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm py-3 shadow-sm dark:shadow-gray-900/20">
      {/* Thêm Suspense để bọc SearchHandler */}
      <Suspense fallback={null}>
        <SearchHandler onSearchChange={setSearch} />
      </Suspense>

      <div className="mx-auto flex w-full items-center justify-between px-4 md:px-8">
        {/* Left section: Logo */}
        <div className="flex items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
              ) : settings.siteLogo ? (
                <Image
                  quality={100}
                  src={settings.siteLogo}
                  alt="Rently Logo"
                  width={100}
                  height={100}
                  className="h-8 w-auto"
                />
              ) : (
                <h2 className="text-2xl font-black uppercase tracking-wider text-primary dark:text-primary relative group">
                  RENTLY
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                </h2>
              )}
            </div>
          </Link>
        </div>

        {/* Center section: Desktop navigation */}
        <div className="hidden lg:flex items-center justify-center space-x-1">
          {/* Hiển thị các link chính */}
          {mainLinks.map((link) => {
            const isActive = normalizedPathname === normalizePath(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-800",
                  isActive &&
                    "font-semibold bg-primary/10 text-primary dark:bg-primary/20"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}

          {/* Hiển thị các nhóm link được phân loại */}
          {Object.entries(categorized).map(([categoryKey, links]) => {
            if (!links.length) return null;
            const category = categories[categoryKey];
            return (
              <CustomDropdownMenu
                key={categoryKey}
                categoryKey={categoryKey}
                links={links}
                category={category}
              />
            );
          })}
        </div>

        {/* Right section: Search and actions */}
        <div className="flex items-center space-x-3">
          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-2">
            {isHydrated ? (
              isAuth ? (
                <>
                  <NotificationPopover />
                  <DropdownAvatar />
                </>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="outline" asChild>
                    <Link href="/dang-ky">Đăng ký</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/dang-nhap">Đăng nhập</Link>
                  </Button>
                </div>
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
                  {/* Hiển thị các link chính */}
                  {mainLinks.map((link) => {
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

                  {/* Hiển thị các nhóm link được phân loại */}
                  {Object.entries(categorized).map(([categoryKey, links]) => {
                    if (!links.length) return null;
                    const category = categories[categoryKey];

                    return (
                      <div key={categoryKey} className="mt-4">
                        <div className="flex items-center px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <category.icon className="h-4 w-4 mr-2" />
                          {category.name}
                        </div>
                        <div className="ml-2 border-l-2 border-primary/30 dark:border-primary/20 pl-2 mt-1">
                          {(links as NavLink[]).map((link) => {
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
                                    isActive
                                      ? "text-primary dark:text-primary"
                                      : ""
                                  }`}
                                />
                                {link.name}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </nav>

                <div className="mt-8 flex items-center justify-between gap-2">
                  {isHydrated ? (
                    !isAuth ? (
                      <div className="flex flex-col w-full space-y-2">
                        <Button className="w-full" asChild>
                          <Link href="/dang-nhap">Đăng nhập</Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/dang-ky">Đăng ký</Link>
                        </Button>
                      </div>
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
