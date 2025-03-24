"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { roomColumns } from "@/features/dashboard/components/columns/room-columns";
import { RoomFilters } from "@/features/dashboard/components/filters/room-filters";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const rooms = [
  {
    id: "1",
    title: "Phòng trọ cao cấp 1",
    address: "Nhà trọ Trần Hào 1",
    price: 5000000,
    area: 25,
    status: "available",
    landlord: "Trần Anh Hào",
    createdAt: "2023-01-15",
  },
  {
    id: "2",
    title: "Phòng trọ cao cấp 1 - nhà trọ Trần Hào 1",
    address: "Nhà trọ Trần Hào 1",
    price: 3000000,
    area: 20,
    status: "rented",
    landlord: "Trần Anh Hào",
    createdAt: "2023-02-10",
  },
  {
    id: "3",
    title: "Phòng trọ gần ĐH Bách Khoa",
    address: "Nhà trọ Trần Hào 1",
    price: 2500000,
    area: 18,
    status: "available",
    landlord: "Trần Anh Hào",
    createdAt: "2023-03-05",
  },
  {
    id: "4",
    title: "Phòng trọ cao cấp quận 7",
    address: "Nhà trọ Trần Hào 2",
    price: 6000000,
    area: 30,
    status: "maintenance",
    landlord: "Trần Anh Hào",
    createdAt: "2023-02-20",
  },
  {
    id: "5",
    title: "Phòng trọ gần ĐH Kinh Tế",
    address: "Nhà trọ Trần Hào 3",
    price: 3500000,
    area: 22,
    status: "available",
    landlord: "Trần Anh Hào",
    createdAt: "2023-04-15",
  },
];

export type Room = (typeof rooms)[0];

export default function RoomsPage() {
  const [filteredData, setFilteredData] = useState<Room[]>(rooms);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");

  const handleStatusFilterChange = (status: string) => {
    filterData(status, priceFilter, areaFilter);
  };

  const handlePriceFilterChange = (price: string) => {
    filterData(statusFilter, price, areaFilter);
  };

  const handleAreaFilterChange = (area: string) => {
    filterData(statusFilter, priceFilter, area);
  };

  const filterData = (status: string, price: string, area: string) => {
    setStatusFilter(status);
    setPriceFilter(price);
    setAreaFilter(area);

    const filtered = rooms.filter((room) => {
      if (status !== "all" && room.status !== status) return false;

      if (price === "under-3m" && room.price >= 3000000) return false;
      if (price === "3m-5m" && (room.price < 3000000 || room.price > 5000000))
        return false;
      if (price === "over-5m" && room.price <= 5000000) return false;

      if (area === "under-20" && room.area >= 20) return false;
      if (area === "20-25" && (room.area < 20 || room.area > 25)) return false;
      if (area === "over-25" && room.area <= 25) return false;

      return true;
    });

    setFilteredData(filtered);
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

        <DataTable
          columns={roomColumns}
          data={filteredData}
          searchKey="title"
          searchPlaceholder="Tìm kiếm theo tiêu đề..."
        />
      </div>
    </SidebarInset>
  );
}
