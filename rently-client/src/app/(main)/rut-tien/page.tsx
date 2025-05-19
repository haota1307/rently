"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CoinsIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  BanknoteIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  BuildingIcon,
  UserIcon,
  CreditCardIcon,
  Search,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";
import { useAppStore } from "@/components/app-provider";
import { toast } from "sonner";
import paymentApiRequest from "@/features/payment/payment.api";
import { BANKS } from "@/features/payment/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WithdrawFormValues {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export default function WithdrawPage() {
  const {
    loading,
    amount,
    error,
    status,
    withdrawalInfo,
    createWithdraw,
    resetPayment,
    checkWithdrawStatus,
  } = usePayment();

  // State cho tìm kiếm ngân hàng
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const filteredBanks = BANKS.filter(
    (bank) =>
      bank.fullName.toLowerCase().includes(bankSearchTerm.toLowerCase()) ||
      bank.name.toLowerCase().includes(bankSearchTerm.toLowerCase()) ||
      bank.id.toLowerCase().includes(bankSearchTerm.toLowerCase())
  ).sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));

  const accessToken = getAccessTokenFromLocalStorage();
  const userId = accessToken ? decodeAccessToken(accessToken).userId : 1;

  // Lấy socket từ app provider
  const socket = useAppStore((state) => state.socket);

  // Lưu withdrawalInfo.id vào ref để không gây re-render
  const withdrawalIdRef = useRef<number | undefined>(withdrawalInfo?.id);

  // Cập nhật ref khi withdrawalInfo thay đổi
  useEffect(() => {
    withdrawalIdRef.current = withdrawalInfo?.id;
  }, [withdrawalInfo]);

  // Xử lý cập nhật trạng thái thanh toán sử dụng useCallback với dependency ít nhất có thể
  const handlePaymentUpdate = useCallback(
    (data: any) => {
      const currentWithdrawalId = withdrawalIdRef.current;

      // Nếu không có withdrawalInfo, thử lấy thông tin mới nhất
      if (!currentWithdrawalId) {
        if (checkWithdrawStatus) {
          paymentApiRequest
            .getTransactions({ userId, type: "withdraw" })
            .then((response) => {
              if (
                response.status === 200 &&
                response.payload?.transactions?.length > 0
              ) {
                const transaction = response.payload.transactions[0];
                if (parseInt(transaction.id) === data.id) {
                  checkWithdrawStatus(data.id);
                }
              }
            })
            .catch(() => {});
        }
        return;
      }

      // Nếu có withdrawalInfo và ID khớp
      if (currentWithdrawalId === data.id) {
        if (data.status === "COMPLETED") {
          toast.success("Yêu cầu rút tiền đã được duyệt và chuyển khoản!");
        } else if (data.status === "CANCELED" || data.status === "REJECTED") {
          toast.error("Yêu cầu rút tiền đã bị từ chối!");
        }

        setTimeout(() => {
          if (checkWithdrawStatus) {
            checkWithdrawStatus(currentWithdrawalId);
          }
        }, 3000);
      }
    },
    [checkWithdrawStatus, userId]
  );

  // Đăng ký lắng nghe status update một cách tĩnh, tránh tạo listener mới liên tục
  const paymentIdForListener = useRef<number | undefined>(withdrawalInfo?.id);

  useEffect(() => {
    paymentIdForListener.current = withdrawalInfo?.id;
  }, [withdrawalInfo?.id]);

  // Sử dụng custom hook với ID ở dạng ref
  useEffect(() => {
    const currentId = withdrawalInfo?.id;
    if (currentId) {
      const { addPaymentStatusListener, removePaymentStatusListener } =
        useAppStore.getState();
      addPaymentStatusListener(currentId, handlePaymentUpdate);

      return () => {
        removePaymentStatusListener(currentId, handlePaymentUpdate);
      };
    }
  }, [withdrawalInfo?.id, handlePaymentUpdate]);

  // Đảm bảo tham gia vào phòng user khi component mount
  useEffect(() => {
    if (socket && socket.connected && userId) {
      // Tham gia room riêng cho user
      socket.emit("join-user-room", { userId });

      // Ping server để giữ kết nối socket
      const pingInterval = setInterval(() => {
        if (socket && socket.connected) {
          socket.emit("ping", { timestamp: new Date().toISOString() });
        }
      }, 30000);

      return () => {
        clearInterval(pingInterval);
      };
    }
  }, [socket, userId]);

  const form = useForm<WithdrawFormValues>({
    defaultValues: {
      amount: 100000,
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
    },
  });

  // Thêm useEffect để validate select khi có thay đổi
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Validate khi select thay đổi giá trị
      if (name === "bankName" && value.bankName) {
        form.clearErrors("bankName");
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Các mệnh giá nhanh
  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  const onSubmit = (values: WithdrawFormValues) => {
    // Kiểm tra thêm nếu chưa chọn ngân hàng
    if (!values.bankName) {
      form.setError("bankName", {
        type: "required",
        message: "Vui lòng chọn ngân hàng",
      });
      return;
    }

    createWithdraw(
      userId,
      Number(values.amount),
      values.bankName,
      values.bankAccountNumber,
      values.bankAccountName
    );
  };

  // Hiển thị trạng thái rút tiền
  const getStatusDisplay = () => {
    if (!withdrawalInfo) return null;

    if (withdrawalInfo.status === "COMPLETED") {
      return (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              Rút tiền thành công
            </p>
          </div>
          <p className="text-sm text-green-700">
            Yêu cầu rút tiền của bạn đã được xử lý. Vui lòng kiểm tra tài khoản
            ngân hàng của bạn.
          </p>
        </div>
      );
    } else if (
      withdrawalInfo.status === "CANCELED" ||
      withdrawalInfo.status === "REJECTED"
    ) {
      return (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircleIcon className="h-4 w-4 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              Yêu cầu đã bị từ chối
            </p>
          </div>
          <p className="text-sm text-red-700">
            Yêu cầu rút tiền của bạn đã bị từ chối. Vui lòng liên hệ với chúng
            tôi để biết thêm chi tiết.
          </p>
        </div>
      );
    } else {
      return (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircleIcon className="h-4 w-4 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">Thông báo</p>
          </div>
          <p className="text-sm text-yellow-700">
            Yêu cầu rút tiền của bạn đang chờ xác nhận. Vui lòng kiểm tra thông
            báo hoặc email để biết thêm thông tin.
          </p>
        </div>
      );
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
        {/* Thông tin rút tiền */}
        <div className="md:col-span-1">
          <div className="sticky top-20 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BanknoteIcon className="h-5 w-5 text-primary" />
                  Thông tin rút tiền
                </CardTitle>
                <CardDescription>
                  Rút tiền từ tài khoản Rently về tài khoản ngân hàng của bạn
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
                      Rút tiền từ tài khoản về tài khoản ngân hàng của bạn
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
                    <span>Số tiền tối thiểu 50,000 VNĐ mỗi lần rút</span>
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
                    <span>Vui lòng kiểm tra thông tin trước khi rút tiền</span>
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
          {status === "withdraw-requested" ||
          status === "withdraw-completed" ? (
            <Card className="border-2 border-yellow-500/20 shadow-md overflow-hidden">
              <div
                className={`py-3 px-6 border-b ${
                  withdrawalInfo?.status === "COMPLETED"
                    ? "bg-green-50 border-green-100"
                    : withdrawalInfo?.status === "CANCELED" ||
                        withdrawalInfo?.status === "REJECTED"
                      ? "bg-red-50 border-red-100"
                      : "bg-yellow-50 border-yellow-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircleIcon
                    className={`h-5 w-5 ${
                      withdrawalInfo?.status === "COMPLETED"
                        ? "text-green-600"
                        : withdrawalInfo?.status === "CANCELED" ||
                            withdrawalInfo?.status === "REJECTED"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }`}
                  />
                  <CardTitle
                    className={
                      withdrawalInfo?.status === "COMPLETED"
                        ? "text-green-700"
                        : withdrawalInfo?.status === "CANCELED" ||
                            withdrawalInfo?.status === "REJECTED"
                          ? "text-red-700"
                          : "text-yellow-700"
                    }
                  >
                    {withdrawalInfo?.status === "COMPLETED"
                      ? "Rút tiền thành công"
                      : withdrawalInfo?.status === "CANCELED" ||
                          withdrawalInfo?.status === "REJECTED"
                        ? "Yêu cầu đã bị từ chối"
                        : "Yêu cầu rút tiền đang chờ xử lý"}
                  </CardTitle>
                </div>
              </div>
              <CardContent className="pt-8 pb-6 flex flex-col items-center justify-center">
                <div
                  className={`rounded-full p-4 mb-6 animate-in zoom-in ${
                    withdrawalInfo?.status === "COMPLETED"
                      ? "bg-green-100"
                      : withdrawalInfo?.status === "CANCELED" ||
                          withdrawalInfo?.status === "REJECTED"
                        ? "bg-red-100"
                        : "bg-yellow-100"
                  }`}
                >
                  <ArrowDownIcon
                    className={`h-12 w-12 ${
                      withdrawalInfo?.status === "COMPLETED"
                        ? "text-green-600"
                        : withdrawalInfo?.status === "CANCELED" ||
                            withdrawalInfo?.status === "REJECTED"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }`}
                  />
                </div>
                <p className="text-center mb-2">
                  Số tiền{" "}
                  <span className="font-bold text-xl text-primary">
                    {withdrawalInfo?.amount?.toLocaleString("vi-VN")} VNĐ
                  </span>
                </p>
                <div className="w-full mt-4 space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm mb-2 font-medium">
                      Thông tin ngân hàng:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Ngân hàng:
                        </span>
                        <span className="text-sm font-medium">
                          {(withdrawalInfo?.bankName &&
                            BANKS.find(
                              (bank) => bank.name === withdrawalInfo.bankName
                            )?.fullName) ||
                            withdrawalInfo?.bankName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Số tài khoản:
                        </span>
                        <span className="text-sm font-medium">
                          {withdrawalInfo?.bankAccountNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Tên chủ tài khoản:
                        </span>
                        <span className="text-sm font-medium">
                          {withdrawalInfo?.bankAccountName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {getStatusDisplay()}
                </div>
                <Button
                  onClick={resetPayment}
                  className={`mt-6 ${
                    withdrawalInfo?.status === "COMPLETED"
                      ? "bg-green-600 hover:bg-green-700"
                      : withdrawalInfo?.status === "CANCELED" ||
                          withdrawalInfo?.status === "REJECTED"
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  Tạo yêu cầu rút tiền mới
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Initial State - Withdraw Form
            <Card className="shadow-md overflow-hidden">
              <CardHeader className="border-b bg-muted/50 py-4">
                <div className="flex items-center gap-2">
                  <ArrowDownIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    Rút tiền từ tài khoản
                  </CardTitle>
                </div>
                <CardDescription className="mt-1">
                  Nhập thông tin để rút tiền từ tài khoản Rently về tài khoản
                  ngân hàng của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Quick Amount Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm">Chọn số tiền muốn rút</Label>
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

                  {/* Bank Info */}
                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <BuildingIcon className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Thông tin ngân hàng</h3>
                    </div>

                    {/* Bank Name */}
                    <div className="space-y-2">
                      <Label htmlFor="bankName" className="text-sm">
                        Tên ngân hàng
                      </Label>
                      <Select
                        disabled={loading}
                        onValueChange={(value) =>
                          form.setValue("bankName", value)
                        }
                        defaultValue={form.watch("bankName")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn ngân hàng" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          sideOffset={5}
                          className="w-full z-[1000] max-h-[300px] overflow-hidden"
                          align="center"
                          avoidCollisions={true}
                        >
                          <div className="flex items-center border-b px-3 py-2 sticky top-0 bg-popover z-10">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              className="flex w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Tìm kiếm ngân hàng..."
                              value={bankSearchTerm}
                              onChange={(e) =>
                                setBankSearchTerm(e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="overflow-y-auto max-h-[240px] py-1 px-0">
                            {filteredBanks.length > 0 ? (
                              filteredBanks.map((bank) => (
                                <SelectItem
                                  key={bank.id}
                                  value={bank.name}
                                  textValue={bank.fullName}
                                  className="px-3 py-2"
                                >
                                  <div className="flex items-center">
                                    <span>{bank.fullName}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      ({bank.name})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Không tìm thấy ngân hàng phù hợp
                              </div>
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.bankName && (
                        <p className="text-xs text-destructive mt-1">
                          {form.formState.errors.bankName.message}
                        </p>
                      )}
                    </div>

                    {/* Account Number */}
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber" className="text-sm">
                        Số tài khoản
                      </Label>
                      <div className="relative">
                        <CreditCardIcon className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                        <Input
                          id="bankAccountNumber"
                          className="pl-10"
                          disabled={loading}
                          {...form.register("bankAccountNumber", {
                            required: "Vui lòng nhập số tài khoản",
                            pattern: {
                              value: /^[0-9]{5,20}$/,
                              message: "Số tài khoản không hợp lệ",
                            },
                          })}
                        />
                      </div>
                      {form.formState.errors.bankAccountNumber && (
                        <p className="text-xs text-destructive mt-1">
                          {form.formState.errors.bankAccountNumber.message}
                        </p>
                      )}
                    </div>

                    {/* Account Name */}
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountName" className="text-sm">
                        Tên chủ tài khoản
                      </Label>
                      <div className="relative">
                        <UserIcon className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                        <Input
                          id="bankAccountName"
                          className="pl-10"
                          disabled={loading}
                          {...form.register("bankAccountName", {
                            required: "Vui lòng nhập tên chủ tài khoản",
                          })}
                        />
                      </div>
                      {form.formState.errors.bankAccountName && (
                        <p className="text-xs text-destructive mt-1">
                          {form.formState.errors.bankAccountName.message}
                        </p>
                      )}
                    </div>
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
                          <span>Gửi yêu cầu rút tiền</span>
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
                    Yêu cầu rút tiền sẽ được xử lý trong vòng 24 giờ làm việc
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
