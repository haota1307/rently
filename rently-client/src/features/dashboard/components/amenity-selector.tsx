import { useEffect, useState } from "react";
import { useGetAmenities } from "@/features/amenity/useAmenity";
import { AmenityType } from "@/schemas/amenity.schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AmenitySelectorProps {
  selectedAmenities: AmenityType[];
  onChange: (amenities: AmenityType[]) => void;
  maxHeight?: string;
}

export function AmenitySelector({
  selectedAmenities,
  onChange,
  maxHeight = "300px",
}: AmenitySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAmenities, setFilteredAmenities] = useState<AmenityType[]>([]);

  const { data: amenitiesData, isLoading } = useGetAmenities({
    page: 1,
    limit: 100,
  });

  const amenities = amenitiesData?.data || [];

  // Lọc tiện ích khi searchTerm thay đổi
  useEffect(() => {
    if (amenities.length > 0) {
      if (searchTerm.trim() === "") {
        setFilteredAmenities(amenities);
      } else {
        const filtered = amenities.filter((amenity) =>
          amenity.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredAmenities(filtered);
      }
    }
  }, [searchTerm, amenities]);

  // Kiểm tra xem tiện ích có được chọn không
  const isSelected = (id: number) => {
    return selectedAmenities.some((amenity) => amenity.id === id);
  };

  // Xử lý khi thay đổi lựa chọn tiện ích
  const handleToggleAmenity = (amenity: AmenityType) => {
    if (isSelected(amenity.id)) {
      onChange(selectedAmenities.filter((a) => a.id !== amenity.id));
    } else {
      onChange([...selectedAmenities, amenity]);
    }
  };

  // Xóa một tiện ích đã chọn
  const handleRemoveSelected = (id: number) => {
    onChange(selectedAmenities.filter((amenity) => amenity.id !== id));
  };

  return (
    <div className="space-y-2">
      {/* Hiển thị các tiện ích đã chọn */}
      <ScrollArea className="h-[38px] w-full pb-1">
        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
          {selectedAmenities.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">
              Chưa có tiện ích nào được chọn
            </p>
          ) : (
            selectedAmenities.map((amenity) => (
              <Badge
                key={amenity.id}
                variant="secondary"
                className="flex items-center gap-1 text-xs py-1"
              >
                {amenity.name}
                <button
                  type="button"
                  onClick={() => handleRemoveSelected(amenity.id)}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                  <span className="sr-only">Xóa {amenity.name}</span>
                </button>
              </Badge>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Ô tìm kiếm tiện ích */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Tìm kiếm tiện ích..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 text-sm h-8"
        />
      </div>

      {/* Danh sách tiện ích có thể scroll */}
      <div className="border rounded-md">
        <ScrollArea className="p-2 rounded-md" style={{ height: maxHeight }}>
          <div className="space-y-1.5 pr-3">
            {isLoading ? (
              // Trạng thái loading
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-[200px] rounded" />
                </div>
              ))
            ) : filteredAmenities.length === 0 ? (
              <p className="text-center text-muted-foreground py-2 text-xs">
                {searchTerm.trim() !== ""
                  ? "Không tìm thấy tiện ích phù hợp"
                  : "Không có tiện ích nào"}
              </p>
            ) : (
              filteredAmenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center space-x-2 py-0.5"
                >
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={isSelected(amenity.id)}
                    onCheckedChange={() => handleToggleAmenity(amenity)}
                    className="h-3.5 w-3.5"
                  />
                  <Label
                    htmlFor={`amenity-${amenity.id}`}
                    className="cursor-pointer text-sm"
                  >
                    {amenity.name}
                  </Label>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
