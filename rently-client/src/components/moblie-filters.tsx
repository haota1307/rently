"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAmenities } from "@/features/amenity/useAmenity";
import { AmenityType } from "@/schemas/amenity.schema";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterValues } from "./search-filters";

interface MobileFiltersProps {
  onFiltersChange: (filters: FilterValues) => void;
}

export function MobileFilters({ onFiltersChange }: MobileFiltersProps) {
  // Định nghĩa trạng thái cho các bộ lọc
  const [selectedDistance, setSelectedDistance] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedPrice, setSelectedPrice] = useState<string>("all");
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [open, setOpen] = useState(false);

  // Lấy danh sách tiện ích từ API
  const { data: amenitiesData, isLoading } = useGetAmenities();
  const amenities = amenitiesData?.data || [];

  const toggleAmenity = (id: number) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDistanceChange = (value: string) => setSelectedDistance(value);
  const handleAreaChange = (value: string) => setSelectedArea(value);
  const handlePriceChange = (value: string) => setSelectedPrice(value);

  const applyFilters = () => {
    const filters: FilterValues = {};

    // Chỉ đưa vào filters các giá trị khác "all"
    if (selectedDistance !== "all") filters.distance = selectedDistance;
    if (selectedArea !== "all") filters.area = selectedArea;
    if (selectedPrice !== "all") filters.price = selectedPrice;
    if (selectedAmenities.length > 0) filters.amenities = selectedAmenities;

    // Gọi callback để thông báo lên component cha
    onFiltersChange(filters);
    setOpen(false); // Đóng sheet sau khi áp dụng bộ lọc
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          <Filter className="mr-2 h-4 w-4" />
          Lọc kết quả
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Bộ lọc tìm kiếm</SheetTitle>
          <SheetDescription>
            Điều chỉnh các bộ lọc để tìm phòng trọ phù hợp với nhu cầu của bạn.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-4 overflow-y-auto max-h-[calc(85vh-10rem)]">
          {/* Bộ lọc khoảng cách */}
          <div className="space-y-2">
            <Label htmlFor="mobile-distance">Khoảng cách</Label>
            <Select
              value={selectedDistance}
              onValueChange={handleDistanceChange}
            >
              <SelectTrigger id="mobile-distance">
                <SelectValue placeholder="Chọn khoảng cách" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoảng cách</SelectItem>
                <SelectItem value="0-3">Dưới 3 Km</SelectItem>
                <SelectItem value="3-5">3 Km - 5 Km</SelectItem>
                <SelectItem value="5-10">5 Km - 10 Km</SelectItem>
                <SelectItem value=">10">Trên 10 Km</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bộ lọc diện tích */}
          <div className="space-y-2">
            <Label htmlFor="mobile-area">Diện tích</Label>
            <Select value={selectedArea} onValueChange={handleAreaChange}>
              <SelectTrigger id="mobile-area">
                <SelectValue placeholder="Chọn diện tích" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả diện tích</SelectItem>
                <SelectItem value="0-20">Dưới 20 m²</SelectItem>
                <SelectItem value="20-30">20 m² - 30 m²</SelectItem>
                <SelectItem value="30-50">30 m² - 50 m²</SelectItem>
                <SelectItem value=">50">Trên 50 m²</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bộ lọc khoảng giá */}
          <div className="space-y-2">
            <Label htmlFor="mobile-price">Khoảng giá</Label>
            <Select value={selectedPrice} onValueChange={handlePriceChange}>
              <SelectTrigger id="mobile-price">
                <SelectValue placeholder="Chọn khoảng giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức giá</SelectItem>
                <SelectItem value="0-1000000">Dưới 1 triệu VND</SelectItem>
                <SelectItem value="1000000-3000000">
                  1 triệu - 3 triệu VND
                </SelectItem>
                <SelectItem value="3000000-5000000">
                  3 triệu - 5 triệu VND
                </SelectItem>
                <SelectItem value=">5000000">Trên 5 triệu VND</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bộ lọc tiện ích */}
          <div className="space-y-3">
            <Label>Tiện ích</Label>
            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-6 w-16 rounded-full" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity: AmenityType) => (
                  <Badge
                    key={amenity.id}
                    variant={
                      selectedAmenities.includes(amenity.id)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer transition-all"
                    onClick={() => toggleAmenity(amenity.id)}
                  >
                    {amenity.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <SheetFooter className="pt-2">
          <Button className="w-full" onClick={applyFilters}>
            Áp dụng
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
