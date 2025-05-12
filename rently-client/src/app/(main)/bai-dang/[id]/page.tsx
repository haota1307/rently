"use client";

import {
  useGetPostDetail,
  useGetSimilarPostsByPrice,
  useGetSameRentalPosts,
} from "@/features/post/usePost";
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
  Share,
  MessageSquare,
  Lock,
  Send,
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
import { useConversation } from "@/features/conversation/use-conversation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { RentalRequestButton } from "@/features/rental-request/components/rental-request-button";
import { useGetTenantRentalRequests } from "@/features/rental-request/useRentalRequest";
import {
  RentalRequestStatus,
  RentalRequestType,
} from "@/schemas/rental-request.schema";
import { SimilarPostCard } from "@/components/similar-post-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

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
    isSubmitting,
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

  // Lấy danh sách yêu cầu thuê của người dùng
  const { data: rentalRequests } = useGetTenantRentalRequests({
    limit: 50,
    page: 1,
  });

  // Check for existing rental request
  useEffect(() => {
    if (!userId || !rentalRequests?.data) return;

    // Kiểm tra xem người dùng đã có yêu cầu thuê cho bài đăng này chưa (đang xử lý hoặc đã được chấp nhận)
    const existingRequest = rentalRequests.data.find(
      (request: RentalRequestType) =>
        request.postId === postId &&
        (request.status === RentalRequestStatus.PENDING ||
          request.status === RentalRequestStatus.APPROVED)
    );

    if (existingRequest) {
      setHasExistingRequest(true);
    }
  }, [rentalRequests, postId, userId]);

  console.log(comments);

  const router = useRouter();

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (error || !post) {
    return (
      <div className=" mx-auto px-4 py-8">
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
    if (post.landlord?.phoneNumber) {
      window.open(`tel:${post.landlord.phoneNumber}`);
    } else {
      toast.error("Không có số điện thoại của chủ nhà");
    }
  };

  const handleSendMessage = async () => {
    if (!isAuth) {
      toast.error("Bạn cần đăng nhập để nhắn tin");
      return;
    }

    if (post?.landlord?.id) {
      try {
        await startConversation(post.landlord.id);
      } catch (error) {
        console.error("Lỗi khi tạo cuộc trò chuyện:", error);
        toast.error("Không thể kết nối với chủ nhà. Vui lòng thử lại sau");
      }
    } else {
      toast.error("Không tìm thấy thông tin chủ nhà");
    }
  };

  // Thêm các hàm xử lý cho các nút
  const handleShare = async () => {
    if (navigator.share && window !== undefined) {
      try {
        await navigator.share({
          title: post.title,
          text: `${post.title} - ${post.rental?.address}`,
          url: window.location.href,
        });
        toast.success("Đã chia sẻ bài đăng");
      } catch (error) {
        console.error("Lỗi khi chia sẻ:", error);
        // Fallback khi không thể dùng Web Share API
        navigator.clipboard.writeText(window.location.href);
        toast.success("Đã sao chép đường dẫn vào clipboard");
      }
    } else {
      // Fallback cho trình duyệt không hỗ trợ Web Share API
      if (window !== undefined) {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Đã sao chép đường dẫn vào clipboard");
      }
    }
  };

  const handleBookmark = async () => {
    if (!isAuth) {
      toast.error("Bạn cần đăng nhập để lưu tin");
      return;
    }

    try {
      // Giả sử chúng ta có API để lưu tin
      // await saveFavoritePost(postId);
      toast.success("Đã lưu tin này vào danh sách yêu thích");
    } catch (error) {
      console.error("Lỗi khi lưu tin:", error);
      toast.error("Không thể lưu tin. Vui lòng thử lại sau");
    }
  };

  const handleViewRental = () => {
    if (rental?.id) {
      router.push(`/nha-tro/${rental.id}`);
    }
  };

  const handleReportPost = () => {
    if (!isAuth) {
      toast.error("Bạn cần đăng nhập để báo cáo bài đăng");
      return;
    }

    toast.info("Tính năng báo cáo đang được phát triển");
    // Implement báo cáo bài đăng ở đây
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
    <div className="bg-background min-h-screen mx-auto">
      <div className=" mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
        {/* Back link */}
        <div className="mb-3 sm:mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground -ml-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Quay lại kết quả</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Cột chính với thông tin bài đăng */}
          <div className="lg:col-span-2">
            {/* Thông tin chính */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                {post?.title}
              </h1>
              <div className="flex items-center text-muted-foreground text-xs sm:text-sm space-x-1">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="line-clamp-1">
                  {post?.rental?.address || "Không có địa chỉ"}
                </span>
              </div>
            </div>

            {/* Slider hình ảnh */}
            <div className="relative mb-4 sm:mb-6 rounded-lg sm:rounded-xl overflow-hidden border bg-muted/20">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={images[activeImageIndex].url}
                  alt={`Hình ảnh ${activeImageIndex + 1}`}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                  className="object-cover"
                />

                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-7 h-7 sm:w-9 sm:h-9 shadow-sm"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-7 h-7 sm:w-9 sm:h-9 shadow-sm"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </>
                )}

                <div className="absolute bottom-2 right-2">
                  <Badge
                    variant="secondary"
                    className="bg-black/50 text-white font-normal text-xs py-0.5"
                  >
                    {activeImageIndex + 1}/{images.length}
                  </Badge>
                </div>
              </div>

              {/* Thanh thumbnail */}
              {images.length > 1 && (
                <ScrollArea className="w-full pb-1 pt-2">
                  <div className="flex px-2 gap-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`relative h-12 sm:h-16 w-20 sm:w-24 flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition ${
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
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </div>

            {/* Thông tin giá, trạng thái và các action */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span className="text-xl sm:text-2xl font-bold text-primary">
                    {room ? formatPrice(room.price) : "Liên hệ"}
                  </span>
                  <span className="text-muted-foreground text-sm">/tháng</span>
                </div>
                <div className="flex items-center mt-0.5 sm:mt-1 text-xs sm:text-sm">
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

                {/* Hiển thị thông tin tiền đặt cọc */}
                {post.deposit > 0 && (
                  <div className="mt-1 sm:mt-2 flex items-center">
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-800 border-amber-200 text-xs py-0.5 px-1.5 sm:px-2"
                    >
                      Đặt cọc:{" "}
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(post.deposit)}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={room?.isAvailable ? "default" : "destructive"}
                  className="text-xs h-5"
                >
                  {room?.isAvailable ? "Còn trống" : "Đã cho thuê"}
                </Badge>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-xs h-5"
                >
                  <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                </Badge>
              </div>
            </div>

            {/* Liên hệ */}
            <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
              <Button
                onClick={handleContactLandlord}
                className="flex gap-1 sm:gap-2 items-center h-8 sm:h-10 text-xs sm:text-sm"
              >
                <Phone size={14} className="sm:size-16" />
                Liên hệ chủ nhà
              </Button>

              {/* Rental Request Button */}
              {!isLandlord && room?.isAvailable && (
                <RentalRequestButton
                  postId={postId}
                  isAvailable={room?.isAvailable}
                  existingRequest={hasExistingRequest}
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                />
              )}

              <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-0">
                {postActions}
              </div>
            </div>

            {/* Tiện ích */}
            {amenities.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">
                  Tiện ích
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
                  {amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center p-1.5 sm:p-2 border rounded-md bg-background"
                    >
                      <span className="text-xs sm:text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mô tả chi tiết */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">
                Mô tả chi tiết
              </h3>
              <div className="prose prose-sm max-w-none text-gray-700 text-xs sm:text-sm">
                <p className="whitespace-pre-line">
                  {post.description || "Không có mô tả chi tiết"}
                </p>
              </div>
            </div>

            {/* Thông tin đặt cọc */}
            {post.deposit > 0 && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 border border-amber-200 rounded-lg bg-amber-50">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-amber-800 mb-1 sm:mb-2">
                      Điều kiện đặt cọc
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-700 mb-1.5 sm:mb-2">
                      Chủ nhà yêu cầu đặt cọc{" "}
                      <span className="font-semibold">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(post.deposit)}
                      </span>{" "}
                      khi thuê phòng này.
                    </p>
                    <p className="text-xs sm:text-sm text-amber-700">
                      Số tiền cọc sẽ được hoàn trả khi kết thúc hợp đồng thuê
                      nếu không có hư hỏng tài sản và đã thanh toán đầy đủ các
                      khoản phí liên quan (điện, nước, internet...).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin nhà trọ */}
            <div className="p-3 sm:p-4 border rounded-lg bg-muted/10 mb-4 sm:mb-6">
              <div className="flex items-start gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Home className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-sm sm:text-base">
                    Thuộc nhà trọ: {rental?.title || "Không có thông tin"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                    {rental?.address}
                  </p>
                </div>
              </div>
              {rental?.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 ml-5 sm:ml-7 line-clamp-2">
                  {rental.description}
                </p>
              )}
              <div className="mt-2 sm:mt-3 ml-5 sm:ml-7">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 sm:h-9 text-xs sm:text-sm"
                  onClick={handleViewRental}
                >
                  Xem thông tin nhà trọ
                </Button>
              </div>
            </div>

            {/* Google Maps location */}
            {googleMapsUrl && (
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <h3 className="text-base sm:text-lg font-medium">
                    Vị trí trên bản đồ
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                    className="h-7 sm:h-9 text-xs sm:text-sm"
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
            <div className="mt-6 sm:mt-8">
              <Separator className="mb-4 sm:mb-6" />
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Đánh giá & Bình luận
                </h3>
              </div>

              <Card className="overflow-hidden shadow-sm">
                <CardContent className="p-0">
                  {/* Header phần bình luận */}
                  <div className="p-3 sm:p-4 border-b bg-card flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Badge
                        variant="outline"
                        className="bg-primary/5 text-primary hover:bg-primary/10 py-1 sm:py-1.5 h-auto text-xs"
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
                      className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 border-dashed"
                      onClick={() => {
                        window.location.reload();
                      }}
                    >
                      <RefreshCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-2" />
                      Làm mới
                    </Button>
                  </div>

                  {/* Phần hiển thị bình luận - Sử dụng component tách biệt */}
                  <div className="flex flex-col bg-background">
                    <RealTimeComments
                      postId={postId}
                      commentInputRef={commentInputRef}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <RelatedPostsSection postId={postId} rentalId={rental?.id || 0} />
          </div>

          {/* Sidebar với thông tin chủ nhà và nhà trọ */}
          <div>
            <div className="mt-4 block lg:hidden"></div>
            <div className="lg:sticky lg:top-20">
              {/* Thông tin người cho thuê */}
              <Card className="mb-4">
                <CardContent className="p-3 sm:p-5">
                  <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">
                    Thông tin người cho thuê
                  </h3>
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-gray-200">
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
                      <p className="font-medium text-sm sm:text-base">
                        {post.landlord?.name || "Không có thông tin"}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Chủ nhà trọ
                      </p>
                    </div>
                  </div>

                  {post.landlord?.phoneNumber && (
                    <Button
                      className="w-full mb-2 h-8 sm:h-10 text-xs sm:text-sm"
                      variant="default"
                      onClick={handleContactLandlord}
                    >
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      {post.landlord.phoneNumber}
                    </Button>
                  )}

                  {/* Hiển thị nút nhắn tin chỉ khi người dùng đã đăng nhập và không phải là chủ nhà */}
                  {isAuth && !isLandlord && (
                    <Button
                      className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                      variant="outline"
                      onClick={handleSendMessage}
                      disabled={loadingConversation}
                    >
                      {loadingConversation ? "Đang xử lý..." : "Nhắn tin"}
                    </Button>
                  )}

                  {/* Hiển thị thông báo khi người dùng là chủ nhà */}
                  {isAuth && isLandlord && (
                    <div className="text-[10px] sm:text-xs text-center text-muted-foreground mt-2">
                      Bạn là chủ nhà trọ này
                    </div>
                  )}

                  {!isAuth && (
                    <div className="mt-2">
                      <Link href="/dang-nhap">
                        <Button
                          className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                          variant="outline"
                        >
                          Đăng nhập để nhắn tin
                        </Button>
                      </Link>
                    </div>
                  )}

                  {post.landlord?.email && (
                    <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-2">
                      {post.landlord.email}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Form đặt lịch xem phòng */}
              <Card className="mb-4">
                <CardContent className="p-3 sm:p-5">
                  <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">
                    Đặt lịch xem phòng
                  </h3>

                  {!isAuth && (
                    <Alert variant="default" className="bg-muted p-2 sm:p-3">
                      <CalendarX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <AlertTitle className="text-xs sm:text-sm">
                        Cần đăng nhập
                      </AlertTitle>
                      <AlertDescription className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs">
                        Bạn cần đăng nhập để đặt lịch xem phòng
                      </AlertDescription>
                      <Link href="/dang-nhap">
                        <Button
                          size="sm"
                          className="mt-1.5 sm:mt-2 h-7 sm:h-9 text-xs"
                        >
                          Đăng nhập
                        </Button>
                      </Link>
                    </Alert>
                  )}

                  {isAuth && isLandlordOrAdmin && (
                    <Alert variant="default" className="bg-muted p-2 sm:p-3">
                      <CalendarX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <AlertTitle className="text-xs sm:text-sm">
                        Không thể đặt lịch
                      </AlertTitle>
                      <AlertDescription className="text-[10px] sm:text-xs">
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
                          ? "bg-yellow-50 p-2 sm:p-3"
                          : existingSchedule.status === "APPROVED"
                          ? "bg-green-50 p-2 sm:p-3"
                          : "bg-blue-50 p-2 sm:p-3"
                      }
                    >
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <AlertTitle className="text-xs sm:text-sm">
                        {existingSchedule.status === "PENDING"
                          ? "Đang chờ xác nhận"
                          : existingSchedule.status === "APPROVED"
                          ? "Đã xác nhận lịch hẹn"
                          : "Đã đổi lịch"}
                      </AlertTitle>
                      <AlertDescription className="text-[10px] sm:text-xs">
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
                <CardContent className="p-3 sm:p-5">
                  <h3 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                    Thông tin chi tiết
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
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
                    <li className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">
                        Tiền đặt cọc:
                      </span>
                      <span className="font-medium">
                        {post.deposit > 0
                          ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(post.deposit)
                          : "Không yêu cầu đặt cọc"}
                      </span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span className="text-muted-foreground">Trạng thái:</span>
                      <Badge
                        variant={
                          post.status === "ACTIVE" ? "default" : "outline"
                        }
                        className="font-normal text-xs h-5"
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
              <div className="text-center p-3 sm:p-4 bg-muted/20 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                  Bạn có phòng trọ cần cho thuê?
                </p>
                <Link href="/dang-tin">
                  <Button className="w-full h-8 sm:h-10 text-xs sm:text-sm">
                    Đăng tin ngay
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full h-8 sm:h-10 text-xs sm:text-sm mt-2"
                  onClick={handleReportPost}
                >
                  Báo cáo bài đăng
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedPostsSection({
  postId,
  rentalId,
}: {
  postId: number;
  rentalId: number;
}) {
  const { data: similarPosts, isLoading: loadingSimilar } =
    useGetSimilarPostsByPrice(postId);
  const { data: sameRentalPosts, isLoading: loadingSameRental } =
    useGetSameRentalPosts(rentalId, postId);

  const hasSimilarPosts = similarPosts?.data && similarPosts.data.length > 0;
  const hasSameRentalPosts =
    sameRentalPosts?.data && sameRentalPosts.data.length > 0;

  return (
    <div className="mt-6 sm:mt-10">
      <Separator className="mb-4 sm:mb-6" />

      <Tabs defaultValue="similar">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-semibold">
            Phòng trọ liên quan
          </h3>
          <TabsList className="h-8 sm:h-9">
            <TabsTrigger
              value="similar"
              className="text-xs sm:text-sm h-7 sm:h-8"
            >
              Giá tương tự
            </TabsTrigger>
            <TabsTrigger
              value="sameRental"
              className="text-xs sm:text-sm h-7 sm:h-8"
            >
              Cùng nhà trọ
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="similar">
          {loadingSimilar ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-2 sm:p-3">
                    <Skeleton className="h-3 sm:h-4 w-3/4 mb-1.5 sm:mb-2" />
                    <Skeleton className="h-2.5 sm:h-3 w-full mb-1.5 sm:mb-2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-2.5 sm:h-3 w-1/3" />
                      <Skeleton className="h-2.5 sm:h-3 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !hasSimilarPosts ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              Không tìm thấy phòng trọ có giá tương tự
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {similarPosts.data.map((post) => (
                <SimilarPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sameRental">
          {loadingSameRental ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-2 sm:p-3">
                    <Skeleton className="h-3 sm:h-4 w-3/4 mb-1.5 sm:mb-2" />
                    <Skeleton className="h-2.5 sm:h-3 w-full mb-1.5 sm:mb-2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-2.5 sm:h-3 w-1/3" />
                      <Skeleton className="h-2.5 sm:h-3 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !hasSameRentalPosts ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              Không tìm thấy phòng trọ khác trong cùng nhà trọ
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {sameRentalPosts.data.map((post) => (
                <SimilarPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className=" mx-auto px-4 py-4 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div>
            <Skeleton className="h-6 sm:h-8 w-2/3" />
            <Skeleton className="h-3 sm:h-4 w-1/2 mt-1 sm:mt-2" />
          </div>

          <Skeleton className="aspect-video w-full rounded-lg" />

          <div className="flex justify-between items-center">
            <Skeleton className="h-6 sm:h-8 w-1/3" />
            <div className="flex space-x-2">
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Skeleton className="h-5 sm:h-6 w-1/4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Skeleton className="h-8 sm:h-10 w-full" />
              <Skeleton className="h-8 sm:h-10 w-full" />
              <Skeleton className="h-8 sm:h-10 w-full" />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Skeleton className="h-5 sm:h-6 w-1/4" />
            <Skeleton className="h-16 sm:h-20 w-full" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Skeleton className="h-[120px] sm:h-[150px] w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-[180px] sm:h-[200px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RealTimeComments({
  postId,
  commentInputRef,
}: {
  postId: number;
  commentInputRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const {
    comments,
    loading,
    isSubmitting,
    newComment,
    setNewComment,
    addComment,
    isAuth,
    totalComments,
  } = useComments(postId);

  const handleAddComment = async () => {
    if (!newComment.trim() || !isAuth) return;

    try {
      await addComment();
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
    }
  };

  // Hiển thị bình luận theo thứ tự mới nhất đầu tiên
  const renderComments = () => {
    if (comments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-medium mb-1">Chưa có bình luận</h4>
          <p className="text-xs text-muted-foreground">
            Hãy là người đầu tiên bình luận về bài đăng này
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={`comment-${comment.id}`} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={comment.user?.avatar || ""}
                    alt={comment.user?.name || "User"}
                  />
                  <AvatarFallback>
                    {comment.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">
                        {comment.user?.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(comment.createdAt).toLocaleString("vi-VN", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>
              </div>

              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-11 mt-3 space-y-3">
                  {comment.replies.map((reply: any) => (
                    <div key={`reply-${reply.id}`} className="border-l-2 pl-3">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={reply.user?.avatar || ""}
                            alt={reply.user?.name || "User"}
                          />
                          <AvatarFallback>
                            {reply.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="font-medium text-xs">
                              {reply.user?.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-2">
                              {new Date(reply.createdAt).toLocaleString(
                                "vi-VN",
                                {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>

                          <p className="text-xs mt-0.5">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Phần hiển thị bình luận */}
      <div className="bg-muted/5 min-h-[250px] max-h-[450px] overflow-y-auto">
        {loading && comments.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-xs text-muted-foreground">
                Đang tải bình luận...
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5">{renderComments()}</div>
        )}
      </div>

      {/* Form nhập bình luận - Thiết kế mới */}
      <div className="border-t bg-card p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarImage
              src={isAuth ? "/placeholder.svg?height=40&width=40" : ""}
              alt="Avatar"
            />
            <AvatarFallback>{isAuth ? "U" : "?"}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="relative">
              <Textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] sm:min-h-[100px] w-full resize-none"
                placeholder={
                  isAuth
                    ? "Chia sẻ ý kiến của bạn về bài đăng này..."
                    : "Vui lòng đăng nhập để bình luận"
                }
                disabled={!isAuth || isSubmitting}
              />

              {!isAuth && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
                  <div className="text-center p-4">
                    <Lock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-3">
                      Bạn cần đăng nhập để bình luận
                    </p>
                    <Button asChild size="sm">
                      <Link href="/dang-nhap">Đăng nhập</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                Chia sẻ đánh giá chân thực để giúp người khác
              </p>
              <Button
                onClick={handleAddComment}
                disabled={!isAuth || !newComment.trim() || isSubmitting}
                size="sm"
                className="gap-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"></div>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Gửi bình luận</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
