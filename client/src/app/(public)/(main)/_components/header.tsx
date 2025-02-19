"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Search, Heart, Bookmark } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { name: "Trang chủ", href: "/" },
  { name: "Nhà trọ", href: "/listings" },
  { name: "Mini House", href: "/listings/mini-house" },
  { name: "Yêu thích", href: "/favorites" },
  { name: "Đánh dấu", href: "/saved" },
];

export default function Header() {
  const [search, setSearch] = useState("");
  const pathname = usePathname();

  return (
    <header className="bg-white sticky top-0 z-[9999999] border-b border-gray-200 shadow-sm py-4">
      <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between gap-4">
        {/* LOGO */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <h2 className="font-black tracking-wider uppercase text-2xl text-primary">
              Rently
            </h2>
          </Link>
        </div>

        {/* MENU LINKS */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-6 text-sm">
          {links.map((link) => {
            const isActive = pathname === link.href;

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

        {/* ICONS & NÚT ĐĂNG NHẬP */}
        <div className="flex items-center gap-4">
          {/* MODAL tìm kiếm trên mobile */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="md:hidden">
                <Search className="w-5 h-5 text-gray-600 hover:text-primary cursor-pointer" />
              </button>
            </DialogTrigger>
            <DialogContent className="p-6 max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tìm kiếm</h3>
              </div>
              <Input
                type="text"
                placeholder="Nhập từ khóa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
              <Button className="w-full mt-3">Tìm kiếm</Button>
            </DialogContent>
          </Dialog>

          {/* Tìm kiếm trên Desktop */}
          <form className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              className="pl-10 w-[100px] md:w-[150px] lg:w-[200px]"
            />
          </form>

          {/* Yêu thích & Đánh dấu */}
          <Link href="/favorites">
            <Heart className="w-5 h-5 text-gray-600 hover:text-primary cursor-pointer" />
          </Link>
          <Link href="/saved">
            <Bookmark className="w-5 h-5 text-gray-600 hover:text-primary cursor-pointer" />
          </Link>

          {/* Nút Đăng nhập */}
          <Button>
            <Link href={"/sign-in"}>Đăng nhập</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
