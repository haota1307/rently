"use client";

import { useState, useEffect, useRef } from "react";
import { usePayment } from "@/features/payment/usePayment";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CoinsIcon,
  QrCodeIcon,
  CopyIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  BanknoteIcon,
  AlertCircleIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useAppStore } from "@/components/app-provider";
import { toast } from "sonner";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";

interface PaymentFormValues {
  amount: number;
}

interface PaymentStatusUpdate {
  id: number;
  status: string;
  amount: number;
  description?: string;
}

export default function PaymentPage() {
  const {
    loading,
    paymentId,
    paymentCode,
    qrCodeUrl,
    amount,
    bankInfo,
    error,
    status,
    createPayment,
    checkPayment,
    resetPayment,
  } = usePayment();

  const accessToken = getAccessTokenFromLocalStorage();
  const userId = accessToken ? decodeAccessToken(accessToken).userId : 1;

  const socket = useAppStore((state) => state.socket);
  const [copied, setCopied] = useState(false);
  const [copyField, setCopyField] = useState("");
  const qrImageRef = useRef<HTMLImageElement>(null);
  const form = useForm<PaymentFormValues>({
    defaultValues: {
      amount: 100000,
    },
  });

  // Lắng nghe sự kiện cập nhật thanh toán từ server qua WebSocket
  useEffect(() => {
    if (!socket || !paymentId) return;

    const handlePaymentStatusUpdate = (data: PaymentStatusUpdate) => {
      console.log("Nhận cập nhật trạng thái thanh toán:", data);

      // Kiểm tra xem cập nhật này có phải cho paymentId hiện tại không
      if (data.id === paymentId) {
        // Khi nhận được cập nhật thanh toán thành công
        if (data.status === "COMPLETED") {
          toast.success("Thanh toán thành công!");
          // Gọi kiểm tra trạng thái để cập nhật UI
          checkPayment(paymentId);
        }
      }
    };

    // Đăng ký lắng nghe sự kiện từ WebSocket
    socket.on("paymentStatusUpdated", handlePaymentStatusUpdate);

    // Cleanup khi component unmount hoặc paymentId thay đổi
    return () => {
      socket.off("paymentStatusUpdated", handlePaymentStatusUpdate);
    };
  }, [socket, paymentId, checkPayment]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setCopyField(field);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = (values: PaymentFormValues) => {
    createPayment(userId, Number(values.amount));
  };

  const handleCheckStatus = () => {
    if (paymentId) {
      checkPayment(paymentId);
    }
  };

  // Các mệnh giá nhanh
  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  // Hàm tải ảnh QR
  const downloadQRCode = () => {
    if (!qrImageRef.current) return;

    // Tạo canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;

    const image = qrImageRef.current;

    // Đặt kích thước canvas bằng với kích thước thực tế của hình ảnh
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // Vẽ hình ảnh vào canvas
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    try {
      // Tạo URL từ canvas
      const dataUrl = canvas.toDataURL("image/png");

      // Tạo link tải và kích hoạt
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "rently-qr-payment.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Đã tải QR code thành công");
    } catch (error) {
      toast.error("Không thể tải QR code");
      console.error("Lỗi khi tải QR code:", error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {error && (
        <Alert
          variant="destructive"
          className="mb-4 animate-in fade-in slide-in-from-top-4"
        >
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success State */}
      {status === "completed" ? (
        <Card className="w-full max-w-md mx-auto border-2 border-green-500/20 shadow-lg overflow-hidden">
          <div className="bg-green-50 py-3 px-6 border-b border-green-100">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-700">
                Thanh toán thành công
              </CardTitle>
            </div>
          </div>
          <CardContent className="pt-8 pb-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-green-100 p-4 mb-6 animate-in zoom-in">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>
            <p className="text-center mb-2">
              Số tiền{" "}
              <span className="font-bold text-xl text-primary">
                {amount?.toLocaleString("vi-VN")} VNĐ
              </span>
            </p>
            <p className="text-center text-muted-foreground mb-6">
              đã được cộng vào tài khoản của bạn
            </p>
            <Button
              onClick={resetPayment}
              className="mt-2 bg-green-600 hover:bg-green-700"
            >
              Nạp tiền tiếp
            </Button>
          </CardContent>
        </Card>
      ) : status === "qr-generated" ? (
        // QR Code State
        <Card className="w-full max-w-4xl mx-auto shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-muted/50 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCodeIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  Quét mã QR để thanh toán
                </CardTitle>
              </div>
              <Badge variant="outline" className="px-3 py-1">
                <span className="font-medium">
                  {amount?.toLocaleString("vi-VN")} VNĐ
                </span>
              </Badge>
            </div>
            <CardDescription className="mt-1">
              Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x">
              {/* QR Code Section */}
              <div className="flex flex-col items-center justify-center p-6 bg-white">
                {qrCodeUrl ? (
                  <div className="border rounded-xl p-4 bg-white shadow-sm transition-all hover:shadow-md flex flex-col items-center">
                    <Image
                      src={qrCodeUrl}
                      alt="QR Code"
                      width={240}
                      height={240}
                      className="mx-auto"
                      ref={qrImageRef}
                      unoptimized
                    />

                    {/* Logo VietinBank phía dưới QR */}
                    <div className="mt-3 flex items-center justify-center">
                      <Image
                        src="/logo-vietinbank.png"
                        alt="VietinBank"
                        width={100}
                        height={25}
                        className="object-contain"
                      />
                    </div>

                    {/* Nút tải ảnh QR */}
                    <button
                      onClick={downloadQRCode}
                      className="mt-4 flex items-center gap-1 text-blue-600 border border-blue-200 rounded-md px-3 py-1 text-sm hover:bg-blue-50 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-download"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Tải ảnh QR
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[240px] w-[240px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                )}
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Vui lòng không tắt trang này cho đến khi thanh toán hoàn tất
                </p>
              </div>

              {/* Bank Info Section */}
              <div className="p-6 space-y-5 bg-muted/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BanknoteIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Thông tin chuyển khoản</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hoặc bạn có thể chuyển khoản thủ công với thông tin sau
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    {/* Bank Name */}
                    <div className="flex items-center gap-2 rounded-lg border bg-white p-3">
                      <div className="text-muted-foreground mb-1">
                        Ngân hàng:
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{bankInfo?.bankName}</div>
                      </div>
                    </div>

                    {/* Account Name */}
                    <div className="flex items-center gap-2 rounded-lg border bg-white p-3">
                      <div className="text-muted-foreground mb-1">
                        Tên tài khoản:
                      </div>
                      <div className="font-medium">{bankInfo?.accountName}</div>
                    </div>

                    {/* Account Number */}
                    <div className="flex items-center gap-2 rounded-lg border bg-white p-3">
                      <div className="text-muted-foreground mb-1">
                        Số tài khoản:
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {bankInfo?.accountNumber}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 hover:bg-primary/10"
                          onClick={() =>
                            handleCopy(
                              bankInfo?.accountNumber || "",
                              "accountNumber"
                            )
                          }
                        >
                          {copied && copyField === "accountNumber" ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircleIcon className="h-3 w-3" />
                              <span className="text-xs">Đã sao chép</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <CopyIcon className="h-3 w-3" />
                              <span className="text-xs">Sao chép</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Transfer Content */}
                    <div className="rounded-lg border bg-white p-3">
                      <div className="text-muted-foreground mb-1">
                        Nội dung chuyển khoản:
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-medium font-mono">
                          {paymentCode}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 hover:bg-primary/10"
                          onClick={() =>
                            handleCopy(paymentCode || "", "paymentCode")
                          }
                        >
                          {copied && copyField === "paymentCode" ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircleIcon className="h-3 w-3" />
                              <span className="text-xs">Đã sao chép</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <CopyIcon className="h-3 w-3" />
                              <span className="text-xs">Sao chép</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="border-primary/20 bg-primary/5">
                  <AlertCircleIcon className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-sm">Lưu ý quan trọng</AlertTitle>
                  <AlertDescription className="text-xs">
                    Hãy giữ nguyên nội dung chuyển khoản để hệ thống có thể xác
                    nhận giao dịch của bạn. Hệ thống sẽ tự động cập nhật khi
                    thanh toán hoàn tất.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Initial State - Payment Form
        <Card className="w-full max-w-lg mx-auto shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-muted/50 py-4">
            <div className="flex items-center gap-2">
              <CoinsIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Nạp tiền vào tài khoản</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Chọn hoặc nhập số tiền bạn muốn nạp vào tài khoản Rently
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Quick Amount Selection */}
              <div className="space-y-3">
                <Label className="text-sm">Chọn mệnh giá nhanh</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      type="button"
                      variant="outline"
                      onClick={() => form.setValue("amount", quickAmount)}
                      className={`py-1 ${
                        form.watch("amount") === quickAmount
                          ? "border-primary bg-primary/10"
                          : ""
                      }`}
                    >
                      {quickAmount.toLocaleString("vi-VN")}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm">
                  Hoặc nhập số tiền khác
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    min="10000"
                    step="10000"
                    disabled={loading}
                    {...form.register("amount", {
                      required: "Vui lòng nhập số tiền",
                      min: {
                        value: 10000,
                        message: "Số tiền tối thiểu là 10,000 VNĐ",
                      },
                    })}
                    className="pr-16 h-12 text-lg"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-muted border-l rounded-r-md">
                    <span className="font-medium">VNĐ</span>
                  </div>
                </div>
                {form.formState.errors.amount && (
                  <p className="text-xs text-destructive mt-1">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Đang xử lý...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Tiếp tục thanh toán</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="px-6 py-4 bg-muted/20 border-t">
            <div className="flex items-center gap-2 w-full text-sm text-muted-foreground">
              <AlertCircleIcon className="h-4 w-4 text-primary" />
              <p>
                Giao dịch được xử lý an toàn qua hệ thống ngân hàng và ví điện
                tử
              </p>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
