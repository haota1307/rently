"use client";

import * as React from "react";
import { Home, Map, Users, User, LinkIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
// Sử dụng TeamSwitcher như một bộ chuyển đổi "Dãy trọ" (các property)
import { TeamSwitcher } from "@/app/(private)/(admin)/(routes)/_components/team-switcher";
import { NavMain } from "@/app/(private)/(admin)/(routes)/_components/nav-main";
import { NavUser } from "@/app/(private)/(admin)/(routes)/_components/nav-user";
import Link from "next/link";

// Dữ liệu mẫu cho admin quản lý tổng
const data = {
  user: {
    name: "Admin Tổng",
    email: "admin@example.com",
    avatar: "/avatars/admin.jpg",
  },
  buildings: [
    {
      name: "Dãy trọ A",
      logo: Home,
      plan: "Premium",
    },
    {
      name: "Dãy trọ B",
      logo: Home,
      plan: "Standard",
    },
  ],
  // Danh sách điều hướng chính phù hợp với quản lý dãy trọ, phòng trọ, người dùng, người cho thuê
  navMain: [
    {
      title: "Dãy trọ",
      url: "/admin/buildings",
      icon: Home,
      isActive: true,
      items: [
        { title: "Danh sách dãy trọ", url: "/admin/buildings/list" },
        { title: "Thêm dãy trọ", url: "/admin/buildings/add" },
      ],
    },
    {
      title: "Phòng trọ",
      url: "/admin/rooms",
      icon: Map,
      items: [
        { title: "Danh sách phòng trọ", url: "/admin/rooms/list" },
        { title: "Thêm phòng trọ", url: "/admin/rooms/add" },
      ],
    },
    {
      title: "Người dùng",
      url: "/admin/users",
      icon: Users,
      items: [
        { title: "Danh sách người dùng", url: "/admin/users/list" },
        { title: "Thêm người dùng", url: "/admin/users/add" },
      ],
    },
    {
      title: "Người cho thuê",
      url: "/admin/landlords",
      icon: User,
      items: [
        { title: "Danh sách người cho thuê", url: "/admin/landlords/list" },
        { title: "Thêm người cho thuê", url: "/admin/landlords/add" },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        {/* Dùng TeamSwitcher để chuyển đổi giữa các dãy trọ */}
        <TeamSwitcher teams={data.buildings} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
