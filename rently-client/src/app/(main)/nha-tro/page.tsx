"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  ArrowDownUp,
} from "lucide-react";

import rentalApiRequest from "@/features/rental/rental.api";
import { RentalType } from "@/schemas/rental.schema";

// Import động bản đồ để tránh lỗi SSR
const RentalsMap = dynamic(() => import("@/features/map/rentals-map"), {
  ssr: false,
});

// Component để loading
const RentalListingPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
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
            <Card key={i} className="overflow-hidden">
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

  const limit = 10; // số lượng nhà trọ trên mỗi trang

  // Lấy dữ liệu nhà trọ
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        setLoading(true);
        const pageParam = searchParams.get("page");
        const page = pageParam ? parseInt(pageParam, 10) : 1;
        setCurrentPage(page);

        const response = await rentalApiRequest.list({
          limit,
          page,
          title: searchTerm || undefined,
        });

        if (response.status === 200 && response.payload) {
          setRentals(response.payload.data);
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
  }, [searchParams, searchTerm]);

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

    // Sắp xếp danh sách nhà trọ
    const sortedRentals = [...rentals];
    switch (value) {
      case "price-asc":
        sortedRentals.sort((a, b) => {
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
        sortedRentals.sort((a, b) => {
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
        sortedRentals.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        });
        break;
      default:
        // Mặc định không sắp xếp, giữ nguyên thứ tự từ API
        break;
    }

    setRentals(sortedRentals);
  };

  const toggleMap = () => {
    setShowMap((prev) => !prev);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Đường dẫn điều hướng */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link
          href="/"
          className="hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Trang chủ</span>
        </Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Nhà trọ</span>
      </div>

      {/* Tiêu đề và công cụ tìm kiếm */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Danh sách nhà trọ
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tìm kiếm nhà trọ phù hợp với nhu cầu của bạn
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-8">
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

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Bed className="h-3 w-3 mr-1" /> Phòng trọ
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <DollarSign className="h-3 w-3 mr-1" /> Dưới 3 triệu
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <MapPin className="h-3 w-3 mr-1" /> Gần trường học
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Ruler className="h-3 w-3 mr-1" /> Trên 20m²
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs gap-1"
            >
              <Sliders className="h-3 w-3" /> Thêm bộ lọc
            </Button>
          </div>
        </form>
      </div>

      {/* Hiển thị bản đồ nếu được bật */}
      {showMap && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
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
              <Card key={i} className="overflow-hidden">
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
        <div className="text-center p-8">
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
        <div className="text-center p-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Không tìm thấy nhà trọ nào phù hợp với tìm kiếm của bạn
          </p>
          <Button
            onClick={() => {
              setSearchTerm("");
              router.push("/nha-tro");
            }}
            variant="outline"
            size="sm"
          >
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {rentals.map((rental) => (
            <Link
              href={`/nha-tro/${rental.id}`}
              key={rental.id}
              className="block"
            >
              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                <div className="relative h-48">
                  {rental.rentalImages && rental.rentalImages.length > 0 ? (
                    <Image
                      src={rental.rentalImages[0].imageUrl}
                      alt={rental.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700">
                      <Home className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                    {rental.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">
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
                    <Button size="sm" variant="outline">
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
