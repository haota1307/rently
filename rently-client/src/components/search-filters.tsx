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
  const [priceRange, setPriceRange] = useState([1000000, 5000000]);
  const [areaRange, setAreaRange] = useState([15, 50]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

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

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Bộ lọc tìm kiếm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="location">Khu vực</Label>
          <Select>
            <SelectTrigger id="location" className="w-full">
              <SelectValue placeholder="Chọn khu vực" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hanoi">Hà Nội</SelectItem>
              <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
              <SelectItem value="danang">Đà Nẵng</SelectItem>
              <SelectItem value="cantho">Cần Thơ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">Quận/Huyện</Label>
          <Select>
            <SelectTrigger id="district" className="w-full">
              <SelectValue placeholder="Chọn quận/huyện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quan1">Quận 1</SelectItem>
              <SelectItem value="quan2">Quận 2</SelectItem>
              <SelectItem value="quan3">Quận 3</SelectItem>
              <SelectItem value="quan4">Quận 4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Khoảng giá</Label>
            <span className="text-sm text-muted-foreground">
              {priceRange[0].toLocaleString("vi-VN")}đ -{" "}
              {priceRange[1].toLocaleString("vi-VN")}đ
            </span>
          </div>
          <Slider
            defaultValue={[1000000, 5000000]}
            max={10000000}
            min={500000}
            step={100000}
            value={priceRange}
            onValueChange={setPriceRange}
            className="py-4"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Diện tích</Label>
            <span className="text-sm text-muted-foreground">
              {areaRange[0]}m² - {areaRange[1]}m²
            </span>
          </div>
          <Slider
            defaultValue={[15, 50]}
            max={100}
            min={10}
            step={5}
            value={areaRange}
            onValueChange={setAreaRange}
            className="py-4"
          />
        </div>

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

        <Button className="w-full">Áp dụng</Button>
      </CardContent>
    </Card>
  );
}
