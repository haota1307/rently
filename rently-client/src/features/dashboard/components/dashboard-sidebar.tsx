"use client";

import * as React from "react";
import {
  Home,
  Map,
  Users,
  User,
  LinkIcon,
  Shield,
  CreditCard,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
// Sử dụng TeamSwitcher như một bộ chuyển đổi "Dãy trọ" (các property)

import { DashboardNavbar } from "@/features/dashboard/components/dashboard-navbar";
import { DashboardLogo } from "@/features/dashboard/components/dashboard-logo";
import { DashboardNavbarUser } from "@/features/dashboard/components/dashboard-navbar-user";

// Dữ liệu mẫu cho admin quản lý tổng
const data = {
  user: {
    name: "Admin ",
    email: "admin@example.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Tổng quan",
      url: "/quan-ly",
      icon: Home,
      isActive: true,
    },
    {
      title: "Quản lý doanh thu",
      url: "/quan-ly/doanh-thu",
      icon: CreditCard,
      isActive: true,
    },
    {
      title: "Quản lý người dùng",
      url: "/quan-ly/nguoi-dung",
      icon: User,
      isActive: true,
    },
    {
      title: "Quản lý phòng trọ",
      url: "/quan-ly/phong-tro",
      icon: Map,
    },
    {
      title: "Quản lý quyền",
      url: "/quan-ly/quyen",
      icon: Shield,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <DashboardLogo />
      </SidebarHeader>
      <SidebarContent>
        <DashboardNavbar items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <DashboardNavbarUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
