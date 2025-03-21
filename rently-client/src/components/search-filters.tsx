"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function SearchFilters() {
  // Giá trị mặc định cho bộ lọc khoảng giá và diện tích
  const [priceRange, setPriceRange] = useState([1000000, 5000000]);
  const [areaRange, setAreaRange] = useState([15, 50]);

  // Lưu trạng thái cho các bộ lọc dạng select
  const [selectedDistance, setSelectedDistance] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // Lưu danh sách tiện ích đã chọn
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Danh sách các tiện ích
  const amenities = [
    { id: "wifi", label: "Wi-Fi" },
    { id: "ac", label: "Điều hòa" },
    { id: "parking", label: "Chỗ để xe" },
    { id: "security", label: "An ninh" },
    { id: "furniture", label: "Nội thất" },
    { id: "private-wc", label: "WC riêng" },
    { id: "kitchen", label: "Nhà bếp" },
    { id: "pet", label: "Thú cưng" },
  ];

  // Hàm xử lý chọn/toggle tiện ích
  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Lưu giá trị khi chọn khoảng cách và diện tích
  const handleDistanceChange = (value: string) => {
    setSelectedDistance(value);
  };

  const handleAreaChange = (value: string) => {
    setSelectedArea(value);
  };

  // Hàm xử lý khi nhấn nút "Áp dụng" bộ lọc
  const applyFilters = () => {
    // Tùy vào backend, bạn có thể chuyển đổi các giá trị thành object query hợp lệ
    const filters = {
      distance: selectedDistance,
      area: selectedArea,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      amenities: selectedAmenities,
    };

    console.log("Filters applied:", filters);
    // Thực hiện API call hoặc cập nhật state ở đây
  };

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Bộ lọc tìm kiếm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bộ lọc khoảng cách */}
        <div className="space-y-2">
          <Label htmlFor="distance">Khoảng cách</Label>
          <Select onValueChange={handleDistanceChange}>
            <SelectTrigger id="distance" className="w-full">
              <SelectValue placeholder="Chọn khoảng cách" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-3">Dưới 3 Km</SelectItem>
              <SelectItem value="3-5">3 Km - 5 Km</SelectItem>
              <SelectItem value="5-10">5 Km - 10 Km</SelectItem>
              <SelectItem value=">10">Trên 10 Km</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bộ lọc diện tích */}
        <div className="space-y-2">
          <Label htmlFor="area">Diện tích</Label>
          <Select onValueChange={handleAreaChange}>
            <SelectTrigger id="area" className="w-full">
              <SelectValue placeholder="Chọn diện tích" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-20">
                Dưới 20 m<sup>2</sup>
              </SelectItem>
              <SelectItem value="20-30">
                20 m<sup>2</sup> - 30 m<sup>2</sup>
              </SelectItem>
              <SelectItem value="30-50">
                30 m<sup>2</sup> - 50 m<sup>2</sup>
              </SelectItem>
              <SelectItem value=">50">
                Trên 50 m<sup>2</sup>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bộ lọc khoảng giá */}
        <div className="space-y-2">
          <Label htmlFor="price">Khoảng giá</Label>
          <Slider
            id="price"
            defaultValue={priceRange}
            min={0}
            max={10000000}
            step={500000}
            onValueChange={(value) => setPriceRange(value)}
          />
          <div className="flex justify-between text-sm">
            <span>{priceRange[0].toLocaleString()} VND</span>
            <span>{priceRange[1].toLocaleString()} VND</span>
          </div>
        </div>

        {/* Bộ lọc tiện ích */}
        <div className="space-y-3">
          <Label>Tiện ích</Label>
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <Badge
                key={amenity.id}
                variant={
                  selectedAmenities.includes(amenity.id) ? "default" : "outline"
                }
                className="cursor-pointer transition-all"
                onClick={() => toggleAmenity(amenity.id)}
              >
                {amenity.label}
              </Badge>
            ))}
          </div>
        </div>

        <Button className="w-full" onClick={applyFilters}>
          Áp dụng
        </Button>
      </CardContent>
    </Card>
  );
}
