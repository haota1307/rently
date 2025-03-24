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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onStatusFilterChange(value);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    onRoleFilterChange(value);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Trạng thái:</span>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Không hoạt động</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Vai trò:</span>
        <Select value={roleFilter} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="admin">Quản trị viên</SelectItem>
            <SelectItem value="landlord">Người cho thuê</SelectItem>
            <SelectItem value="user">Người dùng</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
