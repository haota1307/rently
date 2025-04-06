import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface CommonFilterLayoutProps {
  searchInput?: string;
  onSearchChange?: (value: string) => void;
  clearAllFilters?: () => void;
  showClearButton?: boolean;
  searchPlaceholder?: string;
  filterControls?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export function CommonFilterLayout({
  searchInput = "",
  onSearchChange,
  clearAllFilters,
  showClearButton = false,
  searchPlaceholder = "Tìm kiếm...",
  filterControls,
  actionButton,
}: CommonFilterLayoutProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
      <div className="flex items-center">{actionButton}</div>

      <div className="flex flex-wrap items-center gap-3">
        {filterControls}

        {onSearchChange && (
          <div className="relative w-full sm:w-auto min-w-[200px]">
            <Input
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-8"
            />
            {searchInput && (
              <X
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => onSearchChange("")}
              />
            )}
          </div>
        )}

        {showClearButton && clearAllFilters && (
          <Button variant="ghost" onClick={clearAllFilters} className="h-9">
            Xóa tất cả bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
