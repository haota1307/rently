"use client";

import { useGetPostDetail } from "@/features/post/usePost";
import { Suspense, use, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  Phone,
  Building,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";

interface PostDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = use(params);
  const postId = parseInt(id);
  const { data: post, isLoading, error } = useGetPostDetail(postId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showMap, setShowMap] = useState(false);

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Không tìm thấy bài đăng
          </h2>
          <p className="text-gray-600 mb-6">
            Bài đăng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <Link href="/">
            <Button>Trở về trang chủ</Button>
          </Link>
        </div>
      </div>
    );
  }

  const room = post.room;
  const rental = post.rental;

  // Lấy danh sách hình ảnh từ cả phòng và nhà trọ
  let images: { url: string; source: string }[] = [];

  // Ưu tiên hình ảnh phòng
  if (room?.roomImages && room.roomImages.length > 0) {
    images = [
      ...images,
      ...room.roomImages.map((img) => ({
        url: img.imageUrl,
        source: "Phòng",
      })),
    ];
  }

  // Thêm hình ảnh nhà trọ
  if (rental?.rentalImages && rental.rentalImages.length > 0) {
    images = [
      ...images,
      ...rental.rentalImages.map((img) => ({
        url: img.imageUrl,
        source: "Nhà trọ",
      })),
    ];
  }

  // Nếu không có hình ảnh nào, dùng placeholder
  if (images.length === 0) {
    images = [
      { url: "/placeholder.svg?height=400&width=600", source: "Placeholder" },
    ];
  }

  // Lấy danh sách tiện ích từ phòng
  const amenities = room?.roomAmenities
    ? room.roomAmenities.map((amenity) => amenity.amenity.name)
    : [];

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Tạo URL Google Maps embed từ lat, lng
  const googleMapsUrl =
    rental?.lat && rental?.lng
      ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${rental.lat},${rental.lng}&zoom=17`
      : null;

  return (
    <div className="container mx-auto px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột chính với thông tin bài đăng */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
            <div className="flex items-center text-gray-600 mb-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{rental?.address || "Không có địa chỉ"}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Home className="h-4 w-4 mr-1" />
              <span>
                Thuộc nhà trọ: {rental?.title || "Không có thông tin"}
              </span>
            </div>
          </div>

          {/* Slider hình ảnh */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={images[activeImageIndex].url}
                    alt={`Hình ảnh ${activeImageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                  <Badge
                    className="absolute top-2 right-2 bg-opacity-70"
                    variant="secondary"
                  >
                    {images[activeImageIndex].source}
                  </Badge>

                  {images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </>
                  )}
                </div>

                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                  <div className="bg-black bg-opacity-50 rounded-full px-3 py-1 text-xs text-white">
                    {activeImageIndex + 1} / {images.length}
                  </div>
                </div>
              </div>

              {/* Thanh thumbnail */}
              {images.length > 1 && (
                <div className="flex overflow-x-auto gap-2 p-2 bg-gray-50">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative h-16 w-24 flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition ${
                        activeImageIndex === index
                          ? "ring-2 ring-primary"
                          : "opacity-70"
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thông tin giá và đặc điểm */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <div>
                  <span className="text-2xl font-bold text-blue-600">
                    {room ? formatPrice(room.price) : "Liên hệ"}/tháng
                  </span>
                  <span className="text-gray-500 ml-2">
                    ({room?.area || "N/A"} m²)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge
                    variant={room?.isAvailable ? "default" : "destructive"}
                  >
                    {room?.isAvailable ? "Còn trống" : "Đã cho thuê"}
                  </Badge>
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                  </Badge>
                </div>
              </div>

              {/* Tiện ích */}
              {amenities.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Tiện ích</h3>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Thông tin nhà trọ */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Thông tin nhà trọ</h3>
                <div className="prose prose-sm max-w-none text-gray-700 mb-3">
                  <p>{rental?.description || "Không có thông tin chi tiết"}</p>
                </div>
                <Link href={`/nha-tro/${rental?.id}`} passHref>
                  <Button variant="outline" size="sm">
                    Xem thông tin nhà trọ
                  </Button>
                </Link>
              </div>

              {/* Mô tả bài đăng */}
              <div>
                <h3 className="font-medium mb-2">Mô tả chi tiết</h3>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>{post.description || "Không có mô tả chi tiết"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Maps location */}
          {googleMapsUrl && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Vị trí trên bản đồ</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? "Ẩn bản đồ" : "Hiển thị bản đồ"}
                  </Button>
                </div>

                {showMap && (
                  <div className="aspect-video w-full mt-2 rounded-md overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={googleMapsUrl}
                    ></iframe>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Địa chỉ: {rental?.address || "Chưa có thông tin địa chỉ"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar với thông tin chủ nhà và nhà trọ */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Thông tin người cho thuê</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative h-14 w-14 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={
                      post.landlord?.avatar ||
                      "/placeholder.svg?height=56&width=56"
                    }
                    alt={post.landlord?.name || "Chủ nhà"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">
                    {post.landlord?.name || "Không có thông tin"}
                  </p>
                  <p className="text-sm text-gray-500">Chủ nhà trọ</p>
                </div>
              </div>

              {post.landlord?.phoneNumber && (
                <Button className="w-full mb-2" variant="default">
                  <Phone className="h-4 w-4 mr-2" />
                  {post.landlord.phoneNumber}
                </Button>
              )}

              <Button
                className="w-full mb-2"
                variant={post.landlord?.phoneNumber ? "outline" : "default"}
              >
                Nhắn tin
              </Button>

              <p className="text-xs text-center text-gray-500 mt-2">
                {post.landlord?.email || "Không có thông tin liên hệ"}
              </p>
            </CardContent>
          </Card>

          {/* Thông tin chi tiết nhà trọ */}
          {rental && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Thông tin nhà trọ</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-2">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{rental.title}</p>
                      <p className="text-sm text-gray-500">Tên nhà trọ</p>
                    </div>
                  </li>

                  <li className="flex items-start space-x-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{rental.address}</p>
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                    </div>
                  </li>

                  {rental.rentalImages && rental.rentalImages.length > 0 && (
                    <li className="flex items-start space-x-2">
                      <ImageIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {rental.rentalImages.length} hình ảnh
                        </p>
                        <p className="text-sm text-gray-500">
                          Tổng số hình ảnh của nhà trọ
                        </p>
                      </div>
                    </li>
                  )}
                </ul>

                <div className="mt-4">
                  <Link href={`/nha-tro/${rental.id}`} passHref>
                    <Button variant="default" size="sm" className="w-full">
                      Xem tất cả phòng tại nhà trọ này
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Thông tin chi tiết</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">ID bài đăng:</span>
                  <span className="font-medium">{post.id}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Ngày đăng:</span>
                  <span className="font-medium">
                    {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Ngày bắt đầu:</span>
                  <span className="font-medium">
                    {post.startDate
                      ? new Date(post.startDate).toLocaleDateString("vi-VN")
                      : "Không có"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Ngày kết thúc:</span>
                  <span className="font-medium">
                    {post.endDate
                      ? new Date(post.endDate).toLocaleDateString("vi-VN")
                      : "Không có"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <Badge
                    variant={post.status === "ACTIVE" ? "default" : "outline"}
                  >
                    {post.status === "ACTIVE"
                      ? "Đang hoạt động"
                      : post.status === "INACTIVE"
                      ? "Tạm ngưng"
                      : "Đã xóa"}
                  </Badge>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
            <Skeleton className="h-4 w-1/3 mt-2" />
          </div>

          <Skeleton className="aspect-video w-full rounded-lg" />

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-8 w-1/3" />
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>

              <Skeleton className="h-4 w-1/4 mb-2" />
              <div className="flex flex-wrap gap-2 mb-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>

              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-9 w-28" />
              </div>
              <Skeleton className="aspect-video w-full mt-2 rounded-md" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-5 w-1/2 mb-4" />
              <div className="flex items-center space-x-3 mb-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-5 w-1/2 mb-4" />
              <div className="space-y-3">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex space-x-2">
                      <Skeleton className="h-5 w-5" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  ))}
              </div>
              <Skeleton className="h-9 w-full mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-5 w-1/2 mb-4" />
              <div className="space-y-3">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
