"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RentalFiltersProps {
  onStatusFilterChange: (value: string) => void;
  onPriceFilterChange: (value: string) => void;
  onAreaFilterChange: (value: string) => void;
}

export function RentalFilters({
  onStatusFilterChange,
  onPriceFilterChange,
  onAreaFilterChange,
}: RentalFiltersProps) {
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
            <SelectItem value="available">Còn phòng trống</SelectItem>
            <SelectItem value="rented">Hết phòng trống</SelectItem>
            <SelectItem value="maintenance">Đang bảo trì</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Khoảng cách:</span>
        <Select value={priceFilter} onValueChange={handlePriceChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn giá thuê" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="under-3m">Dưới 1 km</SelectItem>
            <SelectItem value="3m-5m">1 - 3 Km</SelectItem>
            <SelectItem value="over-5m">Trên 3 Km</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
