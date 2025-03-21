"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { UserFilters } from "@/features/dashboard/components/user-filters";
import { userColumns } from "@/features/dashboard/components/user-columns";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const users = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0901234567",
    status: "active",
    role: "user",
    createdAt: "2023-01-15",
  },
  {
    id: "2",
    name: "Trần Thị B",
    email: "tranthib@example.com",
    phone: "0912345678",
    status: "active",
    role: "user",
    createdAt: "2023-02-20",
  },
  {
    id: "3",
    name: "Lê Văn C",
    email: "levanc@example.com",
    phone: "0923456789",
    status: "inactive",
    role: "user",
    createdAt: "2023-03-10",
  },
  {
    id: "4",
    name: "Phạm Thị D",
    email: "phamthid@example.com",
    phone: "0934567890",
    status: "active",
    role: "admin",
    createdAt: "2023-04-05",
  },
  {
    id: "5",
    name: "Hoàng Văn E",
    email: "hoangvane@example.com",
    phone: "0945678901",
    status: "active",
    role: "landlord",
    createdAt: "2023-05-12",
  },
];

export type User = (typeof users)[0];

export default function UsersPage() {
  const [filteredData, setFilteredData] = useState<User[]>(users);

  const handleStatusFilterChange = (status: string) => {
    filterData(status, roleFilter);
  };

  const handleRoleFilterChange = (role: string) => {
    filterData(statusFilter, role);
  };

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filterData = (status: string, role: string) => {
    setStatusFilter(status);
    setRoleFilter(role);

    const filtered = users.filter((user) => {
      if (status !== "all" && user.status !== status) return false;
      if (role !== "all" && user.role !== role) return false;
      return true;
    });

    setFilteredData(filtered);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Quản lý người dùng</h1>
      </header>

      <div className="flex flex-col justify-between m-4 gap-4">
        <div className="flex items-center justify-between">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            <span>Thêm người dùng</span>
          </Button>

          <UserFilters
            onStatusFilterChange={handleStatusFilterChange}
            onRoleFilterChange={handleRoleFilterChange}
          />
        </div>

        <DataTable
          columns={userColumns}
          data={filteredData}
          searchKey="name"
          searchPlaceholder="Tìm kiếm theo tên..."
        />
      </div>
    </SidebarInset>
  );
}
