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
  CalendarIcon as Calendar,
  Flag,
  FileText,
  Mail,
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

const defaultData = {
  user: {
    name: "Admin ",
    email: "admin@example.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    // Tổng quan
    {
      title: "Tổng quan",
      url: "/quan-ly",
      icon: Home,
    },
    // Quản lý tài chính
    {
      title: "Quản lý doanh thu",
      url: "/quan-ly/doanh-thu",
      icon: CreditCard,
    },
    {
      title: "Quản lý rút tiền",
      url: "/quan-ly/rut-tien",
      icon: CreditCard,
    },
    // Quản lý người dùng
    {
      title: "Quản lý người dùng",
      url: "/quan-ly/nguoi-dung",
      icon: User,
    },
    {
      title: "Yêu cầu nâng cấp",
      url: "/quan-ly/yeu-cau-nang-cap",
      icon: Users,
    },
    // Quản lý nhà trọ và nội dung
    {
      title: "Quản lý nhà trọ",
      url: "/quan-ly/nha-tro",
      icon: Map,
    },
    {
      title: "Quản lý bài viết",
      url: "/quan-ly/bai-viet",
      icon: FileText,
    },
    {
      title: "Quản lý tiện ích",
      url: "/quan-ly/tien-ich",
      icon: Building2Icon,
    },
    // Quản lý liên hệ và báo cáo
    {
      title: "Quản lý liên hệ",
      url: "/quan-ly/lien-he",
      icon: Mail,
    },
    {
      title: "Quản lý báo cáo",
      url: "/quan-ly/bao-cao",
      icon: Flag,
    },
    // Quản lý hệ thống
    {
      title: "Quản lý quyền",
      url: "/quan-ly/quyen",
      icon: Shield,
    },
    {
      title: "Cài đặt hệ thống",
      url: "/quan-ly/cai-dat",
      icon: Shield,
    },
  ],
};

const landloardData = {
  navMain: [
    // Tổng quan
    {
      title: "Tổng quan",
      url: "/cho-thue",
      icon: Home,
    },
    // Quản lý nhà trọ và phòng trọ
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
    // Quản lý bài đăng
    {
      title: "Danh sách bài đăng",
      url: "/cho-thue/quan-ly-bai-dang",
      icon: NotebookPen,
    },
    // Quản lý hợp đồng
    {
      title: "Quản lý hợp đồng",
      url: "/cho-thue/hop-dong",
      icon: FileText,
    },
    // Quản lý lịch hẹn và yêu cầu
    {
      title: "Lịch xem phòng",
      url: "/cho-thue/dat-lich",
      icon: Calendar,
    },
    {
      title: "Yêu cầu thuê",
      url: "/cho-thue/yeu-cau-thue",
      icon: Users,
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
      <SidebarRail />
    </Sidebar>
  );
}
