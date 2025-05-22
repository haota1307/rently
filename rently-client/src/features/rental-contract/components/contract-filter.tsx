import { Label } from "@/components/ui/label";
import { Contract } from "./contract-table";
import { CONTRACT_STATUS_LABELS, ContractStatus } from "../contract.constants";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ContractFilterProps {
  onStatusChange: (status: ContractStatus | undefined) => void;
  onSearchChange: (search: string) => void;
  selectedStatus: ContractStatus | "ALL" | undefined;
  searchTerm: string;
}

export function ContractFilter({
  onStatusChange,
  onSearchChange,
  selectedStatus = "ALL",
  searchTerm = "",
}: ContractFilterProps) {
  const handleStatusChange = (value: string) => {
    if (value === "ALL") {
      onStatusChange(undefined);
    } else {
      onStatusChange(value as ContractStatus);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm theo mã hợp đồng, người thuê..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="w-full lg:w-[200px]">
        <Select value={selectedStatus} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {Object.entries(CONTRACT_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
