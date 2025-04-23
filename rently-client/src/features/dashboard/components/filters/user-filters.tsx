"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFiltersProps {
  onStatusFilterChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
}

export function UserFilters({
  onStatusFilterChange,
  onRoleFilterChange,
}: UserFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onStatusFilterChange(value);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    onRoleFilterChange(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium whitespace-nowrap w-20">
          Trạng thái:
        </span>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
            <SelectItem value="BLOCKED">Bị khóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium whitespace-nowrap w-20">
          Vai trò:
        </span>
        <Select value={roleFilter} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="1">Quản trị viên</SelectItem>
            <SelectItem value="2">Người cho thuê</SelectItem>
            <SelectItem value="3">Người dùng</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
