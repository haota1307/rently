"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleUpgradeRequestList } from "@/features/role-upgrade-request/components/role-upgrade-request-list";
import { RoleUpgradeRequestStatus } from "@/constants/type";

export default function RoleUpgradeRequestPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] =
    useState<RoleUpgradeRequestStatus>("PENDING");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleStatusFilterChange = (value: RoleUpgradeRequestStatus) => {
    setStatusFilter(value);
  };

  return (
    <SidebarInset>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-2 md:px-4 w-full sticky top-0 bg-background z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-base md:text-lg font-semibold">
          Quản lý yêu cầu nâng cấp
        </h1>
      </header>

      <div className="p-2 md:p-4 space-y-4 max-w-full overflow-x-auto">
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-4">
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo tên người dùng..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm font-medium whitespace-nowrap w-20">
                  Trạng thái:
                </span>
                <Select
                  value={statusFilter}
                  onValueChange={handleStatusFilterChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Đang chờ</SelectItem>
                    <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                    <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="overflow-x-auto pb-4">
          <RoleUpgradeRequestList
            searchQuery={searchQuery}
            status={statusFilter}
          />
        </div>
      </div>
    </SidebarInset>
  );
}
