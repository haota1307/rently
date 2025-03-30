"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { roomColumns } from "@/features/dashboard/components/columns/room-columns";
import { RoomFilters } from "@/features/dashboard/components/filters/room-filters";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useGetMyRooms, useGetRooms } from "@/features/rooms/useRoom";

export default function RoomsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");

  const limit = 5;

  const queryParams = {
    limit,
    page,
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(priceFilter !== "all" && { priceRange: priceFilter }),
    ...(areaFilter !== "all" && { areaRange: areaFilter }),
  };

  const { data, isLoading, error } = useGetMyRooms(queryParams);

  const roomsData = data?.data ?? [];
  const totalCount = data?.totalPages ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  const handleStatusFilterChange = (status: string) => {
    setPage(1);
    setStatusFilter(status);
  };

  const handlePriceFilterChange = (price: string) => {
    setPage(1);
    setPriceFilter(price);
  };

  const handleAreaFilterChange = (area: string) => {
    setPage(1);
    setAreaFilter(area);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Quản lý phòng trọ</h1>
      </header>

      <div className="flex flex-col justify-between m-4 gap-4">
        <div className="flex items-center justify-between">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            <span>Thêm phòng trọ</span>
          </Button>

          <RoomFilters
            onStatusFilterChange={handleStatusFilterChange}
            onPriceFilterChange={handlePriceFilterChange}
            onAreaFilterChange={handleAreaFilterChange}
          />
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>Error occurred</div>
        ) : (
          <DataTable
            columns={roomColumns}
            data={roomsData}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            searchKey="title"
            searchPlaceholder="Tìm kiếm theo tiêu đề..."
          />
        )}
      </div>
    </SidebarInset>
  );
}
