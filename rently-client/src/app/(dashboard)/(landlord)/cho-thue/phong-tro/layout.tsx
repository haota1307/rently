"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Receipt, Settings } from "lucide-react";

interface LandlordRoomLayoutProps {
  children: ReactNode;
}

export default function LandlordRoomLayout({
  children,
}: LandlordRoomLayoutProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Danh sách phòng",
      href: "/cho-thue/phong-tro",
      icon: <Home className="h-4 w-4" />,
      exact: true,
    },
    {
      title: "Hóa đơn",
      href: "/cho-thue/phong-tro/hoa-don",
      icon: <Receipt className="h-4 w-4" />,
      exact: false,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">{children}</div>
      <div className="border-t bg-card">
        <div className="container py-2">
          <nav className="flex justify-center space-x-4">
            {menuItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
