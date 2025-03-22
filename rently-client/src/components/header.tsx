"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { useAppStore } from "@/components/app-provider";
import DropdownAvatar from "@/components/dropdown-avatar";
import { normalizePath } from "@/lib/utils";

const links = [
  { name: "Trang chủ", href: "/", icon: Home },
  { name: "Tin đã lưu", href: "/tin-da-luu", icon: Bookmark },
  { name: "Đăng tin", href: "/dang-tin", icon: Plus },
  { name: "Quản lý", href: "/quan-ly", icon: Settings },
];

export function Header() {
  const { isAuth } = useAppStore();
  const [search, setSearch] = useState("");

  const pathname = usePathname();
  const normalizedPathname = normalizePath(pathname || "");

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

        <div className="flex items-center gap-4">
          {/* Desktop search */}
          <form className="relative hidden lg:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              className="w-[250px] pl-10"
            />
          </form>

          {/* Auth button or avatar */}
          <div className="hidden lg:block ml-2">
            {!isAuth ? (
              <Button>
                <Link href="/dang-nhap">Đăng nhập</Link>
              </Button>
            ) : (
              <DropdownAvatar />
            )}
          </div>

          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5 text-gray-600" />
                <span className="sr-only">Menu</span>
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
                <Button className="mt-3 w-full">Tìm kiếm</Button>
              </div>
              {/* Mobile login button */}
              <div className="mt-6">
                {!isAuth ? (
                  <Button className="w-full">
                    <Link href="/dang-nhap">Đăng nhập</Link>
                  </Button>
                ) : (
                  <DropdownAvatar />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
