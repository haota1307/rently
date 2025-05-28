import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";

interface RoomBillFiltersProps {
  statusValue: string;
  monthValue: Date | undefined;
  onStatusFilterChange: (value: string) => void;
  onMonthFilterChange: (value: Date | undefined) => void;
}

export const RoomBillFilters: React.FC<RoomBillFiltersProps> = ({
  statusValue,
  monthValue,
  onStatusFilterChange,
  onMonthFilterChange,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex flex-col gap-2">
        <Label htmlFor="status-filter">Trạng thái thanh toán</Label>
        <Select value={statusValue} onValueChange={onStatusFilterChange}>
          <SelectTrigger id="status-filter" className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="true">Đã thanh toán</SelectItem>
            <SelectItem value="false">Chưa thanh toán</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Kỳ hóa đơn</Label>
        <DatePicker
          date={monthValue}
          onSelect={onMonthFilterChange}
          className="w-[180px]"
        />
      </div>
    </div>
  );
};
