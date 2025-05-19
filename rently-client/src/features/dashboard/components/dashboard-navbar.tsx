"use client";

import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function DashboardNavbar({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
  }[];
}) {
  const pathname = usePathname();

  // Lấy menu nào match với pathname hiện tại nhiều nhất
  const findBestMatch = (): string => {
    // Sắp xếp các URL từ dài nhất đến ngắn nhất để ưu tiên match cụ thể hơn
    const sortedUrls = [...items]
      .filter((item) => pathname.startsWith(item.url))
      .sort((a, b) => b.url.length - a.url.length);

    // Trả về URL của menu match tốt nhất (dài nhất)
    return sortedUrls.length > 0 ? sortedUrls[0].url : "";
  };

  const bestMatchUrl = findBestMatch();

  // Kiểm tra menu nào active
  const isActive = (url: string): boolean => {
    // Trường hợp đường dẫn chính xác
    if (pathname === url) {
      return true;
    }

    // Chỉ active menu nếu nó là best match
    if (pathname.startsWith(`${url}/`)) {
      return url === bestMatchUrl;
    }

    return false;
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const active = isActive(item.url);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={active}>
                    <Link href={item.url}>
                      {item.icon && (
                        <item.icon className={cn(active && "text-primary")} />
                      )}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarMenu>
    </SidebarGroup>
  );
}
