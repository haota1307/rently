"use client";

import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search } from "lucide-react";
import { revenueColumns } from "@/features/dashboard/components/columns/revenue-columns";
import { formatPrice } from "@/lib/utils";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import paymentApiRequest from "@/features/dashboard/payment.api";
import { format } from "date-fns";
import { PaymentRevenueFilters } from "@/features/dashboard/components/filters/payment-revenue-filters";
import { ApiTransaction, Transaction } from "@/schemas/payment.schema";
import { PaymentDataTable } from "@/features/dashboard/components/payment-data-table";

const DashboardRevenuePage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [totalAmount, setTotalAmount] = useState<{
    income: number;
    expense: number;
    balance: number;
  }>({ income: 0, expense: 0, balance: 0 });
  const [bankInfo, setBankInfo] = useState({
    accountNumber: "",
    accountName: "",
    bankName: "",
    bankFullName: "",
    accumulated: "",
    lastTransaction: "",
    id: "",
    label: "",
  });
  const [loadingBankInfo, setLoadingBankInfo] = useState(true);

  useEffect(() => {
    const fetchBankInfo = async () => {
      setLoadingBankInfo(true);
      try {
        const response = await paymentApiRequest.getBankInfo();
        console.log("Response đầy đủ:", response);
        console.log("Response payload:", response.payload);
        if (response.payload?.bankInfo) {
          console.log("Bank info:", response.payload.bankInfo);
          setBankInfo(response.payload.bankInfo);
        }
      } catch (err) {
        console.error("Error fetching bank info:", err);
      } finally {
        setLoadingBankInfo(false);
      }
    };

    fetchBankInfo();
  }, []);

  const fetchTransactions = async (
    filterType?: string,
    statusFilter?: string,
    dateMin?: Date,
    dateMax?: Date
  ) => {
    try {
      setLoading(true);

      // Tạo tham số truy vấn cho API
      const params: Record<string, string> = {};

      // Nếu có filter theo loại giao dịch
      if (filterType && filterType !== "all") {
        if (filterType === "income") {
          params.amount_in = "true"; // Chỉ lấy giao dịch có tiền vào
          params.amount_out = "false"; // Không lấy giao dịch có tiền ra
        } else if (filterType === "expense") {
          params.amount_out = "true"; // Chỉ lấy giao dịch có tiền ra
          params.amount_in = "false"; // Không lấy giao dịch có tiền vào
        }
      }

      // Nếu có filter theo trạng thái
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }

      // Nếu có filter theo ngày
      if (dateMin) {
        params.transaction_date_min = dateMin.toISOString();
      }

      if (dateMax) {
        // Cài đặt thời gian tới cuối ngày
        const endOfDay = new Date(dateMax);
        endOfDay.setHours(23, 59, 59, 999);
        params.transaction_date_max = endOfDay.toISOString();
      }

      // Lấy dữ liệu giao dịch
      const response = await paymentApiRequest.getTransactions(params);

      if (response.payload?.transactions) {
        const formattedTransactions = response.payload.transactions
          .filter((t: ApiTransaction) => {
            // Chỉ hiển thị giao dịch có thông tin
            // Loại bỏ các giao dịch không có thông tin giao dịch khi lọc theo loại
            if (filterType === "income" && parseFloat(t.amount_in) <= 0)
              return false;
            if (filterType === "expense" && parseFloat(t.amount_out) <= 0)
              return false;

            // Lọc theo trạng thái ở phía client vì API có thể không lọc chính xác
            if (
              statusFilter &&
              statusFilter !== "all" &&
              t.status !== statusFilter
            )
              return false;

            return true;
          })
          .map((t: ApiTransaction) => {
            const transactionDate = new Date(t.transaction_date);
            // Xác định loại giao dịch dựa trên dữ liệu thực tế
            const isIncome = parseFloat(t.amount_in) > 0;
            const isExpense = parseFloat(t.amount_out) > 0;

            return {
              id: t.id,
              transactionId: t.code || `NAP${t.id}`,
              date: transactionDate.toLocaleDateString("vi-VN"),
              rawDate: transactionDate,
              amount: isIncome
                ? parseFloat(t.amount_in)
                : isExpense
                ? parseFloat(t.amount_out)
                : 0,
              type: isIncome ? "income" : isExpense ? "expense" : "unknown",
              user: t.user?.id || "Unknown",
              userName: t.user?.name || "Không rõ",
              userEmail: t.user?.email || "",
              userPhone: t.user?.phoneNumber || "",
              status: t.status || "PENDING",
              source: "SePay",
            };
          });
        setTransactions(formattedTransactions);

        // Lấy thống kê tổng tiền vào/ra từ server
        try {
          const summaryResponse = await paymentApiRequest.getTransactionSummary(
            params
          );
          if (summaryResponse.payload?.summary) {
            setTotalAmount({
              income: summaryResponse.payload.summary.totalIncome,
              expense: summaryResponse.payload.summary.totalExpense,
              balance: summaryResponse.payload.summary.balance,
            });
          }
        } catch (summaryErr) {
          console.error("Error fetching transaction summary:", summaryErr);
        }
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Không thể tải dữ liệu giao dịch. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu lần đầu khi component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Gọi lại API khi filter thay đổi
  useEffect(() => {
    fetchTransactions(activeFilter, activeStatus, startDate, endDate);
  }, [activeFilter, activeStatus, startDate, endDate]);

  const handleFilterChange = (type: string) => {
    setActiveFilter(type);
  };

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
  };

  // Function to clear date range filter
  const handleClearFilters = () => {
    setActiveFilter("all");
    setActiveStatus("all");
    setStartDate(undefined);
    setEndDate(undefined);
    toast.success("Đã xóa tất cả bộ lọc");
  };

  const handleExportReport = () => {
    toast.success("Đang chuẩn bị tải xuống báo cáo...");

    // Tạo nội dung CSV
    const headers = [
      "Mã giao dịch",
      "Ngày",
      "Số tiền",
      "Loại giao dịch",
      "Người dùng",
      "Email",
      "SĐT",
      "Trạng thái",
    ];
    const csvRows = [headers];

    // Hiển thị trạng thái đúng với enum PaymentStatus
    const getStatusText = (status: string) => {
      switch (status) {
        case "SUCCESS":
          return "Hoàn thành";
        case "PENDING":
          return "Đang xử lý";
        case "FAILED":
          return "Thất bại";
        case "CANCELED":
          return "Đã hủy";
        default:
          return status || "Không xác định";
      }
    };

    transactions.forEach((t) => {
      csvRows.push([
        t.transactionId,
        t.date,
        t.amount.toString(),
        t.type === "income" ? "Tiền vào" : "Tiền ra",
        t.userName,
        t.userEmail,
        t.userPhone,
        getStatusText(t.status),
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Tạo link tải xuống
    const link = document.createElement("a");
    const currentDate = format(new Date(), "dd-MM-yyyy");

    // Thêm thông tin bộ lọc vào tên file
    let fileName = `bao-cao-doanh-thu`;

    // Thêm loại giao dịch vào tên file nếu có filter
    if (activeFilter !== "all") {
      fileName += `-${activeFilter === "income" ? "tien-vao" : "tien-ra"}`;
    }

    // Thêm khoảng thời gian vào tên file nếu có filter theo ngày
    if (startDate || endDate) {
      fileName += "-tu";
      if (startDate) {
        fileName += `-${format(startDate, "dd-MM-yyyy")}`;
      } else {
        fileName += "-bat-dau";
      }

      if (endDate) {
        fileName += `-den-${format(endDate, "dd-MM-yyyy")}`;
      }
    }

    // Thêm ngày xuất báo cáo
    fileName += `-xuat-ngay-${currentDate}`;

    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Quản lý doanh thu</h1>
      </header>

      <div className="flex flex-col gap-5 p-4">
        {/* Header và tiêu đề */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Giao dịch tài chính
          </h2>
          <p className="text-muted-foreground">
            Quản lý và theo dõi các giao dịch tiền tệ trong hệ thống
          </p>
        </div>

        {/* Khu vực thẻ ngân hàng và bộ lọc */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Bank Card */}
          <div>
            {loadingBankInfo ? (
              <div className="bg-gray-200 animate-pulse rounded-xl shadow-lg h-56 w-full"></div>
            ) : bankInfo.accountNumber ? (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white w-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{bankInfo.bankName}</h3>
                    <p className="text-sm opacity-80">Tài khoản thanh toán</p>
                  </div>
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="my-6">
                  <p className="text-sm opacity-80 mb-1">Số tài khoản</p>
                  <div className="text-2xl font-bold tracking-wider">
                    {bankInfo.accountNumber.replace(/(\d{4})/g, "$1 ").trim()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm opacity-80 mb-1">Người thụ hưởng</p>
                    <p className="font-semibold">{bankInfo.accountName}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80 mb-1">Số dư hiện tại</p>
                    <p className="font-semibold">
                      {formatPrice(parseFloat(bankInfo.accumulated || "0"))}
                    </p>
                  </div>
                </div>

                <div className="mt-5 text-xs opacity-70">
                  <p>Sử dụng số tài khoản trên để nạp tiền vào hệ thống</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl shadow-lg p-6 text-gray-500 w-full">
                <p>Không thể tải thông tin tài khoản ngân hàng</p>
              </div>
            )}
          </div>

          {/* Khu vực bộ lọc và tổng hợp */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="text-sm font-medium text-gray-600 mb-3">
                Lọc giao dịch
              </h3>
              <PaymentRevenueFilters
                onFilterChange={handleFilterChange}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                activeFilter={activeFilter}
                activeStatus={activeStatus}
                onStatusChange={handleStatusChange}
              />
              <div className="flex justify-end mt-3">
                {(activeFilter !== "all" ||
                  activeStatus !== "all" ||
                  startDate ||
                  endDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
                <Button className="ml-2" size="sm" onClick={handleExportReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Xuất báo cáo
                </Button>
              </div>
            </div>

            {/* Thống kê tóm tắt */}
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-medium text-gray-600">
                    Tổng tiền vào
                  </h3>
                  <span className="text-xl font-bold text-green-600">
                    {formatPrice(totalAmount.income)}
                  </span>
                </div>
                {totalAmount.income > 0 && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Tổng tiền ra
                    </h3>
                    <span className="text-xl font-bold text-red-600">
                      {formatPrice(
                        totalAmount.income -
                          parseFloat(bankInfo.accumulated || "0")
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-600">Số dư</h3>
                  <span className="text-xl font-bold">
                    {formatPrice(totalAmount.balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <Card className="border-none shadow-sm">
          <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="text-base">Danh sách giao dịch</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-80">
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              <PaymentDataTable columns={revenueColumns} data={transactions} />
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
};

export default DashboardRevenuePage;
