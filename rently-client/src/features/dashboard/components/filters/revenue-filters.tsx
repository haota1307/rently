"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RevenueFiltersProps {
  onTypeFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onMonthFilterChange: (value: string) => void;
}

export function RevenueFilters({
  onTypeFilterChange,
  onStatusFilterChange,
  onMonthFilterChange,
}: RevenueFiltersProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    onTypeFilterChange(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onStatusFilterChange(value);
  };

  const handleMonthChange = (value: string) => {
    setMonthFilter(value);
    onMonthFilterChange(value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Loại giao dịch:</span>
        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="subscription">Đăng ký gói</SelectItem>
            <SelectItem value="listing">Đăng tin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Trạng thái:</span>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="pending">Đang xử lý</SelectItem>
            <SelectItem value="failed">Thất bại</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Tháng:</span>
        <Select value={monthFilter} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn tháng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="1">Tháng 1</SelectItem>
            <SelectItem value="2">Tháng 2</SelectItem>
            <SelectItem value="3">Tháng 3</SelectItem>
            <SelectItem value="4">Tháng 4</SelectItem>
            <SelectItem value="5">Tháng 5</SelectItem>
            <SelectItem value="6">Tháng 6</SelectItem>
            <SelectItem value="7">Tháng 7</SelectItem>
            <SelectItem value="8">Tháng 8</SelectItem>
            <SelectItem value="9">Tháng 9</SelectItem>
            <SelectItem value="10">Tháng 10</SelectItem>
            <SelectItem value="11">Tháng 11</SelectItem>
            <SelectItem value="12">Tháng 12</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
