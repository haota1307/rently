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
import { Search, Heart, Bookmark, Menu } from "lucide-react";
import { useAppStore } from "@/components/app-provider";
import DropdownAvatar from "@/components/dropdown-avatar";
import { normalizePath } from "@/lib/utils";

const links = [
  { name: "Trang chủ", href: "/" },
  { name: "Nhà trọ", href: "/phong-tro" },
  { name: "Mini House", href: "/listings/mini-house" },
  { name: "Yêu thích", href: "/favorites" },
  { name: "Đánh dấu", href: "/saved" },
];

export function Header() {
  const { isAuth } = useAppStore();
  const [search, setSearch] = useState("");

  const pathname = usePathname();
  const normalizedPathname = normalizePath(pathname || "");

  return (
    <header className="bg-white sticky top-0 z-[999] border-b border-gray-200 shadow-sm py-4">
      <div className="w-full mx-auto px-8 flex items-center justify-start">
        {/* LOGO */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <h2 className="font-black tracking-wider uppercase text-2xl text-primary">
              Rently
            </h2>
          </Link>
        </div>

        {/* MENU LINKS cho desktop */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-4 text-sm">
          {links.map((link) => {
            const isActive = normalizedPathname === normalizePath(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors font-medium ${
                  isActive
                    ? "text-muted-foreground font-bold"
                    : "text-gray-800 hover:text-primary"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* ICONS & NÚT cho desktop & mobile */}
        <div className="flex items-center gap-4">
          {/* Mobile: Sheet chứa menu, tìm kiếm và đăng nhập */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="lg:hidden">
                <Menu className="w-5 h-5 text-gray-600 hover:text-primary cursor-pointer" />
              </button>
            </SheetTrigger>
            <SheetContent className="p-6">
              <div className="flex items-center justify-between mb-4">
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
                      className={`transition-colors font-medium ${
                        isActive
                          ? "text-muted-foreground font-bold"
                          : "text-gray-800 hover:text-primary"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
              {/* Phần tìm kiếm trên mobile */}
              <div className="mt-6">
                <Input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
                <Button className="w-full mt-3">Tìm kiếm</Button>
              </div>
              {/* Nút đăng nhập trên mobile */}
              <div className="mt-6">
                {!isAuth ? (
                  <Button className="w-full">
                    <Link href={"/dang-nhap"}>Đăng nhập</Link>
                  </Button>
                ) : (
                  <DropdownAvatar />
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop: Tìm kiếm */}
          <form className="relative hidden lg:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              className="pl-10 w-[100px] lg:w-[250px]"
            />
          </form>

          {/* Desktop: Yêu thích & Đánh dấu */}
          <Link href="/favorites" className="hidden lg:block">
            <Heart className="w-5 h-5 text-gray-600 hover:text-primary cursor-pointer" />
          </Link>
          <Link href="/saved" className="hidden lg:block">
            <Bookmark className="w-5 h-5 text-gray-600 hover:text-primary cursor-pointer" />
          </Link>

          {/* Desktop: Nút Đăng nhập hoặc Avatar */}
          {!isAuth ? (
            <Button className="hidden lg:block">
              <Link href={"/dang-nhap"}>Đăng nhập</Link>
            </Button>
          ) : (
            <DropdownAvatar />
          )}
        </div>
      </div>
    </header>
  );
}
