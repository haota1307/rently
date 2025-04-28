"use client";

import { useState, useEffect } from "react";
import { usePayment } from "@/features/payment/usePayment";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  CoinsIcon,
  QrCodeIcon,
  CopyIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  BanknoteIcon,
  AlertCircleIcon,
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

export default function NapTienPage() {
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Nạp Tiền</h1>
          <p className="text-muted-foreground mt-1">
            Nạp tiền vào tài khoản để sử dụng các dịch vụ của Rently
          </p>
        </div>
      </div>

      <Separator className="my-6" />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {status === "completed" ? (
        <Card className="w-full">
          <CardContent className="pt-6 flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-xl text-center mb-2">
              Nạp tiền thành công!
            </CardTitle>
            <p className="text-center text-muted-foreground mb-6">
              Số tiền {amount?.toLocaleString("vi-VN")} VNĐ đã được cộng vào tài
              khoản của bạn.
            </p>
            <Button onClick={resetPayment} className="mt-4">
              Nạp tiền tiếp
            </Button>
          </CardContent>
        </Card>
      ) : status === "qr-generated" ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCodeIcon className="h-5 w-5" />
              Quét mã QR để thanh toán
            </CardTitle>
            <CardDescription>
              Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử để hoàn tất
              thanh toán
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                {qrCodeUrl ? (
                  <div className="border rounded-lg p-4 bg-white">
                    <Image
                      src={qrCodeUrl}
                      alt="QR Code"
                      width={250}
                      height={250}
                      className="mx-auto"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[250px] w-[250px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                )}
                <Badge variant="outline" className="mt-4 px-4 py-1">
                  <span className="font-bold">Số tiền: </span>
                  {amount?.toLocaleString("vi-VN")} VNĐ
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BanknoteIcon className="h-4 w-4 text-primary" />
                    <span className="font-medium">Thông tin chuyển khoản</span>
                  </div>
                  <Separator className="my-2" />

                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Ngân hàng:</span>
                      <span className="font-medium">{bankInfo?.bankName}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-muted-foreground">
                        Số tài khoản:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {bankInfo?.accountNumber}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            handleCopy(bankInfo?.accountNumber || "")
                          }
                        >
                          {copied ? (
                            <CheckCircleIcon className="h-3 w-3 text-green-600" />
                          ) : (
                            <CopyIcon className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-muted-foreground">
                        Tên tài khoản:
                      </span>
                      <span className="font-medium">
                        {bankInfo?.accountName}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-muted-foreground">
                        Nội dung chuyển khoản:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{paymentCode}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(paymentCode || "")}
                        >
                          {copied ? (
                            <CheckCircleIcon className="h-3 w-3 text-green-600" />
                          ) : (
                            <CopyIcon className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Lưu ý</AlertTitle>
                  <AlertDescription>
                    Hãy giữ nguyên nội dung chuyển khoản để hệ thống có thể xác
                    nhận giao dịch của bạn.
                    <br />
                    <span className="text-green-600 font-medium">
                      Hệ thống sẽ tự động cập nhật khi thanh toán hoàn tất.
                    </span>
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleCheckStatus}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Đang kiểm tra...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <RefreshCwIcon className="h-4 w-4" />
                      <span>Kiểm tra thủ công</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CoinsIcon className="h-5 w-5" />
              Nạp tiền vào tài khoản
            </CardTitle>
            <CardDescription>
              Nhập số tiền bạn muốn nạp vào tài khoản Rently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Số tiền cần nạp</Label>
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
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none bg-muted border-l rounded-r-md">
                    <span>VNĐ</span>
                  </div>
                </div>
                {form.formState.errors.amount && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang xử lý...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <QrCodeIcon className="h-4 w-4" />
                    <span>Tạo mã QR thanh toán</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
