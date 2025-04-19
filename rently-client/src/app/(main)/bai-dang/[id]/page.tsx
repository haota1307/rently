"use client";

import { useGetPostDetail } from "@/features/post/usePost";
import { Suspense, use, useState, useEffect, useRef } from "react";
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
  ArrowLeft,
  RefreshCcw,
  AlertCircle,
  CalendarX,
} from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ShareButton } from "@/components/ui/share-button";
import { ComparisonButton } from "@/components/ui/comparison-button";
import { CommentSection } from "@/components/comment-section";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useComments } from "@/features/comment/useComment";
import { ViewingScheduleForm } from "@/features/viewing-schedule/components/viewing-schedule-form";
import { useViewingSchedule } from "@/features/viewing-schedule/useViewingSchedule";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAppStore } from "@/components/app-provider";
import { Role } from "@/constants/type";
import { useConversation } from "@/features/conversation/useConversation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { RentalRequestButton } from "@/features/rental-request/components/rental-request-button";

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
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const {
    comments,
    loading,
    newComment,
    setNewComment,
    addComment,
    isAuth,
    totalComments,
  } = useComments(postId);

  // Lấy thông tin về lịch hẹn xem phòng hiện tại của người dùng
  const { getViewingSchedules } = useViewingSchedule();
  const { data: schedules } = getViewingSchedules({
    page: 1,
    limit: 10,
  });

  const role = useAppStore((state) => state.role);
  const { userId } = useAuth();

  // Kiểm tra nếu người dùng là landlord hoặc admin thì không hiển thị form đặt lịch
  const isLandlordOrAdmin = role === Role.Landlord || role === Role.Admin;

  // Kiểm tra xem người dùng đã có lịch hẹn chưa bị từ chối
  const existingSchedule = schedules?.data?.find(
    (schedule) => schedule.post.id === postId && schedule.status !== "REJECTED"
  );

  // Kiểm tra xem người dùng có thể đặt lịch không
  const canScheduleViewing =
    !isLandlordOrAdmin && (!existingSchedule || !isAuth);

  // Kiểm tra xem người dùng có phải là chủ nhà hay không
  const isLandlord = post?.landlord?.id === userId;

  const { startConversation, loading: loadingConversation } = useConversation();

  // Add a check for existing rental request (if user already has a rental request for this post)
  const [hasExistingRequest, setHasExistingRequest] = useState(false);

  // Check for existing rental request
  useEffect(() => {
    // This is a placeholder for checking if user already has a rental request for this post
    // In a real implementation, you would fetch this data from the API
    // For now we'll use the existing viewing schedule logic as a placeholder
    if (existingSchedule) {
      setHasExistingRequest(true);
    }
  }, [existingSchedule]);

  console.log(comments);

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

  const handleContactLandlord = () => {
    window.open(`tel:${post.landlord?.phoneNumber}`);
  };

  const handleSendMessage = () => {
    if (!isAuth) {
      toast.error("Bạn cần đăng nhập để nhắn tin");
      return;
    }

    if (post?.landlord?.id) {
      startConversation(post.landlord.id);
    }
  };

  const postActions = (
    <div className="flex gap-2">
      {post && (
        <>
          <FavoriteButton rentalId={post.rental.id} size="default" />
          <ShareButton rentalDetail={post} />
          <ComparisonButton
            post={post}
            size="default"
            variant="outline"
            showText={true}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-8 py-6">
        {/* Back link */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground -ml-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại kết quả
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột chính với thông tin bài đăng */}
          <div className="lg:col-span-2">
            {/* Thông tin chính */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {post.title}
              </h1>
              <div className="flex items-center text-muted-foreground text-sm space-x-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{rental?.address || "Không có địa chỉ"}</span>
              </div>
            </div>

            {/* Slider hình ảnh */}
            <div className="relative mb-6 rounded-xl overflow-hidden border bg-muted/20">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={images[activeImageIndex].url}
                  alt={`Hình ảnh ${activeImageIndex + 1}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                  className="object-cover"
                />

                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-9 h-9 shadow-sm"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-9 h-9 shadow-sm"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}

                <div className="absolute bottom-2 right-2">
                  <Badge
                    variant="secondary"
                    className="bg-black/50 text-white font-normal"
                  >
                    {activeImageIndex + 1}/{images.length}
                  </Badge>
                </div>
              </div>

              {/* Thanh thumbnail */}
              {images.length > 1 && (
                <div className="flex overflow-x-auto py-2 px-2 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative h-16 w-24 flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition ${
                        activeImageIndex === index
                          ? "ring-2 ring-primary ring-offset-1"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin giá, trạng thái và các action */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {room ? formatPrice(room.price) : "Liên hệ"}
                  </span>
                  <span className="text-muted-foreground">/tháng</span>
                </div>
                <div className="flex items-center mt-1 text-sm">
                  <span className="text-muted-foreground">
                    {room?.area || "N/A"} m²
                  </span>
                  {room?.area && room?.price && (
                    <>
                      <span className="mx-1 text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {formatPrice(Math.round(room.price / room.area))}/m²
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={room?.isAvailable ? "default" : "destructive"}>
                  {room?.isAvailable ? "Còn trống" : "Đã cho thuê"}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                </Badge>
              </div>
            </div>

            {/* Liên hệ */}
            <div className="flex items-center gap-2 mb-6">
              <Button
                onClick={handleContactLandlord}
                className="flex gap-2 items-center"
              >
                <Phone size={16} />
                Liên hệ chủ nhà
              </Button>

              {/* Rental Request Button */}
              {!isLandlord && room?.isAvailable && (
                <RentalRequestButton
                  postId={postId}
                  isAvailable={room?.isAvailable}
                  existingRequest={hasExistingRequest}
                />
              )}

              {postActions}
            </div>

            {/* Tiện ích */}
            {amenities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Tiện ích</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 border rounded-md bg-background"
                    >
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mô tả chi tiết */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Mô tả chi tiết</h3>
              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="whitespace-pre-line">
                  {post.description || "Không có mô tả chi tiết"}
                </p>
              </div>
            </div>

            {/* Thông tin nhà trọ */}
            <div className="p-4 border rounded-lg bg-muted/10 mb-6">
              <div className="flex items-start gap-2 mb-2">
                <Home className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <h3 className="font-medium text-base">
                    Thuộc nhà trọ: {rental?.title || "Không có thông tin"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {rental?.address}
                  </p>
                </div>
              </div>
              {rental?.description && (
                <p className="text-sm text-muted-foreground mt-2 ml-7">
                  {rental.description}
                </p>
              )}
              <div className="mt-3 ml-7">
                <Link href={`/nha-tro/${rental?.id}`} passHref>
                  <Button variant="outline" size="sm">
                    Xem thông tin nhà trọ
                  </Button>
                </Link>
              </div>
            </div>

            {/* Google Maps location */}
            {googleMapsUrl && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Vị trí trên bản đồ</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? "Ẩn bản đồ" : "Hiển thị bản đồ"}
                  </Button>
                </div>

                {showMap && (
                  <div className="aspect-video w-full rounded-md overflow-hidden border mb-2">
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
              </div>
            )}

            {/* Phần bình luận */}
            <div className="mt-8">
              <Separator className="mb-6" />
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Đánh giá & Bình luận</h3>
              </div>

              <Card className="overflow-hidden shadow-sm">
                <CardContent className="p-0">
                  {/* Header phần bình luận */}
                  <div className="p-4 border-b bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="bg-primary/5 text-primary hover:bg-primary/10 py-1.5 h-auto"
                      >
                        <span className="font-semibold">
                          {totalComments || 0}
                        </span>
                        <span className="ml-1">bình luận</span>
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 px-3 border-dashed"
                      onClick={() => {
                        window.location.reload();
                      }}
                    >
                      <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                      Làm mới
                    </Button>
                  </div>

                  {/* Phần hiển thị bình luận */}
                  <div className="flex flex-col" style={{ height: "450px" }}>
                    {/* Phần cuộn bình luận */}
                    <ScrollArea className="flex-1 bg-muted/5">
                      <div className="p-5">
                        <CommentSection
                          postId={postId}
                          hideCommentForm={true}
                        />
                      </div>
                      <ScrollBar />
                    </ScrollArea>

                    {/* Form nhập bình luận */}
                    <div className="border-t bg-card p-4">
                      <div className="flex gap-3">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden border bg-muted flex-shrink-0">
                          <Image
                            src="/placeholder.svg?height=40&width=40"
                            alt="Avatar"
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="relative">
                            <textarea
                              ref={commentInputRef}
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="min-h-[100px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                              placeholder={
                                isAuth
                                  ? "Chia sẻ ý kiến của bạn về bài đăng này..."
                                  : "Vui lòng đăng nhập để bình luận"
                              }
                              disabled={!isAuth}
                            />
                            {!isAuth && (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-4 rounded-lg text-center">
                                <p className="text-sm font-medium mb-2">
                                  Bạn cần đăng nhập để bình luận
                                </p>
                                <Link href="/dang-nhap">
                                  <Button size="sm">Đăng nhập</Button>
                                </Link>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">
                              Hãy chia sẻ đánh giá chân thực để giúp người khác
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                addComment();
                                if (commentInputRef.current) {
                                  commentInputRef.current.focus();
                                }
                              }}
                              disabled={!isAuth || !newComment.trim()}
                              className="px-4"
                            >
                              Gửi bình luận
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar với thông tin chủ nhà và nhà trọ */}
          <div>
            <div className="lg:sticky lg:top-20">
              {/* Thông tin người cho thuê */}
              <Card className="mb-4">
                <CardContent className="p-5">
                  <h3 className="font-medium mb-4">Thông tin người cho thuê</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                      <Image
                        src={
                          post.landlord?.avatar ||
                          "/placeholder.svg?height=48&width=48"
                        }
                        alt={post.landlord?.name || "Chủ nhà"}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">
                        {post.landlord?.name || "Không có thông tin"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Chủ nhà trọ
                      </p>
                    </div>
                  </div>

                  {post.landlord?.phoneNumber && (
                    <Button className="w-full mb-2" variant="default">
                      <Phone className="h-4 w-4 mr-2" />
                      {post.landlord.phoneNumber}
                    </Button>
                  )}

                  {/* Hiển thị nút nhắn tin chỉ khi người dùng đã đăng nhập và không phải là chủ nhà */}
                  {isAuth && !isLandlord && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleSendMessage}
                      disabled={loadingConversation}
                    >
                      {loadingConversation ? "Đang xử lý..." : "Nhắn tin"}
                    </Button>
                  )}

                  {/* Hiển thị thông báo khi người dùng là chủ nhà */}
                  {isAuth && isLandlord && (
                    <div className="text-xs text-center text-muted-foreground mt-2">
                      Bạn là chủ nhà trọ này
                    </div>
                  )}

                  {!isAuth && (
                    <div className="mt-2">
                      <Link href="/dang-nhap">
                        <Button className="w-full" variant="outline">
                          Đăng nhập để nhắn tin
                        </Button>
                      </Link>
                    </div>
                  )}

                  {post.landlord?.email && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      {post.landlord.email}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Form đặt lịch xem phòng */}
              <Card className="mb-4">
                <CardContent className="p-5">
                  <h3 className="font-medium mb-4">Đặt lịch xem phòng</h3>

                  {!isAuth && (
                    <Alert variant="default" className="bg-muted">
                      <CalendarX className="h-4 w-4" />
                      <AlertTitle>Cần đăng nhập</AlertTitle>
                      <AlertDescription className="mb-2">
                        Bạn cần đăng nhập để đặt lịch xem phòng
                      </AlertDescription>
                      <Link href="/dang-nhap">
                        <Button size="sm" className="mt-2">
                          Đăng nhập
                        </Button>
                      </Link>
                    </Alert>
                  )}

                  {isAuth && isLandlordOrAdmin && (
                    <Alert variant="default" className="bg-muted">
                      <CalendarX className="h-4 w-4" />
                      <AlertTitle>Không thể đặt lịch</AlertTitle>
                      <AlertDescription>
                        Chủ nhà và quản trị viên không thể đặt lịch xem phòng
                      </AlertDescription>
                    </Alert>
                  )}

                  {isAuth && !isLandlordOrAdmin && existingSchedule && (
                    <Alert
                      variant={
                        existingSchedule.status === "PENDING"
                          ? "default"
                          : existingSchedule.status === "APPROVED"
                          ? "default"
                          : "default"
                      }
                      className={
                        existingSchedule.status === "PENDING"
                          ? "bg-yellow-50"
                          : existingSchedule.status === "APPROVED"
                          ? "bg-green-50"
                          : "bg-blue-50"
                      }
                    >
                      <Calendar className="h-4 w-4" />
                      <AlertTitle>
                        {existingSchedule.status === "PENDING"
                          ? "Đang chờ xác nhận"
                          : existingSchedule.status === "APPROVED"
                          ? "Đã xác nhận lịch hẹn"
                          : "Đã đổi lịch"}
                      </AlertTitle>
                      <AlertDescription>
                        Bạn đã đặt lịch xem phòng này vào ngày{" "}
                        {format(new Date(existingSchedule.viewingDate), "PPP", {
                          locale: vi,
                        })}{" "}
                        lúc{" "}
                        {format(
                          new Date(existingSchedule.viewingDate),
                          "HH:mm",
                          { locale: vi }
                        )}
                        .
                        <br />
                        Vui lòng kiểm tra trong{" "}
                        <Link
                          href="/lich-xem-phong"
                          className="text-primary underline"
                        >
                          danh sách lịch hẹn
                        </Link>{" "}
                        của bạn.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isAuth && !isLandlordOrAdmin && !existingSchedule && (
                    <ViewingScheduleForm postId={post.id} />
                  )}
                </CardContent>
              </Card>

              {/* Thông tin chi tiết */}
              <Card className="mb-4">
                <CardContent className="p-5">
                  <h3 className="font-medium mb-3">Thông tin chi tiết</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">
                        ID bài đăng:
                      </span>
                      <span>{post.id}</span>
                    </li>
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Diện tích:</span>
                      <span>{room?.area || "N/A"} m²</span>
                    </li>
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Ngày đăng:</span>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </li>
                    {post.startDate && (
                      <li className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">
                          Ngày bắt đầu:
                        </span>
                        <span>
                          {new Date(post.startDate).toLocaleDateString("vi-VN")}
                        </span>
                      </li>
                    )}
                    {post.endDate && (
                      <li className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">
                          Ngày kết thúc:
                        </span>
                        <span>
                          {new Date(post.endDate).toLocaleDateString("vi-VN")}
                        </span>
                      </li>
                    )}
                    <li className="flex justify-between py-1">
                      <span className="text-muted-foreground">Trạng thái:</span>
                      <Badge
                        variant={
                          post.status === "ACTIVE" ? "default" : "outline"
                        }
                        className="font-normal"
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

              {/* CTA cuối trang */}
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Bạn có phòng trọ cần cho thuê?
                </p>
                <Link href="/dang-tin">
                  <Button className="w-full">Đăng tin ngay</Button>
                </Link>
              </div>
            </div>
          </div>
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
          </div>

          <Skeleton className="aspect-video w-full rounded-lg" />

          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-1/3" />
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-6 w-1/4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Skeleton className="h-[150px] w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
