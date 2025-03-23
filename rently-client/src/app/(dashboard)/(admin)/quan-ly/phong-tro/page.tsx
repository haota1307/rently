"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { roomColumns } from "@/features/dashboard/components/room-columns";
import { RoomFilters } from "@/features/dashboard/components/room-filters";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const rooms = [
  {
    id: "1",
    title: "Phòng trọ cao cấp quận 1",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    price: 5000000,
    area: 25,
    status: "available",
    landlord: "Nguyễn Văn X",
    createdAt: "2023-01-15",
  },
  {
    id: "2",
    title: "Phòng trọ giá rẻ quận Bình Thạnh",
    address: "456 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM",
    price: 3000000,
    area: 20,
    status: "rented",
    landlord: "Trần Thị Y",
    createdAt: "2023-02-10",
  },
  {
    id: "3",
    title: "Phòng trọ gần ĐH Bách Khoa",
    address: "789 Lý Thường Kiệt, Quận 10, TP.HCM",
    price: 2500000,
    area: 18,
    status: "available",
    landlord: "Lê Văn Z",
    createdAt: "2023-03-05",
  },
  {
    id: "4",
    title: "Phòng trọ cao cấp quận 7",
    address: "101 Nguyễn Lương Bằng, Quận 7, TP.HCM",
    price: 6000000,
    area: 30,
    status: "maintenance",
    landlord: "Phạm Thị K",
    createdAt: "2023-02-20",
  },
  {
    id: "5",
    title: "Phòng trọ gần ĐH Kinh Tế",
    address: "202 Nguyễn Văn Cừ, Quận 5, TP.HCM",
    price: 3500000,
    area: 22,
    status: "available",
    landlord: "Hoàng Văn L",
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

    // <div className="flex-1 space-y-4 p-8 pt-6">
    //   <div className="flex items-center justify-between">
    //     <h2 className="text-3xl font-bold tracking-tight">Quản lý phòng trọ</h2>
    //     <Button>
    //       <Plus className="mr-2 h-4 w-4" /> Thêm phòng trọ
    //     </Button>
    //   </div>

    //   <RoomFilters
    //     onStatusFilterChange={handleStatusFilterChange}
    //     onPriceFilterChange={handlePriceFilterChange}
    //     onAreaFilterChange={handleAreaFilterChange}
    //   />

    //   <DataTable
    //     columns={roomColumns}
    //     data={filteredData}
    //     searchKey="title"
    //     searchPlaceholder="Tìm kiếm theo tiêu đề..."
    //   />
    // </div>
  );
}
