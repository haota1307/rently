import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useGetRoomBillDetail,
  useMarkRoomBillAsPaid,
  useSendRoomBillEmail,
  useGetTenantInfo,
  TenantInfoResponseNew,
} from "@/features/rooms/useRoomBill";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail, Check } from "lucide-react";
import { RoomBillType } from "@/schemas/room-bill.schema";

// Định nghĩa kiểu cho phí khác
interface OtherFee {
  name: string;
  amount: number;
}

interface RoomBillDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: number;
  hideActions?: boolean; // Ẩn các nút action (dành cho tenant)
}

export const RoomBillDetailModal: React.FC<RoomBillDetailModalProps> = ({
  open,
  onOpenChange,
  billId,
  hideActions = false,
}) => {
  const [email, setEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  const { data: bill, isLoading, error } = useGetRoomBillDetail(billId);
  const { data: tenantInfo } = useGetTenantInfo(bill?.roomId);

  const { mutateAsync: markAsPaid, isPending: isMarkingPaid } =
    useMarkRoomBillAsPaid();
  const { mutateAsync: sendEmail, isPending: isSendingEmail } =
    useSendRoomBillEmail();

  useEffect(() => {
    if (tenantInfo?.tenant?.email) {
      setEmail(tenantInfo.tenant.email);
    }
  }, [tenantInfo]);

  const handleMarkAsPaid = async () => {
    try {
      await markAsPaid(billId);
      toast.success("Đã đánh dấu hóa đơn là đã thanh toán");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái hóa đơn");
      console.error(error);
    }
  };

  const handleSendEmail = async () => {
    try {
      await sendEmail({ billId, email });
      toast.success("Đã gửi hóa đơn qua email thành công");
      setShowEmailInput(false);
      setEmail("");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gửi email");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !bill) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lỗi</DialogTitle>
            <DialogDescription>
              Không thể tải thông tin hóa đơn. Vui lòng thử lại sau.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const electricityUsage = bill.electricityNew - bill.electricityOld;
  const electricityAmount = electricityUsage * bill.electricityPrice;

  const waterUsage = bill.waterNew - bill.waterOld;
  const waterAmount = waterUsage * bill.waterPrice;

  let roomRent = 0;
  let otherFees: OtherFee[] = [];

  if (bill.otherFees && Array.isArray(bill.otherFees)) {
    if (bill.otherFees.length > 0 && bill.otherFees[0].name === "Tiền phòng") {
      roomRent = bill.otherFees[0].amount;
      otherFees = bill.otherFees.slice(1).map((fee) => ({
        name: fee.name,
        amount: fee.amount,
      }));
    } else {
      otherFees = bill.otherFees.map((fee) => ({
        name: fee.name,
        amount: fee.amount,
      }));
    }
  }

  const otherFeesTotal = otherFees.reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Chi tiết hóa đơn</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết hóa đơn phòng{" "}
            {bill.room?.title || `#${bill.roomId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">
                Kỳ hóa đơn: {format(new Date(bill.billingMonth), "MM/yyyy")}
              </h3>
              <p className="text-sm text-muted-foreground">
                Ngày tạo:{" "}
                {format(new Date(bill.createdAt), "dd/MM/yyyy", { locale: vi })}
              </p>
            </div>
            <Badge variant={bill.isPaid ? "success" : "destructive"}>
              {bill.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
            </Badge>
          </div>

          <Separator />

          {roomRent > 0 && (
            <>
              <div>
                <h4 className="font-medium">Tiền phòng</h4>
                <p className="text-base font-medium mt-1">
                  {roomRent.toLocaleString("vi-VN")} đ
                </p>
              </div>
              <Separator />
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Tiền điện</h4>
              <div className="space-y-1 mt-2">
                <p className="text-sm">
                  Chỉ số cũ:{" "}
                  <span className="font-medium">{bill.electricityOld} kWh</span>
                </p>
                <p className="text-sm">
                  Chỉ số mới:{" "}
                  <span className="font-medium">{bill.electricityNew} kWh</span>
                </p>
                <p className="text-sm">
                  Tiêu thụ:{" "}
                  <span className="font-medium">{electricityUsage} kWh</span>
                </p>
                <p className="text-sm">
                  Đơn giá:{" "}
                  <span className="font-medium">
                    {bill.electricityPrice.toLocaleString("vi-VN")} đ/kWh
                  </span>
                </p>
                <p className="text-sm font-medium">
                  Thành tiền: {electricityAmount.toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium">Tiền nước</h4>
              <div className="space-y-1 mt-2">
                <p className="text-sm">
                  Chỉ số cũ:{" "}
                  <span className="font-medium">{bill.waterOld} m³</span>
                </p>
                <p className="text-sm">
                  Chỉ số mới:{" "}
                  <span className="font-medium">{bill.waterNew} m³</span>
                </p>
                <p className="text-sm">
                  Tiêu thụ: <span className="font-medium">{waterUsage} m³</span>
                </p>
                <p className="text-sm">
                  Đơn giá:{" "}
                  <span className="font-medium">
                    {bill.waterPrice.toLocaleString("vi-VN")} đ/m³
                  </span>
                </p>
                <p className="text-sm font-medium">
                  Thành tiền: {waterAmount.toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>
          </div>

          {otherFees.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium">Các khoản phí khác</h4>
                <div className="space-y-2 mt-2">
                  {otherFees.map((fee, index) => (
                    <div key={index} className="flex justify-between">
                      <p className="text-sm">{fee.name}</p>
                      <p className="text-sm font-medium">
                        {fee.amount.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {bill.note && (
            <div>
              <h4 className="font-medium">Ghi chú</h4>
              <p className="text-sm mt-1">{bill.note}</p>
            </div>
          )}

          <div className="flex justify-between items-center bg-muted p-3 rounded-md">
            <div>
              <p className="text-sm">Hạn thanh toán</p>
              <p className="font-medium">
                {format(new Date(bill.dueDate), "dd/MM/yyyy", { locale: vi })}
              </p>
            </div>
            <div>
              <p className="text-sm">Tổng cộng</p>
              <p className="text-xl font-bold">
                {bill.totalAmount.toLocaleString("vi-VN")} đ
              </p>
            </div>
          </div>

          {!hideActions && showEmailInput ? (
            <div className="flex gap-2">
              <Input
                placeholder="Nhập email người nhận"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail || !email}
              >
                {isSendingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Gửi
              </Button>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            {!hideActions && !bill.isPaid && (
              <Button
                variant="outline"
                onClick={handleMarkAsPaid}
                disabled={isMarkingPaid}
              >
                {isMarkingPaid ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Đánh dấu đã thanh toán
              </Button>
            )}
            {!hideActions && (
              <Button
                variant="secondary"
                onClick={() => setShowEmailInput(!showEmailInput)}
              >
                <Mail className="h-4 w-4 mr-2" />
                {!showEmailInput ? "Gửi qua email" : "Hủy gửi email"}
              </Button>
            )}
            <Button variant="default" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
