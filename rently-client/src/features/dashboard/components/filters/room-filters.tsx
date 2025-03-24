"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoomFiltersProps {
  onStatusFilterChange: (value: string) => void;
  onPriceFilterChange: (value: string) => void;
  onAreaFilterChange: (value: string) => void;
}

export function RoomFilters({
  onStatusFilterChange,
  onPriceFilterChange,
  onAreaFilterChange,
}: RoomFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onStatusFilterChange(value);
  };

  const handlePriceChange = (value: string) => {
    setPriceFilter(value);
    onPriceFilterChange(value);
  };

  const handleAreaChange = (value: string) => {
    setAreaFilter(value);
    onAreaFilterChange(value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Trạng thái:</span>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="available">Còn trống</SelectItem>
            <SelectItem value="rented">Đã thuê</SelectItem>
            <SelectItem value="maintenance">Bảo trì</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Giá thuê:</span>
        <Select value={priceFilter} onValueChange={handlePriceChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn giá thuê" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="under-3m">Dưới 3 triệu</SelectItem>
            <SelectItem value="3m-5m">3 - 5 triệu</SelectItem>
            <SelectItem value="over-5m">Trên 5 triệu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Diện tích:</span>
        <Select value={areaFilter} onValueChange={handleAreaChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn diện tích" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="under-20">Dưới 20m²</SelectItem>
            <SelectItem value="20-25">20 - 25m²</SelectItem>
            <SelectItem value="over-25">Trên 25m²</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
