"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetLandlords } from "@/features/user/useUser";

interface RentalFiltersProps {
  onStatusFilterChange?: (value: string) => void;
  onPriceFilterChange?: (value: string) => void;
  onAreaFilterChange?: (value: string) => void;
  onLandlordFilterChange?: (value: string) => void;
}

export function RentalFilters({
  onStatusFilterChange,
  onPriceFilterChange,
  onAreaFilterChange,
  onLandlordFilterChange,
}: RentalFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [landlordFilter, setLandlordFilter] = useState<string>("all");
  const { data: landlordsData, isLoading } = useGetLandlords();
  const landlords = landlordsData?.data || [];

  // Hàm để xác định vai trò dựa vào roleId
  const getRoleName = (roleId: number): string => {
    if (roleId === 1) return "Admin";
    if (roleId === 2) return "Chủ trọ";
    if (roleId === 3) return "Khách hàng";
    return "Người dùng";
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    if (onStatusFilterChange) {
      onStatusFilterChange(value);
    }
  };

  const handlePriceChange = (value: string) => {
    setPriceFilter(value);
    if (onPriceFilterChange) {
      onPriceFilterChange(value);
    }
  };

  const handleAreaChange = (value: string) => {
    setAreaFilter(value);
    if (onAreaFilterChange) {
      onAreaFilterChange(value);
    }
  };

  const handleLandlordChange = (value: string) => {
    setLandlordFilter(value);
    if (onLandlordFilterChange) {
      onLandlordFilterChange(value);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {onStatusFilterChange && (
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
      )}

      {onPriceFilterChange && (
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
      )}

      {onLandlordFilterChange && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Chủ sở hữu:</span>
          <Select value={landlordFilter} onValueChange={handleLandlordChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Chọn chủ sở hữu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {landlords.map((landlord) => (
                <SelectItem key={landlord.id} value={String(landlord.id)}>
                  {landlord.name} ({getRoleName(landlord.roleId)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
