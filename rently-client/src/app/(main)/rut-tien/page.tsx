"use client";
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
import { useEffect, useCallback, useRef, useState } from "react";
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

        // Chỉ gọi checkWithdrawStatus một lần tránh loop
        if (checkWithdrawStatus) {
          checkWithdrawStatus(currentWithdrawalId);
        }
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
    <div className=" mx-auto py-8 space-y-6">
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
      {status === "withdraw-requested" || status === "withdraw-completed" ? (
        <Card className="w-full max-w-md mx-auto border-2 border-yellow-500/20 shadow-lg overflow-hidden">
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
                <p className="text-sm mb-2 font-medium">Thông tin ngân hàng:</p>
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
        <Card className="w-full max-w-lg mx-auto shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-muted/50 py-4">
            <div className="flex items-center gap-2">
              <ArrowDownIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Rút tiền từ tài khoản</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Nhập thông tin để rút tiền từ tài khoản Rently về tài khoản ngân
              hàng của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    onValueChange={(value) => form.setValue("bankName", value)}
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
                          onChange={(e) => setBankSearchTerm(e.target.value)}
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
              <p>Yêu cầu rút tiền sẽ được xử lý trong vòng 24 giờ làm việc</p>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
