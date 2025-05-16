"use client";

import { useGetPostDetail } from "@/features/post/usePost";
import { use, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useViewingSchedule } from "@/features/viewing-schedule/useViewingSchedule";
import { useAppStore } from "@/components/app-provider";
import { Role } from "@/constants/type";
import { useAuth } from "@/hooks/use-auth";
import { ReportPostButton } from "@/features/post-report/components";

import { PostDetailSkeleton } from "@/app/(main)/bai-dang/[id]/_components/post-detail-skeleton";
import { ImageGallery } from "@/app/(main)/bai-dang/[id]/_components/image-gallery";
import { PostHeader } from "@/app/(main)/bai-dang/[id]/_components/post-header";
import { PostPriceInfo } from "@/app/(main)/bai-dang/[id]/_components/post-price-info";
import { PostActions } from "@/app/(main)/bai-dang/[id]/_components/post-actions";
import { AmenitiesSection } from "@/app/(main)/bai-dang/[id]/_components/amenities-section";
import { PostDescription } from "@/app/(main)/bai-dang/[id]/_components/post-description";
import { LandlordInfo } from "@/app/(main)/bai-dang/[id]/_components/landlord-info";
import { DepositInfo } from "@/app/(main)/bai-dang/[id]/_components/deposit-info";
import { RentalInfo } from "@/app/(main)/bai-dang/[id]/_components/rental-info";
import { LocationMap } from "@/app/(main)/bai-dang/[id]/_components/location-map";
import { PostDetailsCard } from "@/app/(main)/bai-dang/[id]/_components/post-details-card";
import { RentalRequestSection } from "@/app/(main)/bai-dang/[id]/_components/rental-request-section";
import { ViewingScheduleSection } from "@/app/(main)/bai-dang/[id]/_components/viewing-schedule-section";
import { CommentSection } from "@/app/(main)/bai-dang/[id]/_components/comment-section";
import { RelatedPostsSection } from "@/app/(main)/bai-dang/[id]/_components/related-posts";

interface PostDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = use(params);
  const postId = parseInt(id);
  const { data: post, isLoading, error } = useGetPostDetail(postId);

  // Lấy thông tin về lịch hẹn xem phòng hiện tại của người dùng
  const { getViewingSchedules } = useViewingSchedule();
  const { data: schedules } = getViewingSchedules({
    page: 1,
    limit: 10,
  });

  const role = useAppStore((state) => state.role);
  const { userId, isAuthenticated: isAuth } = useAuth();

  // Kiểm tra nếu người dùng là landlord hoặc admin thì không hiển thị form đặt lịch
  const isLandlordOrAdmin = role === Role.Landlord || role === Role.Admin;

  // Kiểm tra xem người dùng đã có lịch hẹn chưa bị từ chối
  const existingSchedule = schedules?.data?.find(
    (schedule) => schedule.post.id === postId && schedule.status !== "REJECTED"
  );

  // Kiểm tra xem người dùng có phải là chủ nhà hay không
  const isLandlord = post?.landlord?.id === userId;

  // Add a check for existing rental request (if user already has a rental request for this post)
  const [hasExistingRequest, setHasExistingRequest] = useState(false);

  // Check for existing rental request
  useEffect(() => {
    if (!userId || !post) return;

    // Kiểm tra xem người dùng đã có yêu cầu thuê cho bài đăng này chưa
    // Logic này sẽ được triển khai trong component thực tế
    // Ở đây chỉ giữ lại phần xử lý state để giữ logic UI
    setHasExistingRequest(false);
  }, [userId, post]);

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (error || !post) {
    return (
      <div className="mx-auto px-4 py-8">
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

  return (
    <div className="bg-background min-h-screen mx-auto">
      <div className="mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
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
            <PostHeader
              title={post.title}
              address={post.rental?.address || ""}
            />

            {/* Slider hình ảnh */}
            <ImageGallery images={images} />

            {/* Thông tin giá, trạng thái và các action */}
            <PostPriceInfo
              price={room?.price || 0}
              area={room?.area}
              isAvailable={room?.isAvailable || false}
              createdAt={post.createdAt.toString()}
              deposit={post.deposit}
            />

            {/* Liên hệ */}
            <PostActions
              post={post}
              landlordId={post.landlord?.id || 0}
              landlordPhoneNumber={post.landlord?.phoneNumber || ""}
              isLandlord={isLandlord}
            />

            {/* Tiện ích */}
            <AmenitiesSection amenities={amenities} />

            {/* Mô tả chi tiết */}
            <PostDescription description={post.description} />

            {/* Phần bình luận */}
            <CommentSection postId={postId} />

            {/* Bài đăng liên quan */}
            <RelatedPostsSection postId={postId} rentalId={rental?.id || 0} />
          </div>

          {/* Sidebar với thông tin chủ nhà và nhà trọ */}
          <div>
            <div className="mt-4 block lg:hidden"></div>
            <div className="lg:sticky lg:top-20">
              {/* Thông tin người cho thuê */}
              <LandlordInfo
                landlord={{
                  id: post.landlord?.id || 0,
                  name: post.landlord?.name || "",
                  avatar: post.landlord?.avatar || undefined,
                  phoneNumber: post.landlord?.phoneNumber || undefined,
                  email: post.landlord?.email || undefined,
                }}
                isLandlord={isLandlord}
              />

              {/* Thông tin đặt cọc */}
              <DepositInfo deposit={post.deposit} />

              {/* Thông tin nhà trọ */}
              <RentalInfo rental={rental} />

              {/* Vị trí trên bản đồ */}
              <LocationMap lat={rental?.lat} lng={rental?.lng} />

              {/* Thông tin chi tiết */}
              <PostDetailsCard
                post={{
                  id: post.id,
                  createdAt: post.createdAt.toString(),
                  startDate: post.startDate?.toString(),
                  endDate: post.endDate?.toString(),
                  deposit: post.deposit,
                  status: post.status,
                }}
                roomArea={room?.area}
              />

              {/* Form gửi yêu cầu thuê */}
              <RentalRequestSection
                postId={postId}
                isAuth={isAuth}
                isLandlord={isLandlord}
                isLandlordOrAdmin={isLandlordOrAdmin}
                hasExistingRequest={hasExistingRequest}
                isRoomAvailable={room?.isAvailable || false}
              />

              {/* Form đặt lịch xem phòng */}
              <ViewingScheduleSection
                postId={postId}
                isAuth={isAuth}
                isLandlordOrAdmin={isLandlordOrAdmin}
                existingSchedule={existingSchedule}
              />

              {isAuth && !isLandlord && (
                <div className="mt-2">
                  <ReportPostButton
                    postId={postId}
                    variant="outline"
                    className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
