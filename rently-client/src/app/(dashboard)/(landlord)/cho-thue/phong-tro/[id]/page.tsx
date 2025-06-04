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
  Download,
  Eye,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import contractApiRequest from "@/features/rental-contract/contract.api";
import { EditRoomModal } from "@/features/rooms/components/edit-room-modal";
import { CreateRoomBillModal } from "@/features/rooms/components/create-room-bill-modal";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Định nghĩa các types với validation tốt hơn
interface Contract {
  id: number;
  contractNumber: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date;
  monthlyRent: number;
  deposit: number;
  roomId: number;
  tenant: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  landlordSignedAt: string | Date | null;
  tenantSignedAt: string | Date | null;
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

  // Validation cho roomId
  const roomIdRaw = params.id as string;
  const roomId = parseInt(roomIdRaw, 10);

  // Validate roomId
  useEffect(() => {
    if (!roomIdRaw || isNaN(roomId) || roomId <= 0) {
      toast.error("ID phòng không hợp lệ");
      router.push("/cho-thue/phong-tro");
      return;
    }
  }, [roomIdRaw, roomId, router]);

  const [activeTab, setActiveTab] = useState("info");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  // Sử dụng hook hiện có để lấy thông tin phòng
  const {
    data: room,
    isLoading: isLoadingRoom,
    error: roomError,
    refetch: refetchRoom,
  } = useGetRoomDetail(roomId);

