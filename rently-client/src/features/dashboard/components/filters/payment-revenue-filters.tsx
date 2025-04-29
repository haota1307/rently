import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PaymentRevenueFilters = ({
  onFilterChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  activeFilter,
  activeStatus,
  onStatusChange,
}: {
  onFilterChange: (type: string) => void;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  activeFilter: string;
  activeStatus: string;
  onStatusChange: (status: string) => void;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("all")}
        >
          Tất cả
        </Button>
        <Button
          variant={activeFilter === "income" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("income")}
        >
          Tiền vào
        </Button>
        <Button
          variant={activeFilter === "expense" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("expense")}
        >
          Tiền ra
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1">
          <Select value={activeStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="PENDING">Đang xử lý</SelectItem>
              <SelectItem value="FAILED">Thất bại</SelectItem>
              <SelectItem value="CANCELED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DatePicker date={startDate} onSelect={onStartDateChange} />
        <span>đến</span>
        <DatePicker date={endDate} onSelect={onEndDateChange} />
      </div>
    </div>
  );
};
