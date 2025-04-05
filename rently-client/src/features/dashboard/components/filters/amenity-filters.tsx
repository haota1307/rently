import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AmenityFiltersProps {
  onSortChange: (value: string) => void;
}

export function AmenityFilters({ onSortChange }: AmenityFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="grid gap-2 w-full">
        <Label htmlFor="sort">Sắp xếp theo</Label>
        <Select defaultValue="newest" onValueChange={onSortChange}>
          <SelectTrigger id="sort" className="min-w-[180px] w-full">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
            <SelectItem value="name-asc">Tên (A-Z)</SelectItem>
            <SelectItem value="name-desc">Tên (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
