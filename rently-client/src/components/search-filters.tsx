"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function SearchFilters() {
  // Giá trị mặc định cho bộ lọc
  const [selectedDistance, setSelectedDistance] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Danh sách tiện ích
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

  // Lưu giá trị được chọn từ Select
  const handleDistanceChange = (value: string) => setSelectedDistance(value);
  const handleAreaChange = (value: string) => setSelectedArea(value);
  const handlePriceChange = (value: string) => setSelectedPrice(value);

  // Hàm xử lý khi nhấn nút "Áp dụng" bộ lọc
  const applyFilters = () => {
    const filters = {
      distance: selectedDistance,
      area: selectedArea,
      priceRange: selectedPrice,
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
              <SelectItem value="0-20">Dưới 20 m²</SelectItem>
              <SelectItem value="20-30">20 m² - 30 m²</SelectItem>
              <SelectItem value="30-50">30 m² - 50 m²</SelectItem>
              <SelectItem value=">50">Trên 50 m²</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bộ lọc khoảng giá*/}
        <div className="space-y-2">
          <Label htmlFor="price">Khoảng giá</Label>
          <Select onValueChange={handlePriceChange}>
            <SelectTrigger id="price" className="w-full">
              <SelectValue placeholder="Chọn khoảng giá" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1000000">Dưới 1 triệu VND</SelectItem>
              <SelectItem value="1000000-3000000">
                1 triệu - 3 triệu VND
              </SelectItem>
              <SelectItem value="3000000-50000000">
                3 triệu - 5 triệu VND
              </SelectItem>
              <SelectItem value=">5000000">Trên 5 triệu VND</SelectItem>
            </SelectContent>
          </Select>
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
