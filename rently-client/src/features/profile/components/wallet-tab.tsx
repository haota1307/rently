"use client";

import { useState, useEffect } from "react";
import {
  useAccountMe,
  usePaymentHistory,
  Payment,
} from "@/features/profile/useProfile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  CalendarDays,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

export function WalletTab() {
  const router = useRouter();
  const { data, isLoading } = useAccountMe();
  const { data: paymentHistoryData, isLoading: isLoadingPaymentHistory } =
    usePaymentHistory();
  const user = data?.payload;
  const payments: Payment[] = paymentHistoryData?.payload?.payload || [];

  // Hàm xác định loại giao dịch (tiền vào hay tiền ra)
  const getTransactionType = (description: string | null) => {
    if (!description) return "unknown";

    // Tiền vào
    if (
      description.includes("Nạp tiền") ||
      description.includes("Nhận tiền đặt cọc")
    ) {
      return "in";
    }

    // Tiền ra
    if (
      description.includes("Phí đăng bài") ||
      description.includes("Tiền đặt cọc")
    ) {
      return "out";
    }

    return "unknown";
  };

  // Tính tổng số tiền đã nạp và đã chi
  const totalIn = payments
    .filter((payment) => getTransactionType(payment.description) === "in")
    .reduce((sum: number, payment) => sum + payment.amount, 0);

  const totalOut = payments
    .filter((payment) => getTransactionType(payment.description) === "out")
    .reduce((sum: number, payment) => sum + payment.amount, 0);

  // Hàm xử lý sự kiện khi nhấn vào nút Nạp tiền
  const handleDepositClick = () => {
    router.push("/nap-tien");
  };

  if (isLoading || isLoadingPaymentHistory) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thông tin số dư */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Số dư tài khoản
            </CardTitle>
            <CardDescription>Tổng quan về tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col justify-between p-6 bg-primary/5 rounded-lg min-h-32">
                <div className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Số dư khả dụng
                </div>
                <div className="text-3xl font-bold">
                  {user?.balance?.toLocaleString() || 0} VNĐ
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                      <ArrowDownCircle className="h-4 w-4 text-green-500" />
                      Đã nạp
                    </div>
                    <span className="text-green-600 font-semibold">
                      +{totalIn.toLocaleString()} VNĐ
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4 text-red-500" />
                      Đã chi
                    </div>
                    <span className="text-red-600 font-semibold">
                      -{totalOut.toLocaleString()} VNĐ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDepositClick}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Nạp tiền
              </Button>
              <Button
                variant="default"
                className="w-full"
                onClick={() => router.push("/rut-tien")}
              >
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Rút tiền
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Thống kê
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">
                  Đã sử dụng
                </span>
                <span className="text-sm font-medium">
                  {totalOut.toLocaleString()}/
                  {(totalIn + (user?.balance || 0)).toLocaleString()}
                </span>
              </div>
              {/* <Progress value={6.67} className="h-2" /> */}
            </div>
            <Separator />
            <div>
              <div className="text-sm font-medium mb-2">Hoạt động gần đây</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Lần nạp tiền gần nhất
                  </span>
                  <span>
                    {payments.find((p) => p.description?.includes("Nạp tiền"))
                      ? format(
                          new Date(
                            payments.find((p) =>
                              p.description?.includes("Nạp tiền")
                            )?.createdAt || new Date()
                          ),
                          "dd/MM/yyyy"
                        )
                      : "Chưa có"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Lần chi tiêu gần nhất
                  </span>
                  <span>
                    {payments.find((p) =>
                      p.description?.includes("Phí đăng bài")
                    )
                      ? format(
                          new Date(
                            payments.find((p) =>
                              p.description?.includes("Phí đăng bài")
                            )?.createdAt || new Date()
                          ),
                          "dd/MM/yyyy"
                        )
                      : "Chưa có"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lịch sử giao dịch */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lịch sử giao dịch
          </CardTitle>
          <CardDescription>Các giao dịch gần đây của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="deposits">Tiền vào</TabsTrigger>
              <TabsTrigger value="expenses">Tiền ra</TabsTrigger>
              <TabsTrigger value="posts">Phí đăng bài</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-4">
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 bg-muted/40 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionType(payment.description) === "in" ? (
                          <ArrowDownCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUpCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">
                            {payment.description}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center mt-1">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            {format(
                              new Date(payment.createdAt),
                              "dd/MM/yyyy HH:mm"
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={
                            getTransactionType(payment.description) === "in"
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {getTransactionType(payment.description) === "in"
                            ? "+"
                            : "-"}
                          {payment.amount.toLocaleString()} VNĐ
                        </div>
                        <Badge
                          variant="outline"
                          className={`mt-1 ${
                            payment.status === "COMPLETED"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : payment.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                          }`}
                        >
                          {payment.status === "COMPLETED"
                            ? "Hoàn thành"
                            : payment.status === "PENDING"
                            ? "Đang xử lý"
                            : "Đã hủy"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có giao dịch nào
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="posts">
              <div className="space-y-4">
                {payments.filter((p) => p.description?.includes("Phí đăng bài"))
                  .length > 0 ? (
                  payments
                    .filter((p) => p.description?.includes("Phí đăng bài"))
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-muted/40 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">
                              {payment.description}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center mt-1">
                              <CalendarDays className="h-3 w-3 mr-1" />
                              {format(
                                new Date(payment.createdAt),
                                "dd/MM/yyyy HH:mm"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-600 font-medium">
                            -{payment.amount.toLocaleString()} VNĐ
                          </div>
                          <Badge
                            variant="outline"
                            className={`mt-1 ${
                              payment.status === "COMPLETED"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : payment.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                            }`}
                          >
                            {payment.status === "COMPLETED"
                              ? "Hoàn thành"
                              : payment.status === "PENDING"
                              ? "Đang xử lý"
                              : "Đã hủy"}
                          </Badge>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có giao dịch phí đăng bài nào
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="deposits">
              <div className="space-y-4">
                {payments.filter(
                  (p) => getTransactionType(p.description) === "in"
                ).length > 0 ? (
                  payments
                    .filter((p) => getTransactionType(p.description) === "in")
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-muted/40 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <ArrowDownCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="font-medium">
                              {payment.description}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center mt-1">
                              <CalendarDays className="h-3 w-3 mr-1" />
                              {format(
                                new Date(payment.createdAt),
                                "dd/MM/yyyy HH:mm"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 font-medium">
                            +{payment.amount.toLocaleString()} VNĐ
                          </div>
                          <Badge
                            variant="outline"
                            className={`mt-1 ${
                              payment.status === "COMPLETED"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : payment.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                            }`}
                          >
                            {payment.status === "COMPLETED"
                              ? "Hoàn thành"
                              : payment.status === "PENDING"
                              ? "Đang xử lý"
                              : "Đã hủy"}
                          </Badge>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có giao dịch tiền vào nào
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="expenses">
              <div className="space-y-4">
                {payments.filter(
                  (p) => getTransactionType(p.description) === "out"
                ).length > 0 ? (
                  payments
                    .filter((p) => getTransactionType(p.description) === "out")
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-muted/40 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <ArrowUpCircle className="h-5 w-5 text-red-500" />
                          <div>
                            <div className="font-medium">
                              {payment.description}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center mt-1">
                              <CalendarDays className="h-3 w-3 mr-1" />
                              {format(
                                new Date(payment.createdAt),
                                "dd/MM/yyyy HH:mm"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-600 font-medium">
                            -{payment.amount.toLocaleString()} VNĐ
                          </div>
                          <Badge
                            variant="outline"
                            className={`mt-1 ${
                              payment.status === "COMPLETED"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : payment.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                            }`}
                          >
                            {payment.status === "COMPLETED"
                              ? "Hoàn thành"
                              : payment.status === "PENDING"
                              ? "Đang xử lý"
                              : "Đã hủy"}
                          </Badge>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có giao dịch tiền ra nào
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
