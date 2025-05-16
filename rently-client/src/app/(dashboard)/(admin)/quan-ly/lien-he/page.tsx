"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import contactApiRequest, {
  ContactFilters,
  Contact,
} from "@/features/contact/contact.api";
import { contactColumns } from "@/features/contact/components/contact-columns";

export default function ContactManagementPage() {
  const [filters, setFilters] = useState<ContactFilters>({
    page: 1,
    limit: 10,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["contacts", filters],
    queryFn: () => contactApiRequest.getContacts(filters),
  });

  const contactsData = data?.payload;

  const handleFilterChange = (newFilters: Partial<ContactFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Only trigger search if at least 3 characters or empty
    if (value.length >= 3 || value === "") {
      handleFilterChange({ search: value });
    }
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);

    // Convert "ALL" to undefined to not filter by status
    const statusValue = value === "ALL" ? undefined : value;
    handleFilterChange({
      status: statusValue as "PENDING" | "RESPONDED" | "CLOSED" | undefined,
    });
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full sticky top-0 bg-background z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Quản lý Liên hệ</h1>
      </header>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 md:max-w-sm">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm liên hệ..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full md:w-auto">
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                    <SelectItem value="RESPONDED">Đã phản hồi</SelectItem>
                    <SelectItem value="CLOSED">Đã đóng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && !contactsData ? (
          <Skeleton className="h-[400px] w-full" />
        ) : isError ? (
          <div className="text-center py-8 text-destructive">
            Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.
          </div>
        ) : (
          <DataTable
            columns={contactColumns}
            data={contactsData?.data || []}
            currentPage={filters.page}
            totalPages={contactsData?.meta.totalPages || 1}
            onPageChange={handlePageChange}
            isLoading={isLoading}
            emptyMessage="Không tìm thấy liên hệ nào"
          />
        )}
      </div>
    </SidebarInset>
  );
}
