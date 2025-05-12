"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/pagination";
import {
  House,
  MapPin,
  Ruler,
  Search,
  Home,
  Bed,
  DollarSign,
  Sliders,
  Filter,
  SquareX,
  ArrowUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/page-header";

import rentalApiRequest from "@/features/rental/rental.api";
import { RentalType } from "@/schemas/rental.schema";
import { formatPrice } from "@/lib/utils";

// Import động bản đồ để tránh lỗi SSR
const RentalsMap = dynamic(() => import("@/features/map/rentals-map"), {
  ssr: false,
});

// Định nghĩa các kiểu dữ liệu
type FiltersType = {
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  roomTypes: string[];
};

type ActiveFiltersType = {
  price?: boolean;
  area?: boolean;
  roomTypes?: boolean;
  [key: string]: boolean | undefined;
};

// Định nghĩa kiểu cho FilterSidebar props
interface FilterSidebarProps {
  filters: FiltersType;
  setFilters: React.Dispatch<React.SetStateAction<FiltersType>>;
  applyFilters: () => void;
  resetFilters: () => void;
}

// Component để loading
const RentalListingPageSkeleton = () => {
  return (
    <div className=" mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Skeleton className="h-6 w-24" />
        <span>/</span>
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card
              key={i}
              className="overflow-hidden border border-gray-100 dark:border-gray-800"
            >
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
};

// Filter sidebar component với kiểu TypeScript
const FilterSidebar = ({
  filters,
  setFilters,
  applyFilters,
  resetFilters,
}: FilterSidebarProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-9">
          <Filter className="h-4 w-4" />
          <span>Bộ lọc</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Lọc nhà trọ</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] py-4">
          <div className="px-4">
            {/* Khoảng giá */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Khoảng giá</h3>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs">{formatPrice(0)}</span>
                  <span className="text-xs">{formatPrice(10000000)}</span>
                </div>
                <Slider
                  defaultValue={[0, filters.maxPrice || 10000000]}
                  min={0}
                  max={10000000}
                  step={500000}
                  onValueChange={(values) => {
                    setFilters({
                      ...filters,
                      minPrice: values[0],
                      maxPrice: values[1],
                    });
                  }}
                />
                <div className="flex justify-between mt-2">
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(filters.minPrice || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(filters.maxPrice || 10000000)}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Diện tích */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Diện tích</h3>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs">0 m²</span>
                  <span className="text-xs">100 m²</span>
                </div>
                <Slider
                  defaultValue={[0, filters.maxArea || 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(values) => {
                    setFilters({
                      ...filters,
                      minArea: values[0],
                      maxArea: values[1],
                    });
                  }}
                />
                <div className="flex justify-between mt-2">
                  <div className="text-xs text-muted-foreground">
                    {filters.minArea || 0} m²
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {filters.maxArea || 100} m²
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Loại phòng */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Loại phòng</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="room-type-single"
                    checked={filters.roomTypes?.includes("single")}
                    onCheckedChange={(checked) => {
                      const newRoomTypes = [...(filters.roomTypes || [])];
                      if (checked) {
                        if (!newRoomTypes.includes("single")) {
                          newRoomTypes.push("single");
                        }
                      } else {
                        const index = newRoomTypes.indexOf("single");
                        if (index > -1) {
                          newRoomTypes.splice(index, 1);
                        }
                      }
                      setFilters({ ...filters, roomTypes: newRoomTypes });
                    }}
                  />
                  <Label htmlFor="room-type-single">Phòng đơn</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="room-type-shared"
                    checked={filters.roomTypes?.includes("shared")}
                    onCheckedChange={(checked) => {
                      const newRoomTypes = [...(filters.roomTypes || [])];
                      if (checked) {
                        if (!newRoomTypes.includes("shared")) {
                          newRoomTypes.push("shared");
                        }
                      } else {
                        const index = newRoomTypes.indexOf("shared");
                        if (index > -1) {
                          newRoomTypes.splice(index, 1);
                        }
                      }
                      setFilters({ ...filters, roomTypes: newRoomTypes });
                    }}
                  />
                  <Label htmlFor="room-type-shared">Phòng ghép</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="room-type-studio"
                    checked={filters.roomTypes?.includes("studio")}
                    onCheckedChange={(checked) => {
                      const newRoomTypes = [...(filters.roomTypes || [])];
                      if (checked) {
                        if (!newRoomTypes.includes("studio")) {
                          newRoomTypes.push("studio");
                        }
                      } else {
                        const index = newRoomTypes.indexOf("studio");
                        if (index > -1) {
                          newRoomTypes.splice(index, 1);
                        }
                      }
                      setFilters({ ...filters, roomTypes: newRoomTypes });
                    }}
                  />
                  <Label htmlFor="room-type-studio">Phòng Studio</Label>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row justify-between gap-2 p-4 border-t">
          <Button variant="outline" className="flex-1" onClick={resetFilters}>
            <SquareX className="h-4 w-4 mr-2" />
            Đặt lại
          </Button>
          <SheetClose asChild>
            <Button className="flex-1" onClick={applyFilters}>
              Áp dụng
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// Component chính được bọc trong Suspense
const RentalListingContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rentals, setRentals] = useState<RentalType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [sortOption, setSortOption] = useState("default");
  const [filters, setFilters] = useState<FiltersType>({
    minPrice: 0,
    maxPrice: 10000000,
    minArea: 0,
    maxArea: 100,
    roomTypes: [],
  });
  const [activeFilters, setActiveFilters] = useState<ActiveFiltersType>({});

  const limit = 9; // số lượng nhà trọ trên mỗi trang

  // Đọc các tham số từ URL khi lần đầu tải trang
  useEffect(() => {
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page") || "1", 10)
      : 1;
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "default";
    const minPrice = searchParams.get("minPrice")
      ? parseInt(searchParams.get("minPrice") || "0", 10)
      : 0;
    const maxPrice = searchParams.get("maxPrice")
      ? parseInt(searchParams.get("maxPrice") || "10000000", 10)
      : 10000000;
    const minArea = searchParams.get("minArea")
      ? parseInt(searchParams.get("minArea") || "0", 10)
      : 0;
    const maxArea = searchParams.get("maxArea")
      ? parseInt(searchParams.get("maxArea") || "100", 10)
      : 100;
    const roomTypes = searchParams.get("roomTypes")
      ? (searchParams.get("roomTypes") || "").split(",")
      : [];

    setCurrentPage(page);
    setSearchTerm(search);
    setSortOption(sort);
    setFilters({
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      roomTypes,
    });

    // Tạo object chứa các filter đang áp dụng để hiển thị
    const newActiveFilters: ActiveFiltersType = {};
    if (minPrice > 0 || maxPrice < 10000000) {
      newActiveFilters.price = true;
    }
    if (minArea > 0 || maxArea < 100) {
      newActiveFilters.area = true;
    }
    if (roomTypes.length > 0) {
      newActiveFilters.roomTypes = true;
    }
    setActiveFilters(newActiveFilters);
  }, [searchParams]);

  // Định nghĩa kiểu dữ liệu cho tham số API
  interface ApiParamsType {
    limit: number;
    page: number;
    title?: string;
    price?: string;
    area?: string;
    roomTypes?: string;
    [key: string]: any;
  }

  // Chuẩn bị các tham số API dựa trên bộ lọc hiện tại
  const apiParams = useMemo<ApiParamsType>(() => {
    const params: ApiParamsType = {
      limit,
      page: searchParams.get("page")
        ? parseInt(searchParams.get("page") || "1", 10)
        : 1,
      title: searchParams.get("search") || undefined,
    };

    // Thêm bộ lọc giá nếu có
    if (searchParams.has("minPrice") || searchParams.has("maxPrice")) {
      const minPrice = searchParams.get("minPrice") || "0";
      const maxPrice = searchParams.get("maxPrice") || "10000000";
      params.price = `${minPrice},${maxPrice}`;
    }

    // Thêm bộ lọc diện tích nếu có
    if (searchParams.has("minArea") || searchParams.has("maxArea")) {
      const minArea = searchParams.get("minArea") || "0";
      const maxArea = searchParams.get("maxArea") || "100";
      params.area = `${minArea},${maxArea}`;
    }

    // Thêm bộ lọc loại phòng nếu có
    if (searchParams.has("roomTypes")) {
      params.roomTypes = searchParams.get("roomTypes") || undefined;
    }

    return params;
  }, [searchParams, limit]);

  // Lấy dữ liệu nhà trọ
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        setLoading(true);

        const response = await rentalApiRequest.list(apiParams);

        if (response.status === 200 && response.payload) {
          let resultData = response.payload.data;

          // Lọc theo roomTypes nếu có (chỉ xử lý ở client nếu API không hỗ trợ)
          const roomTypes = searchParams.get("roomTypes")?.split(",") || [];
          if (roomTypes.length > 0 && !apiParams.roomTypes) {
            resultData = resultData.filter((rental) => {
              if (!rental.rooms || rental.rooms.length === 0) return false;
              return rental.rooms.some((room) => {
                // Kiểm tra nếu room có thuộc tính type
                const roomType = (room as any).type;
                if (typeof roomType === "string") {
                  return roomTypes.includes(roomType.toLowerCase());
                }
                return false;
              });
            });
          }

          // Áp dụng sắp xếp nếu cần
          const sort = searchParams.get("sort");
          if (sort && sort !== "default") {
            switch (sort) {
              case "price-asc":
                resultData.sort((a, b) => {
                  const aMinPrice =
                    a.rooms && a.rooms.length > 0
                      ? Math.min(...a.rooms.map((r) => r.price))
                      : Infinity;
                  const bMinPrice =
                    b.rooms && b.rooms.length > 0
                      ? Math.min(...b.rooms.map((r) => r.price))
                      : Infinity;
                  return aMinPrice - bMinPrice;
                });
                break;
              case "price-desc":
                resultData.sort((a, b) => {
                  const aMinPrice =
                    a.rooms && a.rooms.length > 0
                      ? Math.min(...a.rooms.map((r) => r.price))
                      : 0;
                  const bMinPrice =
                    b.rooms && b.rooms.length > 0
                      ? Math.min(...b.rooms.map((r) => r.price))
                      : 0;
                  return bMinPrice - aMinPrice;
                });
                break;
              case "newest":
                resultData.sort((a, b) => {
                  const aDate = a.createdAt
                    ? new Date(a.createdAt).getTime()
                    : 0;
                  const bDate = b.createdAt
                    ? new Date(b.createdAt).getTime()
                    : 0;
                  return bDate - aDate;
                });
                break;
            }
          }

          setRentals(resultData);
          setTotalItems(response.payload.totalItems);
          setTotalPages(response.payload.totalPages);
        } else {
          setError("Không thể tải danh sách nhà trọ");
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách nhà trọ:", error);
        setError("Không thể tải danh sách nhà trọ");
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, [apiParams, searchParams]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/nha-tro?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Reset về trang 1 khi tìm kiếm
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    router.push(`/nha-tro?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.set("page", "1"); // Reset về trang 1 khi thay đổi sắp xếp
    router.push(`/nha-tro?${params.toString()}`);
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset về trang 1 khi lọc
    params.set("page", "1");

    // Áp dụng các bộ lọc
    if (filters.minPrice > 0 || filters.maxPrice < 10000000) {
      params.set("minPrice", filters.minPrice.toString());
      params.set("maxPrice", filters.maxPrice.toString());
    } else {
      params.delete("minPrice");
      params.delete("maxPrice");
    }

    if (filters.minArea > 0 || filters.maxArea < 100) {
      params.set("minArea", filters.minArea.toString());
      params.set("maxArea", filters.maxArea.toString());
    } else {
      params.delete("minArea");
      params.delete("maxArea");
    }

    if (filters.roomTypes && filters.roomTypes.length > 0) {
      params.set("roomTypes", filters.roomTypes.join(","));
    } else {
      params.delete("roomTypes");
    }

    // Cập nhật active filters để hiển thị UI
    const newActiveFilters: ActiveFiltersType = {};
    if (filters.minPrice > 0 || filters.maxPrice < 10000000) {
      newActiveFilters.price = true;
    }
    if (filters.minArea > 0 || filters.maxArea < 100) {
      newActiveFilters.area = true;
    }
    if (filters.roomTypes && filters.roomTypes.length > 0) {
      newActiveFilters.roomTypes = true;
    }
    setActiveFilters(newActiveFilters);

    router.push(`/nha-tro?${params.toString()}`);
  };

  const resetFilters = () => {
    setFilters({
      minPrice: 0,
      maxPrice: 10000000,
      minArea: 0,
      maxArea: 100,
      roomTypes: [],
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("minArea");
    params.delete("maxArea");
    params.delete("roomTypes");
    params.set("page", "1");

    setActiveFilters({});

    router.push(`/nha-tro?${params.toString()}`);
  };

  const removeFilter = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());

    switch (type) {
      case "price":
        params.delete("minPrice");
        params.delete("maxPrice");
        setFilters({ ...filters, minPrice: 0, maxPrice: 10000000 });
        const newActiveFilters = { ...activeFilters };
        if (newActiveFilters.price) delete newActiveFilters.price;
        setActiveFilters(newActiveFilters);
        break;
      case "area":
        params.delete("minArea");
        params.delete("maxArea");
        setFilters({ ...filters, minArea: 0, maxArea: 100 });
        const newActiveFilters2 = { ...activeFilters };
        if (newActiveFilters2.area) delete newActiveFilters2.area;
        setActiveFilters(newActiveFilters2);
        break;
      case "roomTypes":
        params.delete("roomTypes");
        setFilters({ ...filters, roomTypes: [] });
        const newActiveFilters3 = { ...activeFilters };
        if (newActiveFilters3.roomTypes) delete newActiveFilters3.roomTypes;
        setActiveFilters(newActiveFilters3);
        break;
    }

    params.set("page", "1");
    router.push(`/nha-tro?${params.toString()}`);
  };

  const toggleMap = () => {
    setShowMap((prev) => !prev);
  };

  return (
    <div className=" mx-auto px-4 py-8">
      {/* Tiêu đề và công cụ tìm kiếm - Thêm PageHeader để đồng bộ UI */}
      <div className="mb-8">
        <PageHeader
          title="Danh sách nhà trọ"
          description={
            totalItems > 0
              ? `Tìm thấy ${totalItems} nhà trọ phù hợp với yêu cầu của bạn`
              : "Tìm kiếm nhà trọ phù hợp với nhu cầu của bạn"
          }
        />
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={toggleMap}
          >
            <MapPin className="h-4 w-4" />
            {showMap ? "Ẩn bản đồ" : "Hiện bản đồ"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1" asChild>
            <Link href="/bai-dang">
              <House className="h-4 w-4" />
              Xem bài đăng
            </Link>
          </Button>
        </div>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-lg shadow-sm mb-6 border border-gray-100 dark:border-gray-800">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <Input
                  placeholder="Tìm kiếm nhà trọ..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Mặc định</SelectItem>
                  <SelectItem value="price-asc">Giá thấp - cao</SelectItem>
                  <SelectItem value="price-desc">Giá cao - thấp</SelectItem>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="gap-1">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Tìm kiếm</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              applyFilters={applyFilters}
              resetFilters={resetFilters}
            />

            {/* Active filters */}
            {Object.keys(activeFilters).length > 0 && (
              <div className="flex flex-wrap gap-2 ml-2">
                {activeFilters.price && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 h-7 px-2"
                  >
                    <span>
                      Giá: {formatPrice(filters.minPrice)} -{" "}
                      {formatPrice(filters.maxPrice)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => removeFilter("price")}
                    >
                      <SquareX className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {activeFilters.area && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 h-7 px-2"
                  >
                    <span>
                      Diện tích: {filters.minArea}m² - {filters.maxArea}m²
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => removeFilter("area")}
                    >
                      <SquareX className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {activeFilters.roomTypes && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 h-7 px-2"
                  >
                    <span>Loại phòng: {filters.roomTypes.join(", ")}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => removeFilter("roomTypes")}
                    >
                      <SquareX className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}

                {Object.keys(activeFilters).length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={resetFilters}
                  >
                    Xóa tất cả
                  </Button>
                )}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Hiển thị bản đồ nếu được bật */}
      {showMap && (
        <div className="mb-8 bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className="h-[500px] w-full">
            <RentalsMap />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Card
                key={i}
                className="overflow-hidden border border-gray-100 dark:border-gray-800"
              >
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
        </div>
      ) : error ? (
        <div className="text-center p-8 bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-red-500 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Thử lại
          </Button>
        </div>
      ) : rentals.length === 0 ? (
        <div className="text-center p-8 bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Không tìm thấy nhà trọ nào phù hợp với tìm kiếm của bạn
          </p>
          <Button onClick={resetFilters} variant="outline" size="sm">
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {rentals.map((rental) => (
            <Link
              href={`/nha-tro/${rental.id}`}
              key={rental.id}
              className="block group"
            >
              <Card className="overflow-hidden h-full hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-800 group-hover:border-gray-200 dark:group-hover:border-gray-700">
                <div className="relative h-48 overflow-hidden">
                  {rental.rentalImages && rental.rentalImages.length > 0 ? (
                    <Image
                      src={rental.rentalImages[0].imageUrl}
                      alt={rental.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700">
                      <Home className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  {/* Thêm badge cho số phòng trống */}
                  {rental.rooms && rental.rooms.length > 0 && (
                    <Badge className="absolute top-2 right-2 bg-primary text-white font-semibold">
                      {rental.rooms.filter((room) => room.isAvailable).length}/
                      {rental.rooms.length} phòng trống
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {rental.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2 flex items-start">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5 text-gray-400" />
                    {rental.address}
                  </p>
                  <div className="flex items-center gap-4 text-sm mb-3">
                    {rental.rooms && rental.rooms.length > 0 && (
                      <>
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4 text-gray-400" />
                          <span>{rental.rooms.length} phòng</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Ruler className="h-4 w-4 text-gray-400" />
                          <span>
                            {Math.min(...rental.rooms.map((r) => r.area))} -{" "}
                            {Math.max(...rental.rooms.map((r) => r.area))} m²
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg text-primary">
                      {rental.rooms && rental.rooms.length > 0
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            maximumFractionDigits: 0,
                          }).format(
                            Math.min(...rental.rooms.map((r) => r.price))
                          ) + "/tháng"
                        : "Liên hệ"}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="group-hover:bg-primary group-hover:text-white transition-colors"
                    >
                      Chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

const RentalListingPage = () => {
  return (
    <Suspense fallback={<RentalListingPageSkeleton />}>
      <RentalListingContent />
    </Suspense>
  );
};

export default RentalListingPage;
