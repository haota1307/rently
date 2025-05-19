"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CalendarIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  HomeIcon,
  ArrowRightIcon,
  ThumbsUpIcon,
  HelpCircleIcon,
  FileTextIcon,
  UserIcon,
  CoinsIcon,
  InfoIcon,
  PhoneIcon,
  MailIcon,
} from "lucide-react";
import Link from "next/link";
import {
  RentalRequestStatus,
  RentalRequestType,
} from "@/schemas/rental-request.schema";
import { useGetTenantRentalRequests } from "@/features/rental-request";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";

// Kiểu dữ liệu cho trạng thái tab
type TabType = "ALL" | "APPROVED" | "REJECTED" | "CANCELED" | "PENDING";

export default function RentedRoomsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [selectedRental, setSelectedRental] =
    useState<RentalRequestType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const {
    data: rentalRequestsResponse,
    isLoading,
    error,
  } = useGetTenantRentalRequests({
    limit: 10,
    page: 1,
    status:
      activeTab !== "ALL" ? (activeTab as RentalRequestStatus) : undefined,
  });

  console.log({ rentalRequestsResponse });

  const rentalRequests = rentalRequestsResponse?.data || [];

  const handleOpenDetail = (rental: RentalRequestType) => {
    setSelectedRental(rental);
    setIsDetailOpen(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6">
          <p className="text-center text-muted-foreground">
            Đã xảy ra lỗi khi tải lịch sử thuê phòng.
          </p>
        </div>
      );
    }

    if (!rentalRequests || rentalRequests.length === 0) {
      return (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-3">
            <HomeIcon className="h-6 w-6 text-primary" />
          </div>
          <p className="text-lg font-medium">Không có phòng đã thuê nào</p>
          <p className="text-muted-foreground">
            Bạn chưa thuê phòng trọ nào. Hãy tìm phòng trọ và thuê ngay!
          </p>
          <Button className="mt-4" asChild>
            <Link href="/phong-tro">Tìm phòng trọ</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left pb-3 font-medium">Phòng trọ</th>
              <th className="text-left pb-3 font-medium">Ngày dự kiến thuê</th>
              <th className="text-left pb-3 font-medium">Thời hạn thuê</th>
              <th className="text-left pb-3 font-medium">Tiền cọc</th>
              <th className="text-left pb-3 font-medium">Trạng thái</th>
              <th className="text-right pb-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rentalRequests.map((rental: RentalRequestType) => (
              <tr key={rental.id} className="border-b hover:bg-muted/50">
                <td className="py-4 font-medium">{rental.post.title}</td>
                <td className="py-4">
                  {format(new Date(rental.expectedMoveDate), "dd/MM/yyyy", {
                    locale: vi,
                  })}
                </td>
                <td className="py-4">{rental.duration} tháng</td>
                <td className="py-4">
                  {rental.depositAmount
                    ? new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(rental.depositAmount)
                    : "Chưa đặt cọc"}
                </td>
                <td className="py-4">
                  <Badge
                    variant={
                      rental.status === RentalRequestStatus.APPROVED
                        ? "default"
                        : rental.status === RentalRequestStatus.CANCELED
                          ? "destructive"
                          : rental.status === RentalRequestStatus.REJECTED
                            ? "outline"
                            : "secondary"
                    }
                  >
                    {rental.status === RentalRequestStatus.APPROVED
                      ? "Đã thuê"
                      : rental.status === RentalRequestStatus.PENDING
                        ? "Đang chờ"
                        : rental.status === RentalRequestStatus.REJECTED
                          ? "Bị từ chối"
                          : "Đã hủy"}
                  </Badge>
                </td>
                <td className="py-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetail(rental)}
                    className="flex items-center gap-1"
                  >
                    <InfoIcon className="h-4 w-4" />
                    Xem chi tiết
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className=" mx-8 py-6 space-y-6">
      <PageHeader
        title="Phòng Đã Thuê"
        description="Quản lý và theo dõi tất cả các phòng đã thuê của bạn"
      />

      {/* Tabs chính */}
      <Tabs
        defaultValue="ALL"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-5 w-auto">
            <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            <TabsTrigger value="APPROVED">Đã thuê</TabsTrigger>
            <TabsTrigger value="PENDING">Đang chờ</TabsTrigger>
            <TabsTrigger value="REJECTED">Bị từ chối</TabsTrigger>
            <TabsTrigger value="CANCELED">Đã hủy</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <Card className="border shadow-sm">
            <CardContent className="p-0">{renderContent()}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Chi tiết phòng đã thuê */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto max-w-3xl p-0">
          <div className="bg-gradient-to-r from-primary/90 to-primary text-white p-6 rounded-t-lg">
            <DialogTitle className="text-2xl font-bold">
              Chi tiết phòng đã thuê
            </DialogTitle>
            <DialogDescription className="text-white/80 mt-1">
              Thông tin chi tiết về phòng và trạng thái thuê
            </DialogDescription>
          </div>

          {selectedRental && (
            <div className="p-6 space-y-6">
              {/* Thông tin phòng */}
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                  <HomeIcon className="h-5 w-5" />
                  Thông tin phòng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Tên phòng</p>
                    <p className="font-medium text-lg">
                      {selectedRental.post.title}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Mã phòng</p>
                    <p className="font-medium text-lg">
                      #{selectedRental.post.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chi tiết thuê */}
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                  <FileTextIcon className="h-5 w-5" />
                  Chi tiết thuê
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Ngày dự kiến thuê
                    </p>
                    <p className="font-medium">
                      {format(
                        new Date(selectedRental.expectedMoveDate),
                        "dd/MM/yyyy",
                        {
                          locale: vi,
                        }
                      )}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Thời hạn thuê
                    </p>
                    <p className="font-medium">
                      {selectedRental.duration} tháng
                    </p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Tiền cọc</p>
                    <p className="font-medium text-primary">
                      {selectedRental.depositAmount
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(selectedRental.depositAmount)
                        : "Chưa đặt cọc"}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    <Badge
                      className="mt-1 text-sm px-3 py-1"
                      variant={
                        selectedRental.status === RentalRequestStatus.APPROVED
                          ? "default"
                          : selectedRental.status ===
                              RentalRequestStatus.CANCELED
                            ? "destructive"
                            : selectedRental.status ===
                                RentalRequestStatus.REJECTED
                              ? "outline"
                              : "secondary"
                      }
                    >
                      {selectedRental.status === RentalRequestStatus.APPROVED
                        ? "Đã thuê"
                        : selectedRental.status === RentalRequestStatus.PENDING
                          ? "Đang chờ"
                          : selectedRental.status ===
                              RentalRequestStatus.REJECTED
                            ? "Bị từ chối"
                            : "Đã hủy"}
                    </Badge>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Hợp đồng đã ký
                    </p>
                    <p className="font-medium">
                      {selectedRental.contractSigned ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" /> Đã ký
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-600">
                          <Clock className="h-4 w-4 mr-1" /> Chưa ký
                        </span>
                      )}
                    </p>
                  </div>
                  {selectedRental.note && (
                    <div className="col-span-2 bg-muted/30 p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">Ghi chú</p>
                      <p className="font-medium">{selectedRental.note}</p>
                    </div>
                  )}
                  {selectedRental.rejectionReason && (
                    <div className="col-span-2 bg-red-50 p-3 rounded-md border border-red-100">
                      <p className="text-sm text-red-600">Lý do từ chối</p>
                      <p className="font-medium text-red-600">
                        {selectedRental.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin chi tiết phòng trọ hiển thị trực tiếp trên modal */}
              {selectedRental.post && (
                <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                    <HomeIcon className="h-5 w-5" />
                    Chi tiết phòng trọ
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-violet-50 p-4 rounded-lg border border-blue-100">
                      <p className="font-semibold text-lg text-blue-900">
                        {selectedRental.post.title}
                      </p>
                      {selectedRental.post.description && (
                        <p className="text-blue-700 text-sm mt-2 line-clamp-3">
                          {selectedRental.post.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="bg-white">
                          ID: {selectedRental.post.id}
                        </Badge>
                        {selectedRental.status ===
                          RentalRequestStatus.APPROVED && (
                          <Badge variant="default">Đã được duyệt</Badge>
                        )}
                      </div>

                      {selectedRental.post.rental && (
                        <div className="mt-4 border-t border-blue-100 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm text-blue-700">
                                Tên nhà trọ
                              </p>
                              <p className="font-medium">
                                {selectedRental.post.rental.title}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-blue-700">
                                Địa chỉ nhà trọ
                              </p>
                              <p className="font-medium">
                                {selectedRental.post.rental.address ||
                                  "Chưa cập nhật"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedRental.post.room && (
                        <div className="mt-4 border-t border-blue-100 pt-4">
                          <p className="text-sm font-medium text-blue-800 mb-2">
                            Thông tin phòng
                          </p>
                          <div className="grid grid-cols-2 gap-3 mt-1">
                            <div className="bg-white/70 p-2 rounded shadow-sm">
                              <p className="text-xs text-blue-700">Tên phòng</p>
                              <p className="font-medium">
                                {selectedRental.post.room.title}
                              </p>
                            </div>
                            {selectedRental.post.room.area && (
                              <div className="bg-white/70 p-2 rounded shadow-sm">
                                <p className="text-xs text-blue-700">
                                  Diện tích
                                </p>
                                <p className="font-medium">
                                  {selectedRental.post.room.area} m²
                                </p>
                              </div>
                            )}
                            {selectedRental.post.room.price && (
                              <div className="bg-white/70 p-2 rounded shadow-sm">
                                <p className="text-xs text-blue-700">
                                  Giá phòng
                                </p>
                                <p className="font-medium text-primary">
                                  {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                  }).format(selectedRental.post.room.price)}
                                </p>
                              </div>
                            )}
                            {selectedRental.post.price && (
                              <div className="bg-white/70 p-2 rounded shadow-sm">
                                <p className="text-xs text-blue-700">
                                  Giá đăng bài
                                </p>
                                <p className="font-medium text-primary">
                                  {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                  }).format(selectedRental.post.price)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Thông tin chủ nhà */}
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                  <UserIcon className="h-5 w-5" />
                  Thông tin chủ nhà
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Tên chủ nhà</p>
                    <p className="font-medium">
                      {selectedRental.landlord.name}
                    </p>
                  </div>
                  {selectedRental.landlord.phoneNumber && (
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Số điện thoại
                      </p>
                      <p className="font-medium flex items-center gap-1">
                        <PhoneIcon className="h-3 w-3 text-primary" />
                        {selectedRental.landlord.phoneNumber}
                      </p>
                    </div>
                  )}
                  <div className="col-span-1 md:col-span-2 bg-muted/30 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-1">
                      <MailIcon className="h-3 w-3 text-primary" />
                      {selectedRental.landlord.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/10 p-4 rounded-lg border border-dashed border-muted-foreground/20">
                <div className="text-sm text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Yêu cầu được tạo lúc:{" "}
                    {format(
                      new Date(selectedRental.createdAt),
                      "HH:mm - dd/MM/yyyy",
                      { locale: vi }
                    )}
                  </p>
                  <p className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    Cập nhật lần cuối:{" "}
                    {format(
                      new Date(selectedRental.updatedAt),
                      "HH:mm - dd/MM/yyyy",
                      { locale: vi }
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-4 border-t bg-muted/10">
            <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hướng dẫn sử dụng cho người thuê */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <HelpCircleIcon className="h-5 w-5 text-primary" />
            Hướng dẫn về quá trình thuê phòng
          </CardTitle>
          <CardDescription>
            Các thông tin và lưu ý quan trọng khi thuê phòng
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ArrowRightIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">
                    Quy trình thuê phòng
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Khi bạn gửi yêu cầu thuê phòng, chủ nhà sẽ xem xét và phản
                    hồi trong vòng 24h. Nếu được chấp nhận, bạn sẽ tiến hành đàm
                    phán chi tiết và ký hợp đồng.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Yêu cầu đang chờ</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Yêu cầu thuê ở trạng thái "Đang chờ" nghĩa là chủ nhà đang
                    xem xét. Bạn có thể hủy yêu cầu nếu đổi ý trong giai đoạn
                    này.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Yêu cầu đã thuê</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Khi yêu cầu được chấp nhận, bạn nên liên hệ với chủ nhà để
                    thảo luận về hợp đồng, đặt cọc và các chi tiết quan trọng
                    khác.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <FileTextIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Hợp đồng thuê</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Đảm bảo đọc kỹ hợp đồng trước khi ký. Hợp đồng cần có đầy đủ
                    thông tin về giá cả, thời hạn, tiền cọc, quy định và trách
                    nhiệm của các bên.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <CoinsIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Tiền cọc</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tiền cọc thường tương đương 1-2 tháng tiền thuê. Luôn yêu
                    cầu biên nhận khi đặt cọc và làm rõ các điều kiện hoàn trả.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">
                    Quyền và trách nhiệm
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hiểu rõ quyền lợi và trách nhiệm của bạn trong thời gian
                    thuê. Tôn trọng các quy định của chủ nhà và duy trì liên lạc
                    tốt để giải quyết các vấn đề phát sinh.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle>Lưu ý quan trọng</AlertTitle>
            <AlertDescription className="text-blue-700">
              Luôn kiểm tra tình trạng phòng ở trước khi chuyển vào. Ghi lại và
              chụp ảnh mọi hư hỏng có sẵn để tránh tranh chấp về tiền cọc sau
              này. Nếu có bất kỳ thắc mắc nào, hãy liên hệ với chúng tôi để được
              hỗ trợ.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="flex justify-center border-t bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground text-center">
            Cần hỗ trợ thêm? Hãy{" "}
            <Link href="/lien-he" className="text-primary font-medium">
              liên hệ với chúng tôi
            </Link>{" "}
            để được trợ giúp.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
