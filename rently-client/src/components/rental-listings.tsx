"use client";

import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Grid3X3, LayoutList } from "lucide-react";
import { RentalCard } from "@/components/rental-card";

// Dữ liệu mẫu
const SAMPLE_LISTINGS = [
  {
    id: "1",
    title: "Phòng trọ cao cấp gần trung tâm",
    address: "Quận 1, TP. Hồ Chí Minh",
    price: 3500000,
    area: 25,
    images: ["/placeholder.svg?height=200&width=300"],
    amenities: ["Điều hòa", "Wi-Fi", "Chỗ để xe"],
    distance: 1.2,
    isNew: true,
  },
  {
    id: "2",
    title: "Căn hộ mini đầy đủ nội thất",
    address: "Quận 2, TP. Hồ Chí Minh",
    price: 4200000,
    area: 30,
    images: ["/placeholder.svg?height=200&width=300"],
    amenities: ["Điều hòa", "Wi-Fi", "Tủ lạnh", "Máy giặt"],
    distance: 2.5,
    isNew: true,
  },
  {
    id: "3",
    title: "Phòng trọ giá rẻ cho sinh viên",
    address: "Quận Thủ Đức, TP. Hồ Chí Minh",
    price: 1800000,
    area: 18,
    images: ["/placeholder.svg?height=200&width=300"],
    amenities: ["Wi-Fi", "Chỗ để xe"],
    distance: 3.8,
    isNew: false,
  },
  {
    id: "4",
    title: "Căn hộ dịch vụ cao cấp",
    address: "Quận 3, TP. Hồ Chí Minh",
    price: 6500000,
    area: 45,
    images: ["/placeholder.svg?height=200&width=300"],
    amenities: ["Điều hòa", "Wi-Fi", "Tủ lạnh", "Máy giặt", "Bảo vệ 24/7"],
    distance: 0.8,
    isNew: false,
  },
  {
    id: "5",
    title: "Phòng trọ mới xây gần chợ",
    address: "Quận 7, TP. Hồ Chí Minh",
    price: 2500000,
    area: 22,
    images: ["/placeholder.svg?height=200&width=300"],
    amenities: ["Điều hòa", "Wi-Fi", "Chỗ để xe"],
    distance: 1.5,
    isNew: true,
  },
  {
    id: "6",
    title: "Phòng trọ tiện nghi gần trường đại học",
    address: "Quận Bình Thạnh, TP. Hồ Chí Minh",
    price: 2800000,
    area: 20,
    images: ["/placeholder.svg?height=200&width=300"],
    amenities: ["Điều hòa", "Wi-Fi", "Chỗ để xe", "Tủ quần áo"],
    distance: 2.0,
    isNew: false,
  },
];

export default function RentalListings() {
  const [sortOption, setSortOption] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">
            Hiển thị {SAMPLE_LISTINGS.length} kết quả
          </p>
          {/* <Badge variant="outline" className="ml-2"></Badge> */}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger>
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="price-asc">Giá: Thấp đến cao</SelectItem>
              <SelectItem value="price-desc">Giá: Cao đến thấp</SelectItem>
              <SelectItem value="area-asc">Diện tích: Nhỏ đến lớn</SelectItem>
              <SelectItem value="area-desc">Diện tích: Lớn đến nhỏ</SelectItem>
              <SelectItem value="distance">Khoảng cách</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden sm:flex border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-none ${
                viewMode === "grid" ? "bg-muted" : ""
              }`}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-none ${
                viewMode === "list" ? "bg-muted" : ""
              }`}
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "grid grid-cols-1 gap-4"
        }
      >
        {SAMPLE_LISTINGS.map((listing) => (
          <RentalCard key={listing.id} listing={listing} viewMode={viewMode} />
        ))}
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