  // Tạo query để lấy hợp đồng với caching tốt hơn
  const {
    data: contracts = [],
    isLoading: isLoadingContracts,
    error: contractsError,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: ["roomContracts", roomId],
    queryFn: async () => {
      try {
        const res = await contractApiRequest.list({ limit: 100 });
        return res.payload.data.filter(
          (contract: Contract) => contract.roomId === roomId
        );
      } catch (error) {
        console.error("Lỗi khi lấy hợp đồng phòng:", error);
        throw error;
      }
    },
    enabled: !!roomId && !isNaN(roomId),
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    refetchOnWindowFocus: false,
  });

  const activeContract = contracts?.find(
    (contract: Contract) =>
      contract.status === "ACTIVE" ||
      contract.status === "AWAITING_LANDLORD_SIGNATURE" ||
      contract.status === "AWAITING_TENANT_SIGNATURE"
  );

  // Tạo lịch sử thuê phòng từ hợp đồng
  const rentalHistory = contracts
    ?.filter(
      (contract: Contract) =>
        contract.status === "ACTIVE" ||
        contract.status === "EXPIRED" ||
        contract.status === "TERMINATED" ||
        contract.status === "RENEWED"
    )
    .map((contract: Contract) => ({
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

  // Handlers với error handling
  const handleGoBack = useCallback(() => {
    router.push("/cho-thue/phong-tro");
  }, [router]);

  const handleEdit = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleCreateBill = useCallback(() => {
    if (!room || room.isAvailable) {
      toast.error("Không thể tạo hóa đơn cho phòng trống");
      return;
    }
    setIsCreateBillModalOpen(true);
  }, [room]);

  const handleCreateContract = useCallback(async () => {
    if (!room) return;

    setIsCreatingContract(true);
    try {
      // Điều hướng đến trang quản lý hợp đồng để tạo hợp đồng mới
      // Lưu ý: Việc tạo hợp đồng cần có yêu cầu thuê (rental request) đã được chấp nhận
      router.push(`/cho-thue/hop-dong`);
      toast.success("Đang chuyển đến trang quản lý hợp đồng...");
    } catch (error) {
      console.error("Lỗi khi chuyển trang:", error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsCreatingContract(false);
    }
  }, [room, router]);

  const handleSignContract = useCallback(
    async (contractId: number) => {
      try {
        // TODO: Implement proper signature flow with modal
        // For now, we'll create a temporary signature
        const signatureData = {
          signature:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // Placeholder
        };

        await contractApiRequest.sign(contractId, signatureData);
        toast.success("Đã ký hợp đồng thành công!");
        refetchContracts();
      } catch (error) {
        console.error("Lỗi khi ký hợp đồng:", error);
        toast.error("Có lỗi xảy ra khi ký hợp đồng");
      }
    },
    [refetchContracts]
  );

  const handleViewContract = useCallback(
    (contractId: number) => {
      router.push(`/cho-thue/hop-dong/${contractId}`);
    },
    [router]
  );

  const handleDownloadContract = useCallback(async (contractId: number) => {
    try {
      toast.loading("Đang tải hợp đồng...");

      const blob = await contractApiRequest.exportPDF(contractId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hop-dong-${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("Tải hợp đồng thành công!");
    } catch (error) {
      console.error("Lỗi khi tải hợp đồng:", error);
      toast.dismiss();
      toast.error("Có lỗi xảy ra khi tải hợp đồng");
    }
  }, []);

  // Loading state
  if (isLoadingRoom) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Chi tiết phòng trọ</h1>
        </header>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <span className="text-sm text-muted-foreground">
              Đang tải thông tin phòng...
            </span>
          </div>
        </div>
      </SidebarInset>
    );
  }

  // Error state
  if (roomError || !room) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Chi tiết phòng trọ</h1>
        </header>
        <div className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Không thể tải thông tin phòng
          </h3>
          <p className="text-red-500 mb-4">
            {roomError?.message ||
              "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau."}
          </p>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => refetchRoom()}>
              Thử lại
            </Button>
            <Button onClick={handleGoBack}>Quay lại danh sách phòng</Button>
          </div>
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
        <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-start">
          <div className="space-y-2">
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
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-blue-100 text-blue-800 border-blue-200"
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

        {/* Hiển thị lỗi hợp đồng nếu có */}
        {contractsError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Không thể tải thông tin hợp đồng. Vui lòng thử lại sau.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchContracts()}
                  className="ml-auto"
                >
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs
          defaultValue="info"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
            <TabsTrigger value="info">Thông tin phòng</TabsTrigger>
            <TabsTrigger value="contract" className="relative">
              Hợp đồng
              {isLoadingContracts && (
                <Loader2 className="h-3 w-3 animate-spin ml-1" />
              )}
            </TabsTrigger>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {room.roomImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-md overflow-hidden group cursor-pointer"
                        onClick={() => {
                          // TODO: Implement image viewer modal
                          window.open(image.imageUrl, "_blank");
                        }}
                      >
                        <Image
                          src={image.imageUrl || "/placeholder.svg"}
                          alt={`Ảnh ${index + 1} của ${room.title}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center bg-gray-100 rounded-md">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Không có hình ảnh</p>
                    </div>
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
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Đang tải thông tin hợp đồng...
                  </span>
                </div>
              </div>
            ) : !activeContract ? (
              <Card>
                <CardHeader>
                  <CardTitle>Hợp đồng hiện tại</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-10">
                  <div className="space-y-4">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                    <div>
                      <p className="text-lg font-medium mb-2">
                        Phòng này chưa có hợp đồng hoạt động
                      </p>
                      <p className="text-muted-foreground mb-2">
                        Để tạo hợp đồng mới, bạn cần có yêu cầu thuê đã được
                        chấp nhận.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click bên dưới để đi đến trang quản lý hợp đồng và tạo
                        hợp đồng từ yêu cầu thuê.
                      </p>
                    </div>
                    <Button
                      onClick={handleCreateContract}
                      disabled={isCreatingContract}
                      className="mt-4"
                    >
                      {isCreatingContract ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang chuyển trang...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Đến trang quản lý hợp đồng
                        </>
                      )}
                    </Button>
                  </div>
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
                              ? "bg-green-100 text-green-800 border-green-200"
                              : activeContract.status ===
                                  "AWAITING_LANDLORD_SIGNATURE"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-blue-100 text-blue-800 border-blue-200"
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
                              ? "bg-green-100 border-green-200"
                              : "bg-gray-100 border-gray-200"
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
                            activeContract.tenantSignedAt
                              ? "bg-green-100 border-green-200"
                              : "bg-gray-100 border-gray-200"
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button>
                            <FileText className="h-4 w-4 mr-2" />
                            Ký hợp đồng
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Xác nhận ký hợp đồng
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn ký hợp đồng số{" "}
                              {activeContract.contractNumber}? Hành động này
                              không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleSignContract(activeContract.id)
                              }
                            >
                              Xác nhận ký
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleViewContract(activeContract.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Xem chi tiết hợp đồng
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadContract(activeContract.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Tải hợp đồng PDF
                    </Button>
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
                  <div className="text-center py-6">
                    <FileText className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Chưa có hợp đồng nào cho phòng này
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-3 px-4 text-left font-medium">
                              Số HĐ
                            </th>
                            <th className="py-3 px-4 text-left font-medium">
                              Người thuê
                            </th>
                            <th className="py-3 px-4 text-left font-medium hidden sm:table-cell">
                              Ngày bắt đầu
                            </th>
                            <th className="py-3 px-4 text-left font-medium hidden sm:table-cell">
                              Ngày kết thúc
                            </th>
                            <th className="py-3 px-4 text-left font-medium">
                              Trạng thái
                            </th>
                            <th className="py-3 px-4 text-center font-medium">
                              Hành động
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {contracts.map((contract: Contract) => (
                            <tr
                              key={contract.id}
                              className="border-b hover:bg-muted/20"
                            >
                              <td className="py-3 px-4 font-mono text-sm">
                                {contract.contractNumber}
                              </td>
                              <td className="py-3 px-4">
                                {contract.tenant.name}
                              </td>
                              <td className="py-3 px-4 hidden sm:table-cell">
                                {formatDate(new Date(contract.startDate))}
                              </td>
                              <td className="py-3 px-4 hidden sm:table-cell">
                                {formatDate(new Date(contract.endDate))}
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  className={
                                    contract.status === "ACTIVE"
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : contract.status === "EXPIRED"
                                        ? "bg-gray-100 text-gray-800 border-gray-200"
                                        : contract.status === "TERMINATED"
                                          ? "bg-red-100 text-red-800 border-red-200"
                                          : contract.status === "RENEWED"
                                            ? "bg-blue-100 text-blue-800 border-blue-200"
                                            : "bg-amber-100 text-amber-800 border-amber-200"
                                  }
                                >
                                  {contract.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleViewContract(contract.id)
                                  }
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Chưa có lịch sử thuê phòng
                    </h3>
                    <p className="text-muted-foreground">
                      Lịch sử thuê sẽ xuất hiện khi có người thuê phòng này
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {rentalHistory.map((historyItem, index) => (
                      <div
                        key={index}
                        className="flex flex-col md:flex-row gap-4 border-b pb-6 last:border-0"
                      >
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-x-6 gap-y-2 items-center mb-2">
                            <h3 className="font-semibold text-lg">
                              {historyItem.tenantName}
                            </h3>
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span className="text-sm">
                                {formatDate(historyItem.startDate)} -{" "}
                                {formatDate(historyItem.endDate)}
                              </span>
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground mb-3">
                            <span>Hợp đồng #{historyItem.contractId}</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleViewContract(historyItem.contractId)
                              }
                            >
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

            {/* Thống kê thuê phòng */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê thuê phòng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg text-center border border-blue-200">
                    <p className="text-blue-600 mb-2 font-medium">
                      Tổng số lần cho thuê
                    </p>
                    <p className="text-3xl font-bold text-blue-700">
                      {rentalHistory?.length || 0}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg text-center border border-green-200">
                    <p className="text-green-600 mb-2 font-medium">
                      Tổng thời gian cho thuê
                    </p>
                    <p className="text-3xl font-bold text-green-700">
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
                      <span className="text-lg">tháng</span>
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg text-center border border-purple-200">
                    <p className="text-purple-600 mb-2 font-medium">
                      Hiệu suất cho thuê
                    </p>
                    <p className="text-3xl font-bold text-purple-700">
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
                      <span className="text-lg">%</span>
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
