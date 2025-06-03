"use client";

import { useGetRoomDetail } from "@/features/rooms/useRoom";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Home,
  User,
  Calendar,
  FileText,
  Clock,
  Receipt,
  Edit,
  Loader2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import contractApiRequest from "@/features/rental-contract/contract.api";
import { EditRoomModal } from "@/features/rooms/components/edit-room-modal";
import { CreateRoomBillModal } from "@/features/rooms/components/create-room-bill-modal";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

// Định nghĩa các types
interface Contract {
  id: number;
  contractNumber: string;
  status: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  deposit: number;
  tenant: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  landlordSignedAt: Date | null;
  tenantSignedAt: Date | null;
}

interface RentalHistory {
  tenantId: number;
  tenantName: string;
  startDate: Date;
  endDate: Date;
  contractId: number;
}

export default function RoomDetail() {
  const params = useParams();
  const router = useRouter();
  const roomId = parseInt(params.id as string, 10);
  const [activeTab, setActiveTab] = useState("info");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);

  // Sử dụng hook hiện có để lấy thông tin phòng
  const {
    data: room,
    isLoading: isLoadingRoom,
    error: roomError,
  } = useGetRoomDetail(roomId);

  // Tạo query để lấy hợp đồng liên quan đến phòng
  const { data: contracts, isLoading: isLoadingContracts } = useQuery({
    queryKey: ["roomContracts", roomId],
    queryFn: async () => {
      try {
        // Lấy danh sách hợp đồng và lọc theo phòng
        const res = await contractApiRequest.list({ limit: 100 });
        // Lọc hợp đồng theo roomId
        return res.payload.data.filter(
          (contract) => contract.roomId === roomId
        );
      } catch (error) {
        console.error("Lỗi khi lấy hợp đồng phòng:", error);
        return [];
      }
    },
    enabled: !!roomId,
  });

  const activeContract = contracts?.find(
    (contract) =>
      contract.status === "ACTIVE" ||
      contract.status === "AWAITING_LANDLORD_SIGNATURE" ||
      contract.status === "AWAITING_TENANT_SIGNATURE"
  );

  // Tạo lịch sử thuê phòng từ hợp đồng
  const rentalHistory = contracts
    ?.filter(
      (contract) =>
        contract.status === "ACTIVE" ||
        contract.status === "EXPIRED" ||
        contract.status === "TERMINATED" ||
        contract.status === "RENEWED"
    )
    .map((contract) => ({
      tenantId: contract.tenant.id,
      tenantName: contract.tenant.name,
      startDate: new Date(contract.startDate),
      endDate: new Date(contract.endDate),
      contractId: contract.id,
    }))
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

  // Xử lý quay lại
  const handleGoBack = () => {
    router.push("/cho-thue/phong-tro");
  };

  // Xử lý chuyển đến trang chỉnh sửa
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  // Xử lý tạo hóa đơn
  const handleCreateBill = () => {
    setIsCreateBillModalOpen(true);
  };

  if (isLoadingRoom) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Chi tiết phòng trọ</h1>
        </header>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Đang tải thông tin phòng...</span>
        </div>
      </SidebarInset>
    );
  }

  if (roomError || !room) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Chi tiết phòng trọ</h1>
        </header>
        <div className="p-6 text-center">
          <p className="text-red-500">
            Không thể tải thông tin phòng. Vui lòng thử lại sau.
          </p>
          <Button className="mt-4" onClick={handleGoBack}>
            Quay lại danh sách phòng
          </Button>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Chi tiết phòng trọ</h1>
        </div>
      </header>

      <div className="m-4 space-y-6">
        {/* Header thông tin */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold">{room.title}</h1>
            <div className="flex items-center text-muted-foreground space-x-2">
              <Home className="h-4 w-4" />
              <span>Mã phòng: #{room.id}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              className={
                room.isAvailable
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }
            >
              {room.isAvailable ? "Còn trống" : "Đã thuê"}
            </Badge>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa phòng
            </Button>
            {!room.isAvailable && (
              <Button onClick={handleCreateBill}>
                <Receipt className="h-4 w-4 mr-2" />
                Tạo hóa đơn
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="info"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
            <TabsTrigger value="info">Thông tin phòng</TabsTrigger>
            <TabsTrigger value="contract">Hợp đồng</TabsTrigger>
            <TabsTrigger value="history">Lịch sử thuê</TabsTrigger>
          </TabsList>

          {/* Tab thông tin phòng */}
          <TabsContent value="info" className="space-y-6">
            {/* Hình ảnh phòng */}
            <Card>
              <CardHeader>
                <CardTitle>Hình ảnh phòng</CardTitle>
              </CardHeader>
              <CardContent>
                {room.roomImages && room.roomImages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {room.roomImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-md overflow-hidden"
                      >
                        <Image
                          src={image.imageUrl || "/placeholder.svg"}
                          alt={`Ảnh ${index + 1} của ${room.title}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center bg-gray-100 rounded-md">
                    <p className="text-gray-500">Không có hình ảnh</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Thông tin chi tiết */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giá thuê:</span>
                    <span className="font-medium text-green-600">
                      {formatPrice(room.price)}/tháng
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diện tích:</span>
                    <span className="font-medium">{room.area} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mã nhà trọ:</span>
                    <span className="font-medium">{room.rentalId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <span
                      className={`font-medium ${room.isAvailable ? "text-green-600" : "text-blue-600"}`}
                    >
                      {room.isAvailable ? "Còn trống" : "Đã thuê"}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày tạo:</span>
                    <span className="font-medium">
                      {room.createdAt
                        ? formatDate(new Date(room.createdAt))
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Cập nhật lần cuối:
                    </span>
                    <span className="font-medium">
                      {room.updatedAt
                        ? formatDate(new Date(room.updatedAt))
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tiện ích phòng */}
            <Card>
              <CardHeader>
                <CardTitle>Tiện ích phòng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {room.roomAmenities && room.roomAmenities.length > 0 ? (
                    room.roomAmenities.map((amenityItem) => (
                      <Badge
                        key={amenityItem.id}
                        variant="outline"
                        className="px-3 py-1"
                      >
                        {amenityItem.amenity.name}
                      </Badge>
                    ))
                  ) : room.amenities && room.amenities.length > 0 ? (
                    room.amenities.map((amenity) => (
                      <Badge
                        key={amenity.id}
                        variant="outline"
                        className="px-3 py-1"
                      >
                        {amenity.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Không có tiện ích</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab hợp đồng */}
          <TabsContent value="contract" className="space-y-6">
            {isLoadingContracts ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Đang tải thông tin hợp đồng...</span>
              </div>
            ) : !activeContract ? (
              <Card>
                <CardHeader>
                  <CardTitle>Hợp đồng hiện tại</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-10">
                  <p>Phòng này chưa có hợp đồng hoạt động</p>
                  <Button className="mt-4">Tạo hợp đồng mới</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Hợp đồng hiện tại</CardTitle>
                  <CardDescription>
                    Số hợp đồng: {activeContract.contractNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Thông tin cơ bản */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Trạng thái:
                        </span>
                        <Badge
                          className={
                            activeContract.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : activeContract.status ===
                                  "AWAITING_LANDLORD_SIGNATURE"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                          }
                        >
                          {activeContract.status === "ACTIVE"
                            ? "Hoạt động"
                            : activeContract.status ===
                                "AWAITING_LANDLORD_SIGNATURE"
                              ? "Chờ chủ nhà ký"
                              : activeContract.status ===
                                  "AWAITING_TENANT_SIGNATURE"
                                ? "Chờ người thuê ký"
                                : activeContract.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Ngày bắt đầu:
                        </span>
                        <span className="font-medium">
                          {formatDate(new Date(activeContract.startDate))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Ngày kết thúc:
                        </span>
                        <span className="font-medium">
                          {formatDate(new Date(activeContract.endDate))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Tiền thuê:
                        </span>
                        <span className="font-medium text-green-600">
                          {formatPrice(activeContract.monthlyRent)}/tháng
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Tiền đặt cọc:
                        </span>
                        <span className="font-medium text-green-600">
                          {formatPrice(activeContract.deposit)}
                        </span>
                      </div>
                    </div>

                    {/* Thông tin người thuê */}
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Người thuê
                      </h3>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tên:</span>
                        <span className="font-medium">
                          {activeContract.tenant.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">
                          {activeContract.tenant.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Số điện thoại:
                        </span>
                        <span className="font-medium">
                          {activeContract.tenant.phoneNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Trạng thái chữ ký */}
                  <div>
                    <h3 className="font-semibold mb-4">Trạng thái chữ ký</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            activeContract.landlordSignedAt
                              ? "bg-green-100"
                              : ""
                          }
                        >
                          {activeContract.landlordSignedAt
                            ? "Đã ký"
                            : "Chưa ký"}
                        </Badge>
                        <span>Chủ nhà</span>
                        {activeContract.landlordSignedAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(
                              new Date(activeContract.landlordSignedAt)
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            activeContract.tenantSignedAt ? "bg-green-100" : ""
                          }
                        >
                          {activeContract.tenantSignedAt ? "Đã ký" : "Chưa ký"}
                        </Badge>
                        <span>Người thuê</span>
                        {activeContract.tenantSignedAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(
                              new Date(activeContract.tenantSignedAt)
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Các nút hành động */}
                  <div className="flex flex-wrap gap-2 pt-4">
                    {!activeContract.landlordSignedAt && (
                      <Button>Ký hợp đồng</Button>
                    )}
                    <Button variant="outline">Xem chi tiết hợp đồng</Button>
                    <Button variant="outline">Tải hợp đồng PDF</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danh sách hợp đồng */}
            <Card>
              <CardHeader>
                <CardTitle>Tất cả hợp đồng</CardTitle>
              </CardHeader>
              <CardContent>
                {!contracts || contracts.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">
                    Chưa có hợp đồng nào cho phòng này
                  </p>
                ) : (
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="py-2 px-4 text-left font-medium">
                            Số HĐ
                          </th>
                          <th className="py-2 px-4 text-left font-medium">
                            Người thuê
                          </th>
                          <th className="py-2 px-4 text-left font-medium">
                            Ngày bắt đầu
                          </th>
                          <th className="py-2 px-4 text-left font-medium">
                            Ngày kết thúc
                          </th>
                          <th className="py-2 px-4 text-left font-medium">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {contracts.map((contract) => (
                          <tr key={contract.id} className="border-b">
                            <td className="py-2 px-4">
                              {contract.contractNumber}
                            </td>
                            <td className="py-2 px-4">
                              {contract.tenant.name}
                            </td>
                            <td className="py-2 px-4">
                              {formatDate(new Date(contract.startDate))}
                            </td>
                            <td className="py-2 px-4">
                              {formatDate(new Date(contract.endDate))}
                            </td>
                            <td className="py-2 px-4">
                              <Badge
                                className={
                                  contract.status === "ACTIVE"
                                    ? "bg-green-100 text-green-800"
                                    : contract.status === "EXPIRED"
                                      ? "bg-gray-100 text-gray-800"
                                      : contract.status === "TERMINATED"
                                        ? "bg-red-100 text-red-800"
                                        : contract.status === "RENEWED"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-amber-100 text-amber-800"
                                }
                              >
                                {contract.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab lịch sử thuê */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử thuê phòng</CardTitle>
                <CardDescription>
                  Danh sách những người đã từng thuê phòng này
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!rentalHistory || rentalHistory.length === 0 ? (
                  <div className="text-center py-10">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-4 text-muted-foreground">
                      Chưa có lịch sử thuê phòng nào
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {rentalHistory.map((historyItem, index) => (
                      <div
                        key={index}
                        className="flex flex-col md:flex-row gap-4 border-b pb-6 last:border-0"
                      >
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap gap-x-6 gap-y-2 items-center mb-2">
                            <h3 className="font-semibold">
                              {historyItem.tenantName}
                            </h3>
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span className="text-sm">
                                {formatDate(historyItem.startDate)} -{" "}
                                {formatDate(historyItem.endDate)}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>Hợp đồng #{historyItem.contractId}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-2">
                            <Button variant="outline" size="sm">
                              <FileText className="h-3 w-3 mr-1" />
                              Xem hợp đồng
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thống kê thuê phòng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg text-center">
                    <p className="text-muted-foreground mb-1">
                      Tổng số lần cho thuê
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {rentalHistory?.length || 0}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg text-center">
                    <p className="text-muted-foreground mb-1">
                      Tổng thời gian cho thuê
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {rentalHistory && rentalHistory.length > 0
                        ? Math.round(
                            rentalHistory.reduce((total, item) => {
                              return (
                                total +
                                (new Date(item.endDate).getTime() -
                                  new Date(item.startDate).getTime()) /
                                  (1000 * 60 * 60 * 24 * 30)
                              );
                            }, 0)
                          )
                        : 0}{" "}
                      tháng
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg text-center">
                    <p className="text-muted-foreground mb-1">
                      Hiệu suất cho thuê
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {rentalHistory &&
                      rentalHistory.length > 0 &&
                      room.createdAt
                        ? Math.round(
                            (rentalHistory.reduce((total, item) => {
                              return (
                                total +
                                (new Date(item.endDate).getTime() -
                                  new Date(item.startDate).getTime())
                              );
                            }, 0) /
                              (new Date().getTime() -
                                new Date(room.createdAt).getTime())) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {room && (
          <>
            <EditRoomModal
              open={isEditModalOpen}
              onOpenChange={setIsEditModalOpen}
              roomId={roomId}
            />

            <CreateRoomBillModal
              open={isCreateBillModalOpen}
              onOpenChange={setIsCreateBillModalOpen}
              roomId={roomId}
            />
          </>
        )}
      </div>
    </SidebarInset>
  );
}
