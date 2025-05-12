"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  House,
  MapPin,
  Ruler,
  User,
  Phone,
  Mail,
  CalendarDays,
  ChevronLeft,
  Home,
  ArrowLeft,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  Building,
  Info,
  ArrowRight,
  Search,
} from "lucide-react";

import rentalApiRequest from "@/features/rental/rental.api";
import { RentalType } from "@/schemas/rental.schema";

const RentalDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const rentalId = Number(params.id);
  const [rental, setRental] = useState<RentalType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tong-quan");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Lấy dữ liệu nhà trọ
  useEffect(() => {
    const fetchRental = async () => {
      try {
        setLoading(true);
        const data = await rentalApiRequest.detail(rentalId);

        if (data.status === 200 && data.payload) {
          setRental(data.payload);
        } else {
          setError("Không tìm thấy thông tin nhà trọ");
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu nhà trọ:", error);
        setError("Không thể tải thông tin nhà trọ");
      } finally {
        setLoading(false);
      }
    };

    if (rentalId) {
      fetchRental();
    }
  }, [rentalId]);

  const handleImageClick = (index: number) => {
    setActiveImageIndex(index);
  };

  console.log(rental);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Skeleton className="h-[400px] w-full rounded-lg mb-4" />
            <div className="grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-md" />
              ))}
            </div>
            <Skeleton className="h-10 w-full mt-6 mb-4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-60 w-full mt-6" />
          </div>

          <div>
            <Skeleton className="h-[300px] w-full rounded-lg mb-6" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-6" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg text-center max-w-2xl mx-auto">
          <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Không tìm thấy nhà trọ</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "Không tìm thấy thông tin nhà trọ với ID này"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <Button asChild>
              <Link href="/" className="gap-2">
                <Home className="h-4 w-4" />
                Trang chủ
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {/* Hình ảnh */}
          <div>
            {rental.rentalImages && rental.rentalImages.length > 0 ? (
              <>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-sm mb-3">
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity z-10"></div>
                  <Image
                    src={
                      rental.rentalImages[activeImageIndex]?.imageUrl ||
                      "/placeholder.svg"
                    }
                    alt={rental.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-3 right-3 z-20">
                    <Badge className="bg-black/60 hover:bg-black/80 text-white border-0 px-2 py-1 text-xs">
                      {rental.rentalImages.length} ảnh
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {rental.rentalImages.map((image, index) => (
                    <div
                      key={image.id}
                      className={`relative aspect-[4/3] cursor-pointer overflow-hidden rounded-md transition-all ${
                        index === activeImageIndex
                          ? "ring-2 ring-primary"
                          : "ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-gray-300 dark:hover:ring-gray-700"
                      }`}
                      onClick={() => handleImageClick(index)}
                    >
                      <Image
                        src={image.imageUrl}
                        alt={`${rental.title} - ảnh ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 mb-6 flex flex-col items-center justify-center">
                <House className="h-16 w-16 text-gray-400" />
                <p className="text-gray-400 mt-2">Không có hình ảnh</p>
              </div>
            )}
          </div>

          {/* Thông tin chính */}
          <div className="mt-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                  {rental.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{rental.address}</span>
                </div>
              </div>
              <Badge variant="outline" className="py-1 px-2 text-xs">
                {rental.rooms?.length || 0} phòng
              </Badge>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-6"
            >
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger
                  value="tong-quan"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger
                  value="phong-tro"
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  Phòng trọ ({rental.rooms?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tong-quan" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4 text-gray-500" />
                      Mô tả
                    </h2>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {rental.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Vị trí
                    </h2>
                    <div className="h-[300px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <iframe
                        src={`https://maps.google.com/maps?q=${rental.lat},${rental.lng}&z=17&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Vị trí của ${rental.title}`}
                      ></iframe>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="phong-tro" className="mt-6">
                {rental.rooms && rental.rooms.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5">
                    {rental.rooms.map((room) => (
                      <Card
                        key={room.id}
                        className={`overflow-hidden hover:shadow-md transition-all border-l-4 ${
                          room.isAvailable
                            ? "border-l-green-500"
                            : "border-l-red-500"
                        }`}
                      >
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            <div className="relative w-full sm:w-1/3 aspect-video sm:aspect-square">
                              {room.roomImages && room.roomImages.length > 0 ? (
                                <Image
                                  src={room.roomImages[0].imageUrl}
                                  alt={room.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                  <House className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                              <Badge
                                className={`absolute top-2 right-2 ${
                                  room.isAvailable
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                } text-white border-0`}
                              >
                                {room.isAvailable ? "Còn phòng" : "Đã thuê"}
                              </Badge>
                            </div>

                            <div className="p-4 flex-1">
                              <h3 className="font-semibold text-lg mb-3">
                                {room.title}
                              </h3>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                                    <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Giá thuê
                                    </p>
                                    <p className="font-semibold">
                                      {room.price.toLocaleString("vi-VN")} VNĐ
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                                    <Ruler className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Diện tích
                                    </p>
                                    <p className="font-semibold">
                                      {room.area} m²
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <Button
                                  variant={
                                    room.isAvailable ? "default" : "outline"
                                  }
                                  size="sm"
                                  disabled={!room.isAvailable}
                                  className="mt-2"
                                  asChild
                                >
                                  <Link href={`/bai-dang?roomId=${room.id}`}>
                                    {room.isAvailable ? (
                                      <span className="flex items-center gap-2">
                                        Xem chi tiết
                                        <ArrowRight className="h-3.5 w-3.5" />
                                      </span>
                                    ) : (
                                      "Đã cho thuê"
                                    )}
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                    <House className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium mb-1">
                      Chưa có phòng trọ
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Nhà trọ này hiện chưa có thông tin phòng trọ
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Thông tin chủ nhà */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                Thông tin chủ nhà
              </h2>
              {rental.landlord ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                      {rental.landlord.avatar ? (
                        <Image
                          src={rental.landlord.avatar}
                          alt={rental.landlord.name || "Chủ nhà"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User className="h-7 w-7 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">
                        {rental.landlord.name || "Chủ nhà"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Chủ nhà
                      </p>
                    </div>
                  </div>

                  <Separator className="mb-4" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Điện thoại
                        </p>
                        <p className="font-medium">
                          {rental.landlord.phoneNumber || "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Email
                        </p>
                        <p className="font-medium">
                          {rental.landlord.email || "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                      <CalendarDays className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Tham gia từ
                        </p>
                        <p className="font-medium">
                          {rental.landlord.createdAt
                            ? new Date(
                                rental.landlord.createdAt
                              ).toLocaleDateString("vi-VN", {
                                year: "numeric",
                                month: "long",
                              })
                            : "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <User className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Không có thông tin chủ nhà
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tổng quan */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                Tổng quan
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Tổng số phòng
                    </p>
                    <p className="font-semibold text-lg">
                      {rental.rooms?.length || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Còn trống
                    </p>
                    <p className="font-semibold text-lg text-green-600 dark:text-green-500">
                      {rental.rooms?.filter((room) => room.isAvailable)
                        .length || 0}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Cập nhật</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {rental.updatedAt
                      ? new Date(rental.updatedAt).toLocaleDateString("vi-VN")
                      : "Chưa cập nhật"}
                  </span>
                </div>
              </div>

              <Separator className="my-4" />

              <Button asChild className="w-full" variant="default">
                <Link
                  href={`/bai-dang?rentalId=${rental.id}`}
                  className="flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Xem tất cả bài đăng
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RentalDetailPage;
