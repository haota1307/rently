"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { roomBillColumns } from "@/features/dashboard/components/columns/room-bill-columns";
import { RoomBillFilters } from "@/features/rooms/components/room-bill-filters";
import { CommonFilterLayout } from "@/features/dashboard/components/filters/common-filter-layout";
import { useGetRoomBills } from "@/features/rooms/useRoomBill";
import { RoomBillDetailModal } from "@/features/rooms/components/room-bill-detail-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function RoomBillsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<Date | undefined>(undefined);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const limit = 10;
  const queryParams = {
    limit,
    page,
    ...(statusFilter !== "all" && { isPaid: statusFilter === "true" }),
    ...(monthFilter && { billingMonth: monthFilter }),
  };

  const { data, isLoading, error } = useGetRoomBills(queryParams);
  const billsData = data?.data ?? [];
  const totalCount = data?.totalPages ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  const handleStatusFilterChange = (status: string) => {
    setPage(1);
    setStatusFilter(status);
  };

  const handleMonthFilterChange = (date: Date | undefined) => {
    setPage(1);
    setMonthFilter(date);
  };

  const handleClearAllFilters = () => {
    setStatusFilter("all");
    setMonthFilter(undefined);
    setSearchInput("");
    setPage(1);
  };

  // Callback khi người dùng chọn xem chi tiết
  const handleViewBill = (bill: any) => {
    setSelectedBill(bill);
    setIsDetailModalOpen(true);
  };

  const columns = [
    ...roomBillColumns.filter((column) => column.id !== "actions"),
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }: any) => {
        const bill = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(bill.id.toString())
                }
              >
                Sao chép ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewBill(bill)}>
                Xem chi tiết
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Quản lý hóa đơn phòng trọ</h1>
      </header>

      <div className="flex flex-col justify-between m-4 gap-4">
        <CommonFilterLayout
          searchInput={searchInput}
          onSearchChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          clearAllFilters={handleClearAllFilters}
          showClearButton={
            statusFilter !== "all" ||
            monthFilter !== undefined ||
            searchInput.trim() !== ""
          }
          searchPlaceholder="Tìm kiếm theo phòng..."
          actionButton={
            <Button onClick={() => {}}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Tạo hóa đơn mới</span>
            </Button>
          }
          filterControls={
            <RoomBillFilters
              onStatusFilterChange={handleStatusFilterChange}
              onMonthFilterChange={handleMonthFilterChange}
              statusValue={statusFilter}
              monthValue={monthFilter}
            />
          }
        />

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Đang tải...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">
            Đã xảy ra lỗi khi tải dữ liệu
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={billsData}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      {selectedBill && (
        <RoomBillDetailModal
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          billId={selectedBill.id}
        />
      )}
    </SidebarInset>
  );
}
