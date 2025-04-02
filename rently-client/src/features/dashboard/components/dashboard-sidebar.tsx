"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  Map,
  Users,
  User,
  LinkIcon,
  Shield,
  CreditCard,
  LogOutIcon,
  Building2Icon,
  NotebookPen,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { DashboardNavbar } from "@/features/dashboard/components/dashboard-navbar";
import { DashboardLogo } from "@/features/dashboard/components/dashboard-logo";
import { Button } from "@/components/ui/button";

const defaultData = {
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
    },
    {
      title: "Quản lý doanh thu",
      url: "/quan-ly/doanh-thu",
      icon: CreditCard,
    },
    {
      title: "Quản lý người dùng",
      url: "/quan-ly/nguoi-dung",
      icon: User,
    },
    {
      title: "Quản lý nhà trọ",
      url: "/quan-ly/nha-tro",
      icon: Map,
    },
    {
      title: "Quản lý quyền",
      url: "/quan-ly/quyen",
      icon: Shield,
    },
  ],
};

const landloardData = {
  navMain: [
    {
      title: "Tổng quan",
      url: "/cho-thue",
      icon: Home,
    },
    {
      title: "Danh sách nhà trọ",
      url: "/cho-thue/nha-tro",
      icon: Building2Icon,
    },
    {
      title: "Danh sách phòng trọ",
      url: "/cho-thue/phong-tro",
      icon: Home,
    },
    {
      title: "Danh sách bài đăng",
      url: "/cho-thue/quan-ly-bai-dang",
      icon: NotebookPen,
    },
  ],
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pahtname = usePathname();

  const isChoThue = pahtname.startsWith("/cho-thue");

  const data = isChoThue ? landloardData : defaultData;

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <DashboardLogo />
      </SidebarHeader>
      <SidebarContent>
        <DashboardNavbar items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <Button
          className="flex items-center justify-center"
          variant={"outline"}
        >
          <LogOutIcon className="size-4 mr-1" />
          Quay về trang chủ
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
