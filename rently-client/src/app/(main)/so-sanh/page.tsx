"use client";

import { useState, useEffect } from "react";
import { useComparisonStore } from "@/features/comparison/comparison.store";
import { PageHeader } from "@/components/page-header";
import { BarChart2, Trash2, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, createPostSlug } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import recommendation system
import { RoomRecommendations } from "@/features/recommendation";

// Import AI comparison analysis
import { AIComparisonAnalysis } from "@/features/comparison/components/ai-comparison-analysis";

export default function ComparisonPage() {
  const { items, removeItem, clearAll } = useComparisonStore();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="mx-auto px-4 md:px-8 py-16 relative">
          <PageHeader
            title="So sánh phòng trọ"
            description="So sánh các phòng trọ để tìm ra lựa chọn phù hợp nhất với bạn"
          />
          <div className="mt-8">
            <EmptyState
              icon={BarChart2}
              title="Chưa có phòng để so sánh"
              description="Bạn chưa thêm phòng nào vào danh sách so sánh. Hãy thêm phòng để có thể so sánh."
              action={
                <Button onClick={() => router.push("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  Tìm phòng để so sánh
                </Button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Decorative background elements */}
      <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl opacity-60 -z-10 animate-pulse"></div>
      <div
        className="absolute top-[60%] left-[5%] w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl opacity-60 -z-10 animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>

      <div className="mx-auto px-4 md:px-8 py-16 relative">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10">
          <PageHeader
            title="So sánh phòng trọ"
            description="So sánh chi tiết các phòng trọ để tìm ra lựa chọn phù hợp nhất với bạn"
          />
          <Button
            variant="destructive"
            onClick={clearAll}
            className="mt-4 md:mt-0"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa tất cả
          </Button>
        </div>

        {/* Hiển thị các phòng trong chế độ lưới */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 relative z-10">
          {items.map((post) => (
            <Card key={post.id} className="overflow-hidden relative group">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeItem(post.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="relative aspect-video">
                <Image
                  alt={post.title}
                  className="object-cover"
                  fill
                  src={
                    post.rental.rentalImages &&
                    post.rental.rentalImages.length > 0
                      ? post.rental.rentalImages[0].imageUrl
                      : "/placeholder.svg?height=200&width=300"
                  }
                />
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{post.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {post.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="flex justify-between">
                  <p className="font-medium text-blue-600">
                    {formatPrice(post.room.price)}/tháng
                  </p>
                  <p>{post.room.area} m²</p>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  <span className="truncate">{post.rental.address}</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button asChild className="w-full">
                  <Link
                    href={`/bai-dang/${createPostSlug(post.title, post.id)}`}
                  >
                    Xem chi tiết
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Bảng so sánh chi tiết */}
        <Card className="mb-8 relative z-10">
          <CardHeader>
            <CardTitle>Bảng so sánh chi tiết</CardTitle>
            <CardDescription>
              So sánh các thông số chi tiết của phòng trọ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Tiêu chí</TableHead>
                    {items.map((post) => (
                      <TableHead key={post.id}>{post.title}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Giá thuê</TableCell>
                    {items.map((post) => (
                      <TableCell
                        key={post.id}
                        className="font-medium text-blue-600"
                      >
                        {formatPrice(post.room.price)}/tháng
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Diện tích</TableCell>
                    {items.map((post) => (
                      <TableCell key={post.id}>{post.room.area} m²</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Địa chỉ</TableCell>
                    {items.map((post) => (
                      <TableCell key={post.id}>{post.rental.address}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Khoảng cách</TableCell>
                    {items.map((post) => (
                      <TableCell key={post.id}>
                        {post.rental.distance ? (
                          <div className="flex items-center">
                            <span className="font-medium text-blue-600">
                              {post.rental.distance < 1
                                ? `${(post.rental.distance * 1000).toFixed(0)} m`
                                : `${post.rental.distance.toFixed(1)} km`}
                            </span>
                            <span className="ml-1 text-muted-foreground text-xs">
                              từ Đại học Nam Cần Thơ
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Không có thông tin
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Mô tả</TableCell>
                    {items.map((post) => (
                      <TableCell key={post.id} className="max-w-[300px]">
                        <p className="text-sm line-clamp-2">
                          {post.description || "Không có mô tả"}
                        </p>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Tiện ích</TableCell>
                    {items.map((post) => (
                      <TableCell key={post.id}>
                        <div className="flex flex-wrap gap-1">
                          {post.room.roomAmenities &&
                          post.room.roomAmenities.length > 0 ? (
                            <>
                              {post.room.roomAmenities
                                .slice(0, 3)
                                .map((amenityItem, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {amenityItem.amenity?.name || "N/A"}
                                  </Badge>
                                ))}
                              {post.room.roomAmenities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.room.roomAmenities.length - 3}
                                </Badge>
                              )}
                            </>
                          ) : post.room.amenities &&
                            post.room.amenities.length > 0 ? (
                            <>
                              {post.room.amenities
                                .slice(0, 3)
                                .map((amenity, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {amenity.name ||
                                      (typeof amenity === "string"
                                        ? amenity
                                        : "N/A")}
                                  </Badge>
                                ))}
                              {post.room.amenities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.room.amenities.length - 3}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Không có tiện ích
                            </span>
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Hành động</TableCell>
                    {items.map((post) => (
                      <TableCell key={post.id}>
                        <div className="flex gap-2">
                          <Button asChild size="sm" className="w-full">
                            <Link
                              href={`/bai-dang/${createPostSlug(post.title, post.id)}`}
                            >
                              Xem chi tiết
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => removeItem(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 🤖 PHÂN TÍCH AI - GỢI Ý THÔNG MINH */}
        <div className="mb-8 relative z-10">
          <AIComparisonAnalysis rooms={items} />
        </div>

        {/* 🎯 HỆ THỐNG GỢI Ý - SO SÁNH */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative z-10">
          <RoomRecommendations
            roomId={items[0]?.room?.id || 1} // Dựa trên phòng đầu tiên trong so sánh
            method="HYBRID"
            limit={6}
            title="Phòng tương tự có thể bạn quan tâm"
            showMetadata={false}
            showSimilarityBreakdown={false}
            defaultViewMode="grid"
            className=""
          />
        </div>
      </div>
    </div>
  );
}
