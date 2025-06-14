"use client";

import { useState } from "react";
import {
  useRoleUpgradeRequests,
  useUpdateRoleUpgradeRequest,
} from "../role-upgrade-request.hook";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { RoleUpgradeRequestStatus } from "@/constants/type";
import { cn } from "@/lib/utils";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";

interface RoleUpgradeRequest {
  id: number;
  status: RoleUpgradeRequestStatus;
  reason: string | null;
  frontImage: string;
  backImage: string;
  selfieImage: string | null;
  faceVerificationData: {
    similarity: number;
    isVerified: boolean;
    timestamp: string;
    apiResponseCode?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  processedById: number | null;
  user: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    phoneNumber: string | null;
    status: string;
    balance: number;
  };
  processedBy: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface RoleUpgradeRequestListProps {
  searchQuery?: string;
  status?: RoleUpgradeRequestStatus;
}

const statusMap: Record<
  RoleUpgradeRequestStatus,
  { label: string; color: string }
> = {
  PENDING: {
    label: "Đang chờ",
    color: "bg-yellow-100 text-yellow-800",
  },
  APPROVED: {
    label: "Đã duyệt",
    color: "bg-green-100 text-green-800",
  },
  REJECTED: {
    label: "Từ chối",
    color: "bg-red-100 text-red-800",
  },
};

export function RoleUpgradeRequestList({
  searchQuery = "",
  status = "PENDING",
}: RoleUpgradeRequestListProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<RoleUpgradeRequest | null>(null);
  const [reason, setReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRequest, setDetailRequest] = useState<RoleUpgradeRequest | null>(
    null
  );

  const { data, isLoading, refetch } = useRoleUpgradeRequests({
    page: currentPage,
    limit: 10,
    status: status as RoleUpgradeRequestStatus,
    search: searchQuery || undefined,
  });

  const { mutate: updateRequest, isPending: isUpdating } =
    useUpdateRoleUpgradeRequest();

  const handleApprove = (request: RoleUpgradeRequest) => {
    if (request.status !== "PENDING") {
      toast.error("Yêu cầu đã được xử lý");
      return;
    }

    updateRequest(
      {
        id: request.id,
        data: {
          status: "APPROVED",
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã duyệt yêu cầu thành công");
          setSelectedRequest(null);
          setReason("");
          refetch();
        },
        onError: (error: any) => {
          toast.error(error.message || "Có lỗi xảy ra");
        },
      }
    );
  };

  const handleReject = (request: RoleUpgradeRequest) => {
    if (request.status !== "PENDING") {
      toast.error("Yêu cầu đã được xử lý");
      return;
    }

    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    updateRequest(
      {
        id: request.id,
        data: {
          status: "REJECTED",
          note: reason.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã từ chối yêu cầu");
          setSelectedRequest(null);
          setReason("");
          refetch();
        },
        onError: (error: any) => {
          toast.error(error.message || "Có lỗi xảy ra");
        },
      }
    );
  };

  const handleShowDetail = (request: RoleUpgradeRequest) => {
    setDetailRequest(request);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Người yêu cầu</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Xác thực khuôn mặt</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>CCCD</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.payload.data.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{request.user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {request.user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(request.createdAt), "HH:mm dd/MM/yyyy", {
                    locale: vi,
                  })}
                </TableCell>
                <TableCell>
                  <Badge className={cn(statusMap[request.status].color)}>
                    {statusMap[request.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {request.faceVerificationData ? (
                    <div className="space-y-1">
                      <Badge
                        variant={
                          request.faceVerificationData.isVerified
                            ? "default"
                            : "destructive"
                        }
                        className={
                          request.faceVerificationData.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {request.faceVerificationData.isVerified
                          ? "✓ Đã xác thực"
                          : "✗ Thất bại"}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {request.faceVerificationData.similarity.toFixed(1)}%
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      Chưa xác thực
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{request.reason || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowDetail(request)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Xem chi tiết
                  </Button>
                </TableCell>
                <TableCell>
                  {request.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request)}
                        disabled={isUpdating}
                      >
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setSelectedRequest(request)}
                        disabled={isUpdating}
                      >
                        Từ chối
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối yêu cầu nâng cấp lên chủ trọ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lý do từ chối</Label>
              <Textarea
                placeholder="Nhập lý do từ chối..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setReason("");
              }}
              disabled={isUpdating}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && handleReject(selectedRequest)}
              disabled={isUpdating}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDetailModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowDetailModal(false);
            setDetailRequest(null);
            refetch();
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu nâng cấp</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Thông tin người dùng */}
            <div className="lg:col-span-1 space-y-4">
              <div className="text-lg font-semibold">Thông tin người dùng</div>
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg border">
                <Avatar className="w-24 h-24">
                  <AvatarImage
                    src={detailRequest?.user.avatar || "/avatars/default.png"}
                    alt={detailRequest?.user.name}
                  />
                  <AvatarFallback>
                    {detailRequest?.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <div className="font-medium">{detailRequest?.user.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {detailRequest?.user.email}
                  </div>
                </div>
                <div className="w-full space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Số điện thoại:
                    </span>
                    <span>
                      {detailRequest?.user.phoneNumber || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <Badge variant="outline">
                      {detailRequest?.user.status === "ACTIVE"
                        ? "Đang hoạt động"
                        : "Không hoạt động"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số dư:</span>
                    <span>{detailRequest?.user.balance.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày yêu cầu:</span>
                    <span>
                      {detailRequest?.createdAt
                        ? format(
                            new Date(detailRequest.createdAt),
                            "dd/MM/yyyy HH:mm",
                            {
                              locale: vi,
                            }
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ảnh CCCD và Xác thực khuôn mặt */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="text-lg font-semibold">Ảnh CCCD</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mặt trước</Label>
                    <div className="relative aspect-[3/2] rounded-lg border overflow-hidden">
                      <img
                        src={detailRequest?.frontImage}
                        alt="Mặt trước CCCD"
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mặt sau</Label>
                    <div className="relative aspect-[3/2] rounded-lg border overflow-hidden">
                      <img
                        src={detailRequest?.backImage}
                        alt="Mặt sau CCCD"
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Xác thực khuôn mặt */}
              <div className="space-y-4">
                <div className="text-lg font-semibold">Xác thực khuôn mặt</div>
                {detailRequest?.selfieImage &&
                detailRequest?.faceVerificationData ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ảnh selfie</Label>
                      <div className="relative aspect-[3/4] rounded-lg border overflow-hidden">
                        <img
                          src={detailRequest.selfieImage}
                          alt="Ảnh selfie"
                          className="object-contain w-full h-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label>Kết quả xác thực</Label>
                      <div className="space-y-3 p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Trạng thái:
                          </span>
                          <Badge
                            variant={
                              detailRequest.faceVerificationData.isVerified
                                ? "default"
                                : "destructive"
                            }
                            className={
                              detailRequest.faceVerificationData.isVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {detailRequest.faceVerificationData.isVerified
                              ? "✓ Đã xác thực"
                              : "✗ Thất bại"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Độ giống nhau:
                          </span>
                          <span className="text-sm font-mono">
                            {detailRequest.faceVerificationData.similarity.toFixed(
                              2
                            )}
                            %
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Thời gian:
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(
                              new Date(
                                detailRequest.faceVerificationData.timestamp
                              ),
                              "HH:mm dd/MM/yyyy",
                              { locale: vi }
                            )}
                          </span>
                        </div>
                        {detailRequest.faceVerificationData.similarity >= 80 ? (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                            ✓ Vượt ngưỡng chấp nhận (≥80%)
                          </div>
                        ) : (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            ✗ Dưới ngưỡng chấp nhận (&lt;80%)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground">
                    <div className="text-sm">
                      Chưa thực hiện xác thực khuôn mặt
                    </div>
                    <div className="text-xs mt-1">
                      Yêu cầu được tạo trước khi có tính năng xác thực
                    </div>
                  </div>
                )}
              </div>

              {detailRequest?.reason && (
                <div className="space-y-2">
                  <Label>Lý do yêu cầu</Label>
                  <div className="p-3 rounded-lg bg-muted">
                    {detailRequest.reason}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailModal(false);
                setDetailRequest(null);
              }}
            >
              Đóng
            </Button>
            {detailRequest?.status === "PENDING" && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => {
                    handleApprove(detailRequest);
                    setShowDetailModal(false);
                  }}
                  disabled={isUpdating}
                >
                  Duyệt
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setSelectedRequest(detailRequest);
                    setShowDetailModal(false);
                  }}
                  disabled={isUpdating}
                >
                  Từ chối
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
