import { useEffect, useState } from "react";
import { useGetAmenities } from "@/features/amenity/useAmenity";
import { AmenityType } from "@/schemas/amenity.schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";

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
  const { data: amenitiesData, isLoading } = useGetAmenities({
    page: 1,
    limit: 100,
    name: searchTerm || undefined,
  });

  const amenities = amenitiesData?.data || [];

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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {selectedAmenities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có tiện ích nào được chọn
          </p>
        ) : (
          selectedAmenities.map((amenity) => (
            <Badge
              key={amenity.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {amenity.name}
              <button
                type="button"
                onClick={() => handleRemoveSelected(amenity.id)}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Xóa {amenity.name}</span>
              </button>
            </Badge>
          ))
        )}
      </div>

      <ScrollArea className={`border rounded-md p-4`} style={{ maxHeight }}>
        <div className="space-y-2">
          {isLoading ? (
            // Trạng thái loading
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-[200px] rounded" />
              </div>
            ))
          ) : amenities.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Không tìm thấy tiện ích nào
            </p>
          ) : (
            amenities.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity.id}`}
                  checked={isSelected(amenity.id)}
                  onCheckedChange={() => handleToggleAmenity(amenity)}
                />
                <Label
                  htmlFor={`amenity-${amenity.id}`}
                  className="cursor-pointer"
                >
                  {amenity.name}
                </Label>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
