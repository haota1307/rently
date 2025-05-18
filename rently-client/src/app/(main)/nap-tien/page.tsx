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
  TimerIcon,
  XCircleIcon,
  TimerOffIcon,
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

// Thêm hàm format thời gian
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

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

  // Thêm state để xử lý đếm ngược
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 phút * 60 giây
  const [isCanceled, setIsCanceled] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi động đồng hồ đếm ngược khi QR code được tạo
  useEffect(() => {
    if (status === "qr-generated" && !isCanceled && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Hết thời gian, hủy giao dịch
            clearInterval(timerRef.current!);
            setIsCanceled(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, isCanceled, timeLeft]);

  // Reset thời gian khi tạo giao dịch mới
  useEffect(() => {
    if (status === "qr-generated") {
      setTimeLeft(15 * 60);
      setIsCanceled(false);
    }
  }, [status, paymentId]);

  // Xử lý hủy giao dịch thủ công
  const handleCancelPayment = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsCanceled(true);
  };

  // Lắng nghe sự kiện cập nhật thanh toán từ server qua WebSocket
  useEffect(() => {
    if (!socket || !paymentId) return;

    const handlePaymentStatusUpdate = (data: PaymentStatusUpdate) => {
      // Kiểm tra xem cập nhật này có phải cho paymentId hiện tại không
      if (data.id === paymentId) {
        if (data.status === "COMPLETED") {
          toast.success("Thanh toán thành công!");

          setTimeout(() => {
            checkPayment(paymentId);
          }, 2000);
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
    if (!qrCodeUrl) return;

    try {
      // Tạo link tải và kích hoạt
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = "rently-qr-payment.png";
      link.target = "_blank";
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
    <div className="w-full mx-4 py-8 sm:py-10 px-4 md:px-6">
      {error && (
        <Alert
          variant="destructive"
          className="mb-6 animate-in fade-in slide-in-from-top-4"
        >
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Thông tin nạp tiền */}
        <div className="md:col-span-1">
          <div className="sticky top-20 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BanknoteIcon className="h-5 w-5 text-primary" />
                  Thông tin nạp tiền
                </CardTitle>
                <CardDescription>
                  Nạp tiền vào tài khoản Rently để sử dụng các dịch vụ
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-blue-50 text-blue-600">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 5.98396 8.87499 7.49995 8.87499C9.01593 8.87499 10.0845 9.25463 10.829 9.9883C11.572 10.7206 12.0249 11.8799 12.0249 13.5999C12.0249 13.8623 12.2375 14.0749 12.4999 14.0749C12.7622 14.0749 12.9749 13.8623 12.9749 13.5999C12.9749 11.72 12.4777 10.2794 11.4958 9.31167C10.7243 8.55134 9.70019 8.12901 8.50616 7.98351C10.0187 7.54738 11.1249 6.15288 11.1249 4.5C11.1249 2.49797 9.50193 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.1749 3.02264 10.1749 4.5C10.1749 5.97736 8.97736 7.17499 7.5 7.17499C6.02264 7.17499 4.825 5.97736 4.825 4.5Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                    <span>
                      Nạp tiền vào tài khoản dễ dàng qua chuyển khoản ngân hàng
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-green-50 text-green-600">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4.89346 2.35248C3.49195 2.35248 2.35248 3.49359 2.35248 4.90532C2.35248 6.38164 3.20954 7.9168 4.37255 9.33522C5.39396 10.581 6.59464 11.6702 7.50002 12.4778C8.4054 11.6702 9.60608 10.581 10.6275 9.33522C11.7905 7.9168 12.6476 6.38164 12.6476 4.90532C12.6476 3.49359 11.5081 2.35248 10.1066 2.35248C9.27516 2.35248 8.81298 2.64323 8.5283 2.95843C8.2555 3.25904 8.10734 3.58177 8.01883 3.83263C7.95259 4.01516 7.79214 4.14453 7.60366 4.14453H7.39638C7.2079 4.14453 7.04745 4.01516 6.98121 3.83263C6.8927 3.58177 6.74454 3.25904 6.47174 2.95843C6.18706 2.64323 5.72488 2.35248 4.89346 2.35248ZM1.35248 4.90532C1.35248 2.94498 2.936 1.35248 4.89346 1.35248C6.0084 1.35248 6.73504 1.76049 7.16551 2.2154C7.24033 2.29484 7.30834 2.37407 7.3698 2.45141C7.43163 2.37407 7.49964 2.29484 7.57446 2.2154C8.00492 1.76049 8.73156 1.35248 9.8465 1.35248C11.804 1.35248 13.3875 2.94498 13.3875 4.90532C13.3875 6.74041 12.376 8.50508 11.1911 9.96927C10.0061 11.4335 8.71545 12.6055 7.74688 13.4751C7.60493 13.6018 7.39501 13.6018 7.25306 13.4751C6.28449 12.6055 4.99383 11.4335 3.80886 9.96927C2.62389 8.50508 1.61232 6.74041 1.35248 4.90532Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                    <span>Nhận ưu đãi đặc biệt cho khách hàng thân thiết</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-amber-50 text-amber-600">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.4449 0.608765C8.0183 -0.107015 6.9817 -0.107015 6.55509 0.608766L0.161178 11.3368C-0.275824 12.07 0.252503 13 1.10608 13H13.8939C14.7475 13 15.2758 12.07 14.8388 11.3368L8.4449 0.608765ZM7.4141 1.12073C7.45288 1.05566 7.54712 1.05566 7.5859 1.12073L13.9797 11.8488C14.0196 11.9159 13.9715 12 13.8939 12H1.10608C1.02849 12 0.980454 11.9159 1.02029 11.8488L7.4141 1.12073ZM6.8269 4.48611C6.81221 4.10423 7.11783 3.78663 7.5 3.78663C7.88217 3.78663 8.18778 4.10423 8.1731 4.48612L8.01921 8.48701C8.00848 8.766 7.7792 8.98664 7.5 8.98664C7.2208 8.98664 6.99151 8.766 6.98078 8.48701L6.8269 4.48611ZM8.24989 10.476C8.24989 10.8902 7.9141 11.226 7.49989 11.226C7.08567 11.226 6.74989 10.8902 6.74989 10.476C6.74989 10.0618 7.08567 9.72599 7.49989 9.72599C7.9141 9.72599 8.24989 10.0618 8.24989 10.476Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                    <span>Vui lòng giữ nguyên nội dung khi chuyển khoản</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-indigo-50 text-indigo-600">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM8.24992 4.99995C8.24992 5.38653 7.94148 5.69995 7.55991 5.69995C7.17834 5.69995 6.8699 5.38653 6.8699 4.99995C6.8699 4.61337 7.17834 4.29995 7.55991 4.29995C7.94148 4.29995 8.24992 4.61337 8.24992 4.99995ZM6.05991 7.49995C6.05991 7.22381 6.28376 6.99995 6.55991 6.99995H7.05991V9.49995H6.55991C6.28376 9.49995 6.05991 9.27609 6.05991 8.99995V7.49995ZM8.55991 9.99995C8.55991 10.276 8.33605 10.4999 8.05991 10.4999H6.55991C6.28376 10.4999 6.05991 10.276 6.05991 9.99995C6.05991 9.7238 6.28376 9.49995 6.55991 9.49995H7.05991V7.49995H6.55991C6.28376 7.49995 6.05991 7.27609 6.05991 6.99995C6.05991 6.7238 6.28376 6.49995 6.55991 6.49995H8.05991C8.33605 6.49995 8.55991 6.7238 8.55991 6.99995V9.99995Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                    <span>Cần hỗ trợ? Liên hệ với chúng tôi qua live chat</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          {/* Success State */}
          {status === "completed" ? (
            <Card className="border-2 border-green-500/20 shadow-md overflow-hidden">
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
          ) : isCanceled ? (
            // Cancel State - Giao diện giao dịch bị hủy
            <Card className="border-2 border-red-500/20 shadow-md overflow-hidden">
              <div className="bg-red-50 py-3 px-6 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-700">
                    Giao dịch đã hết hạn
                  </CardTitle>
                </div>
              </div>
              <CardContent className="pt-8 pb-6 flex flex-col items-center justify-center">
                <div className="rounded-full bg-red-100 p-4 mb-6 animate-in zoom-in">
                  <TimerOffIcon className="h-12 w-12 text-red-600" />
                </div>
                <p className="text-center mb-2">
                  Giao dịch số tiền{" "}
                  <span className="font-bold text-xl text-primary">
                    {amount?.toLocaleString("vi-VN")} VNĐ
                  </span>{" "}
                  đã hết hạn
                </p>
                <p className="text-center text-muted-foreground mb-6">
                  Thời gian thanh toán đã vượt quá 15 phút. Vui lòng tạo giao
                  dịch mới.
                </p>
                <Button
                  onClick={resetPayment}
                  className="mt-2 bg-primary hover:bg-primary/90"
                >
                  Tạo giao dịch mới
                </Button>
              </CardContent>
            </Card>
          ) : status === "qr-generated" ? (
            // QR Code State
            <Card className="shadow-md overflow-hidden">
              <CardHeader className="border-b bg-muted/50 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCodeIcon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      Quét mã QR để thanh toán
                    </CardTitle>
                  </div>
                  <div className="flex gap-2 items-center">
                    {/* Timer Badge */}
                    <Badge
                      variant="outline"
                      className="px-3 py-1 flex items-center gap-1"
                    >
                      <TimerIcon className="h-3.5 w-3.5" />
                      <span className="font-mono">{formatTime(timeLeft)}</span>
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      <span className="font-medium">
                        {amount?.toLocaleString("vi-VN")} VNĐ
                      </span>
                    </Badge>
                  </div>
                </div>
                <CardDescription className="mt-1">
                  Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử (Thời gian
                  quét: 15 phút)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x">
                  {/* QR Code Section */}
                  <div className="flex flex-col items-center justify-center p-6 bg-white">
                    <div className="relative w-full flex justify-center">
                      {/* Progress ring around QR */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border-4 border-transparent">
                        <div
                          className="absolute inset-0 rounded-full border-4 border-primary/20"
                          style={{
                            background: `conic-gradient(#0000 ${(timeLeft / (15 * 60)) * 100}%, rgba(200, 200, 200, 0.1) 0)`,
                          }}
                        />
                      </div>

                      {qrCodeUrl ? (
                        <div className="border rounded-xl p-4 bg-white shadow-sm transition-all hover:shadow-md flex flex-col items-center z-10">
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
                    </div>
                    <div className="mt-5">
                      <div className="text-center text-sm text-muted-foreground mb-2">
                        Vui lòng không tắt trang này cho đến khi thanh toán hoàn
                        tất
                      </div>
                    </div>
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
                            <div className="font-medium">
                              {bankInfo?.bankName}
                            </div>
                          </div>
                        </div>

                        {/* Account Name */}
                        <div className="flex items-center gap-2 rounded-lg border bg-white p-3">
                          <div className="text-muted-foreground mb-1">
                            Tên tài khoản:
                          </div>
                          <div className="font-medium">
                            {bankInfo?.accountName}
                          </div>
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
                      <AlertTitle className="text-sm">
                        Lưu ý quan trọng
                      </AlertTitle>
                      <AlertDescription className="text-xs">
                        Hãy giữ nguyên nội dung chuyển khoản để hệ thống có thể
                        xác nhận giao dịch của bạn. Giao dịch sẽ tự động hủy sau
                        15 phút nếu không được thanh toán.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Initial State - Payment Form
            <Card className="shadow-md overflow-hidden">
              <CardHeader className="border-b bg-muted/50 py-4">
                <div className="flex items-center gap-2">
                  <CoinsIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    Nạp tiền vào tài khoản
                  </CardTitle>
                </div>
                <CardDescription className="mt-1">
                  Chọn hoặc nhập số tiền bạn muốn nạp vào tài khoản Rently
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
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
                    Giao dịch được xử lý an toàn qua hệ thống ngân hàng và ví
                    điện tử
                  </p>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
