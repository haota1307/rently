"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  AlertCircle,
  Ban,
  CalendarClock,
  Home,
  User,
  Clock,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { RentalRequestStatus } from "@/schemas/rental-request.schema";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useUpdateRentalRequest } from "@/features/rental-request/useRentalRequest";

interface RentalRequestDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rentalRequest: any;
}

export function RentalRequestDetailDialog({
  isOpen,
  onClose,
  rentalRequest,
}: RentalRequestDetailDialogProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusAction, setStatusAction] = useState<"APPROVE" | "REJECT" | null>(
    null
  );

  const updateRequestMutation = useUpdateRentalRequest();

  // Hàm xử lý khi click vào nút chấp nhận
  const handleApprove = async () => {
    setStatusAction("APPROVE");
    setIsSubmitting(true);
    try {
      await updateRequestMutation.mutateAsync({
        requestId: rentalRequest.id,
        data: {
          status: RentalRequestStatus.APPROVED,
          note,
        },
      });
      toast.success("Đã chấp nhận yêu cầu thuê thành công");
      onClose();
    } catch (error: any) {
      toast.error(
        error?.payload?.message || "Đã xảy ra lỗi khi chấp nhận yêu cầu thuê"
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setStatusAction(null);
    }
  };

  // Hàm xử lý khi click vào nút từ chối
  const handleReject = async () => {
    setStatusAction("REJECT");
    if (!note || note.trim() === "") {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRequestMutation.mutateAsync({
        requestId: rentalRequest.id,
        data: {
          status: RentalRequestStatus.REJECTED,
          note,
          rejectionReason: note,
        },
      });
      toast.success("Đã từ chối yêu cầu thuê thành công");
      onClose();
    } catch (error: any) {
      toast.error(
        error?.payload?.message || "Đã xảy ra lỗi khi từ chối yêu cầu thuê"
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setStatusAction(null);
    }
  };

  // Hàm lấy trạng thái hiển thị và màu sắc
  const getStatusBadge = (status: string) => {
    switch (status) {
      case RentalRequestStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Đang chờ xử lý
          </Badge>
        );
      case RentalRequestStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Check className="h-3.5 w-3.5 mr-1" />
            Đã chấp nhận
          </Badge>
        );
      case RentalRequestStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <X className="h-3.5 w-3.5 mr-1" />
            Đã từ chối
          </Badge>
        );
      case RentalRequestStatus.CANCELED:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            <Ban className="h-3.5 w-3.5 mr-1" />
            Đã hủy
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Lấy thông tin từ rentalRequest
  const {
    id,
    status,
    expectedMoveDate,
    duration,
    description,
    tenant,
    post,
    createdAt,
    note: existingNote,
  } = rentalRequest || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Chi tiết yêu cầu thuê #{id}</span>
            {status && getStatusBadge(status)}
          </DialogTitle>
          <DialogDescription>
            Yêu cầu được tạo vào{" "}
            {createdAt &&
              format(new Date(createdAt), "HH:mm 'ngày' dd/MM/yyyy", {
                locale: vi,
              })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Thông tin về tin đăng */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Thông tin tin đăng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="font-medium">{post?.title}</div>
                <div className="text-muted-foreground">{post?.address}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Giá thuê:</span>
                <span className="font-medium">
                  {post?.price?.toLocaleString()} đ/tháng
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Diện tích:</span>
                <span>{post?.area} m²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Đặt cọc:</span>
                <span>{post?.deposit?.toLocaleString()} đ</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(`/bai-dang/${post?.id}`, "_blank")}
              >
                Xem tin đăng
              </Button>
            </CardFooter>
          </Card>

          {/* Thông tin về người thuê */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <User className="h-4 w-4 mr-2" />
                Thông tin người thuê
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="font-medium">{tenant?.name}</div>
                <div className="text-muted-foreground">{tenant?.email}</div>
              </div>
              {tenant?.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Số điện thoại:</span>
                  <span>{tenant?.phone}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (tenant?.phone) {
                    window.location.href = `tel:${tenant.phone}`;
                  }
                }}
                disabled={!tenant?.phone}
              >
                Gọi điện
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Chi tiết yêu cầu thuê */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chi tiết yêu cầu thuê</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground mr-2">
                  Ngày chuyển vào:
                </span>
                <span className="font-medium">
                  {expectedMoveDate &&
                    format(new Date(expectedMoveDate), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground mr-2">
                  Thời hạn thuê:
                </span>
                <span className="font-medium">{duration} tháng</span>
              </div>
            </div>

            {description && (
              <div>
                <div className="text-muted-foreground text-sm mb-1 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Mô tả yêu cầu:
                </div>
                <div className="text-sm p-3 border rounded-md bg-muted/30">
                  {description}
                </div>
              </div>
            )}

            {existingNote && (
              <div>
                <div className="text-muted-foreground text-sm mb-1 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Ghi chú của bạn:
                </div>
                <div className="text-sm p-3 border rounded-md bg-muted/30">
                  {existingNote}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {status === RentalRequestStatus.PENDING && (
          <>
            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="note" className="text-sm font-medium">
                  {status === RentalRequestStatus.PENDING &&
                  statusAction === "REJECT"
                    ? "Lý do từ chối"
                    : "Ghi chú"}
                </label>
                <Textarea
                  id="note"
                  placeholder={
                    status === RentalRequestStatus.PENDING &&
                    statusAction === "REJECT"
                      ? "Nhập lý do từ chối (bắt buộc)..."
                      : "Nhập ghi chú của bạn..."
                  }
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required={
                    status === RentalRequestStatus.PENDING &&
                    statusAction === "REJECT"
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {status === RentalRequestStatus.PENDING &&
                    statusAction === "REJECT" &&
                    "Bắt buộc phải nhập lý do khi từ chối yêu cầu."}
                  {status === RentalRequestStatus.PENDING &&
                    !statusAction &&
                    "Nếu từ chối, vui lòng nhập lý do từ chối."}
                </p>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Đóng
                </Button>
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Từ chối
                  </Button>
                  <Button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Chấp nhận
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </>
        )}

        {status !== RentalRequestStatus.PENDING && (
          <DialogFooter>
            <Button type="button" onClick={onClose}>
              Đóng
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
