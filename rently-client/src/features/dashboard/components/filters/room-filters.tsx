"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  statusValue?: string;
  priceValue?: string;
  areaValue?: string;
  onClearFilters?: () => void;
}

export function RoomFilters({
  onStatusFilterChange,
  onPriceFilterChange,
  onAreaFilterChange,
  statusValue = "all",
  priceValue = "all",
  areaValue = "all",
  onClearFilters,
}: RoomFiltersProps) {
  const handleStatusChange = (value: string) => {
    onStatusFilterChange(value);
  };

  const handlePriceChange = (value: string) => {
    onPriceFilterChange(value);
  };

  const handleAreaChange = (value: string) => {
    onAreaFilterChange(value);
  };

  // Kiểm tra xem có bộ lọc nào được áp dụng không
  const hasActiveFilters =
    statusValue !== "all" || priceValue !== "all" || areaValue !== "all";

  return (
    <>
      <Select value={statusValue} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="available">Còn trống</SelectItem>
          <SelectItem value="rented">Đã thuê</SelectItem>
          <SelectItem value="maintenance">Bảo trì</SelectItem>
        </SelectContent>
      </Select>

      <Select value={priceValue} onValueChange={handlePriceChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Giá thuê" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả giá</SelectItem>
          <SelectItem value="under-3m">Dưới 3 triệu</SelectItem>
          <SelectItem value="3m-5m">3 - 5 triệu</SelectItem>
          <SelectItem value="over-5m">Trên 5 triệu</SelectItem>
        </SelectContent>
      </Select>

      <Select value={areaValue} onValueChange={handleAreaChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Diện tích" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả diện tích</SelectItem>
          <SelectItem value="under-20">Dưới 20m²</SelectItem>
          <SelectItem value="20-25">20 - 25m²</SelectItem>
          <SelectItem value="over-25">Trên 25m²</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
