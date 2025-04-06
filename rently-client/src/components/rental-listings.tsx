"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Grid3X3, LayoutList, X } from "lucide-react";
import { RentalCard } from "@/components/rental-card";
import { useGetPosts } from "@/features/post/usePost";
import { PostType } from "@/schemas/post.schema";
import { useSearchParams } from "next/navigation";
import { FilterValues } from "./search-filters";
import { Badge } from "@/components/ui/badge";
import { useGetAmenities } from "@/features/amenity/useAmenity";

// Định nghĩa interface cho dữ liệu truyền vào RentalCard
export interface Listing {
  id: string;
  title: string;
  address: string;
  price: number;
  area: number;
  images: string[];
  amenities: string[];
  amenityIds: number[];
  distance: number;
  isNew?: boolean;
  rentalId?: string;
  rentalTitle?: string;
}

interface RentalListingsProps {
  filters?: FilterValues;
  onFiltersChange?: (filters: FilterValues) => void;
}

export default function RentalListings({
  filters = {},
  onFiltersChange,
}: RentalListingsProps) {
  const searchParams = useSearchParams();
  const [sortOption, setSortOption] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Lấy thông tin tìm kiếm từ URL (chỉ phần tìm kiếm, không phải filter)
  const title = searchParams.get("title") || undefined;

  // Lấy thông tin từ filters prop thay vì URL
  const {
    distance,
    area: areaFilter,
    price,
    amenities: amenityIds = [],
  } = filters;

  // Đếm số lượng bộ lọc đang được áp dụng
  const activeFilterCount = Object.keys(filters).length;

  const { data, isLoading } = useGetPosts({
    page,
    limit,
    title,
  });
  const postsData = data;

  const posts = postsData?.data || [];
  const totalPages = postsData?.totalPages || 1;

  // Tạo danh sách bài đăng từ dữ liệu post
  const listings: Listing[] = [];

  posts.forEach((post: PostType) => {
    // Lấy thông tin phòng từ bài đăng
    const room = post.room;
    const rental = post.rental;

    if (!room || !rental) return;

    // Lấy hình ảnh phòng hoặc nhà trọ
    let images: string[] = ["/placeholder.svg?height=200&width=300"];

    if (room.roomImages && room.roomImages.length > 0) {
      images = room.roomImages.map((img) => img.imageUrl);
    } else if (rental.rentalImages && rental.rentalImages.length > 0) {
      images = rental.rentalImages.map((img) => img.imageUrl);
    }

    // Kiểm tra xem bài đăng có phải là mới không
    const creationDate = post.createdAt ? new Date(post.createdAt) : new Date();
    const isNew = creationDate.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Lấy giá và diện tích từ thông tin phòng
    const price = room.price;
    const area = room.area;

    // Lấy danh sách tiện ích
    const amenities = room.roomAmenities
      ? room.roomAmenities.map((amenity) => amenity.amenity.name)
      : [];

    // Lấy danh sách ID của tiện ích
    const amenityIds = room.roomAmenities
      ? room.roomAmenities.map((amenity) => amenity.amenityId)
      : [];

    listings.push({
      id: String(post.id),
      title: post.title,
      address: rental.address,
      price,
      area,
      images,
      amenities,
      amenityIds,
      distance: rental.distance !== undefined ? Number(rental.distance) : 0,
      isNew,
      rentalId: String(rental.id),
      rentalTitle: rental.title,
    });
  });

  // Lọc danh sách dựa trên các bộ lọc
  const filteredListings = listings.filter((listing) => {
    // Lọc theo khoảng cách
    if (distance) {
      const [min, max] = distance.includes(">")
        ? [parseFloat(distance.replace(">", "")), Infinity]
        : distance.split("-").map(Number);

      if (listing.distance < min || listing.distance > max) return false;
    }

    // Lọc theo diện tích
    if (areaFilter) {
      const [min, max] = areaFilter.includes(">")
        ? [parseFloat(areaFilter.replace(">", "")), Infinity]
        : areaFilter.split("-").map(Number);

      if (listing.area < min || listing.area > max) return false;
    }

    // Lọc theo giá
    if (price) {
      const [min, max] = price.includes(">")
        ? [parseFloat(price.replace(">", "")), Infinity]
        : price.split("-").map(Number);

      if (listing.price < min || listing.price > max) return false;
    }

    // Lọc theo tiện ích
    if (amenityIds.length > 0) {
      // Chuyển đổi amenityIds sang kiểu số để so sánh đúng với listing.amenityIds
      const numericAmenityIds = amenityIds.map((id) =>
        typeof id === "string" ? parseInt(id, 10) : id
      );

      // Kiểm tra xem tất cả các amenityIds được chọn có nằm trong listing.amenityIds không
      const hasAllAmenities = numericAmenityIds.every((id) =>
        listing.amenityIds.includes(id)
      );

      if (!hasAllAmenities) return false;
    }

    return true;
  });

  // Sắp xếp danh sách theo option được chọn
  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortOption) {
      case "newest":
        return 0; // Giữ thứ tự ban đầu từ API
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "area-asc":
        return a.area - b.area;
      case "area-desc":
        return b.area - a.area;
      case "distance":
        return a.distance - b.distance;
      default:
        return 0;
    }
  });

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Lấy danh sách tiện ích để hiển thị tên thay vì ID
  const { data: amenitiesData } = useGetAmenities();
  const amenitiesList = amenitiesData?.data || [];

  // Hàm để xóa một bộ lọc cụ thể
  const removeFilter = (filterKey: keyof FilterValues, amenityId?: number) => {
    if (!onFiltersChange) return;

    const newFilters = { ...filters };

    if (filterKey === "amenities" && amenityId !== undefined) {
      // Xóa một tiện ích cụ thể
      const newAmenities = (newFilters.amenities || []).filter(
        (id) => id !== amenityId
      );
      if (newAmenities.length === 0) {
        delete newFilters.amenities;
      } else {
        newFilters.amenities = newAmenities;
      }
    } else {
      // Xóa bộ lọc khác
      delete newFilters[filterKey];
    }

    onFiltersChange(newFilters);
  };

  // Tìm tên tiện ích dựa trên ID
  const getAmenityName = (id: number) => {
    const amenity = amenitiesList.find((a) => a.id === id);
    return amenity ? amenity.name : String(id);
  };

  // Lấy nhãn của bộ lọc để hiển thị
  const getFilterLabel = (key: string, value: any) => {
    switch (key) {
      case "distance":
        return `Khoảng cách: ${
          value.includes(">")
            ? `>${value.replace(">", "")}km`
            : `${value.split("-").join("-")}km`
        }`;
      case "area":
        return `Diện tích: ${
          value.includes(">")
            ? `>${value.replace(">", "")}m²`
            : `${value.split("-").join("-")}m²`
        }`;
      case "price":
        return `Giá: ${
          value.includes(">")
            ? `>${value.replace(">", "")}đ`
            : `${value.split("-").join("-")}đ`
        }`;
      default:
        return `${key}: ${value}`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground">
            Hiển thị {sortedListings.length} kết quả
            {activeFilterCount > 0 && (
              <span> với {activeFilterCount} bộ lọc</span>
            )}
          </p>

          {activeFilterCount > 0 && onFiltersChange && (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(filters).map(([key, value]) => {
                if (key === "amenities") {
                  // Hiển thị từng tiện ích dưới dạng badge riêng biệt
                  return (value as number[]).map((amenityId) => (
                    <Badge
                      key={`amenity-${amenityId}`}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {getAmenityName(amenityId)}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFilter("amenities", amenityId)}
                      />
                    </Badge>
                  ));
                }
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {getFilterLabel(key, value)}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFilter(key as keyof FilterValues)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
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

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <p>Đang tải...</p>
        </div>
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "grid grid-cols-1 gap-4"
            }
          >
            {sortedListings.length > 0 ? (
              sortedListings.map((listing) => (
                <RentalCard
                  key={listing.id}
                  listing={listing}
                  viewMode={viewMode}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p>Không tìm thấy kết quả nào</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(page - 1)}
                    className={
                      page <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {[...Array(totalPages)]
                  .map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        onClick={() => handlePageChange(index + 1)}
                        isActive={page === index + 1}
                        className="cursor-pointer"
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))
                  .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(page + 1)}
                    className={
                      page >= totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
