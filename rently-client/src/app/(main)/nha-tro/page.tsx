"use client";

import React, { useState, useEffect } from "react";
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

const RentalListingPage = () => {
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

      {/* Bản đồ */}
      {showMap && (
        <div className="mb-8 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Bản đồ nhà trọ</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nhấp vào marker để xem chi tiết nhà trọ
            </p>
          </div>
          <div className="h-[500px] rounded-lg overflow-hidden">
            <RentalsMap />
          </div>
        </div>
      )}

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Tìm kiếm nhà trọ..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit">Tìm kiếm</Button>
          </form>

          <div className="flex gap-2">
            <div className="w-40">
              <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Mặc định</SelectItem>
                  <SelectItem value="price-asc">Giá: Thấp - Cao</SelectItem>
                  <SelectItem value="price-desc">Giá: Cao - Thấp</SelectItem>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon">
              <Sliders className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Danh sách nhà trọ */}
      <div className="mb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <House className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h2 className="text-xl font-semibold mb-2">
              Không tìm thấy nhà trọ
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button onClick={() => router.push("/")}>Quay lại trang chủ</Button>
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <House className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h2 className="text-xl font-semibold mb-2">
              Không tìm thấy nhà trọ
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Không có nhà trọ nào phù hợp với tìm kiếm của bạn
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentals.map((rental) => (
              <Card
                key={rental.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link href={`/nha-tro/${rental.id}`} className="block">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    {rental.rentalImages && rental.rentalImages.length > 0 ? (
                      <Image
                        src={rental.rentalImages[0].imageUrl}
                        alt={rental.title}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center">
                        <House className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Không có hình ảnh
                        </p>
                      </div>
                    )}
                    {rental.rooms && rental.rooms.length > 0 && (
                      <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                        {rental.rooms.filter((r) => r.isAvailable).length} phòng
                        trống
                      </div>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link href={`/nha-tro/${rental.id}`} className="block">
                    <h2 className="font-semibold text-lg mb-1 line-clamp-1 hover:text-primary transition-colors">
                      {rental.title}
                    </h2>
                  </Link>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">{rental.address}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3 mb-4">
                    {rental.rooms && rental.rooms.length > 0 && (
                      <>
                        <div className="flex items-center gap-1 text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                          <Bed className="h-3.5 w-3.5" />
                          <span>{rental.rooms.length} phòng</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>
                            {Math.min(
                              ...rental.rooms.map((r) => r.price)
                            ).toLocaleString("vi-VN")}
                            {rental.rooms.length > 1 ? "+ VNĐ" : " VNĐ"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                          <Ruler className="h-3.5 w-3.5" />
                          <span>
                            {Math.min(...rental.rooms.map((r) => r.area))} m²
                            {rental.rooms.length > 1 ? "+" : ""}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end mt-2">
                    <Button asChild>
                      <Link href={`/nha-tro/${rental.id}`}>Xem chi tiết</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Phân trang */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default RentalListingPage;
