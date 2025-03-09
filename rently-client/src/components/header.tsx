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
  SheetClose,
} from "@/components/ui/sheet";
import { Search, Heart, Bookmark, Menu, X } from "lucide-react";

const links = [
  { name: "Trang chủ", href: "/" },
  { name: "Nhà trọ", href: "/listings" },
  { name: "Mini House", href: "/listings/mini-house" },
  { name: "Yêu thích", href: "/favorites" },
  { name: "Đánh dấu", href: "/saved" },
];

// Hàm chuẩn hóa đường dẫn: loại bỏ các dấu "/" thừa ở cuối
function normalizePath(path: string) {
  return path.replace(/\/+$/, "");
}

export function Header() {
  const [search, setSearch] = useState("");
  const pathname = usePathname();
  const normalizedPathname = normalizePath(pathname || "");

  return (
    <header className="bg-white sticky top-0 z-[999] border-b border-gray-200 shadow-sm py-4">
      <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between gap-4">
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
                <Button className="w-full">
                  <Link href={"/sign-in"}>Đăng nhập</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop: Tìm kiếm */}
          <form className="relative hidden lg:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              className="pl-10 w-[100px] lg:w-[150px] lg:w-[200px]"
            />
          </form>

          {/* Desktop: Yêu thích & Đánh dấu */}
          <Link href="/favorites" className="hidden lg:block">
            <Heart className="w-5 h-5 text-gray-600 hover:text-primary cursor-pointer" />
          </Link>
          <Link href="/saved" className="hidden lg:block">
            <Bookmark className="w-5 h-5 text-gray-600 hover:text-primary cursor-pointer" />
          </Link>

          {/* Desktop: Nút Đăng nhập */}
          <Button className="hidden lg:block">
            <Link href={"/sign-in"}>Đăng nhập</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
