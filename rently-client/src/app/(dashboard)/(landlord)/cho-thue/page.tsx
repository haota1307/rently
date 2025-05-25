"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Building2,
  DollarSign,
  HomeIcon,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Eye,
} from "lucide-react";
import {
  useGetStatisticsOverview,
  useGetLandlordTransactionData,
} from "@/features/statistics/statistics.hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import paymentApiRequest from "@/features/payment/payment.api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import TransactionReport from "@/features/landlord/transaction-report";
import RevenueReport from "@/features/statistics/components/revenue-report";

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  amount: number;
  isDeposit: boolean;
  transactionDate: Date;
  description: string;
  status: string;
}

const LandlordPage = () => {
  const { data: statistics, isLoading } = useGetStatisticsOverview();
  const [timeRange, setTimeRange] = useState(7);
  const { data: revenueData, isLoading: isLoadingRevenue } =
    useGetLandlordTransactionData(timeRange, undefined, undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [transactionTimeFilter, setTransactionTimeFilter] = useState<number>(7);

  // Tính toán số trang và dữ liệu hiển thị
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);

  // Hàm xử lý khi chuyển trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPercentageChange = (value?: number) => {
    if (value === undefined) return "0";
    return `${value >= 0 ? "+" : ""}${value}`;
  };

  // Hàm tính thời gian
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

    return format(date, "dd/MM/yyyy", { locale: vi });
  };

  // Hàm lấy giao dịch từ API
  const fetchTransactions = async (
    page: number,
    days: number = transactionTimeFilter
  ) => {
    try {
      setLoadingTransactions(true);

      // Tính toán thời gian từ số ngày
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Gọi API với tham số thời gian
      const response = await paymentApiRequest.getTransactions({
        current: true,
        limit: 20,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });

      if (response.status === 200 && response.payload?.transactions) {
        // Chuyển đổi dữ liệu API thành định dạng cần hiển thị
        const formattedTransactions: Transaction[] =
          response.payload.transactions
            .map((transaction: any) => {
              // Xác định loại giao dịch dựa vào nội dung và số tiền
              let isDeposit = parseFloat(transaction.amount_in) > 0;

              // Kiểm tra nội dung giao dịch để xác định đúng loại
              const content =
                transaction.transaction_content?.toLowerCase() || "";

              // Nếu nội dung chứa từ khóa liên quan đến phí đăng bài hoặc thanh toán phí, coi là tiền ra
              if (
                content.includes("phí đăng") ||
                content.includes("phí quảng cáo") ||
                content.includes("phí dịch vụ")
              ) {
                isDeposit = false;
              }
              // Nếu nội dung chứa từ khóa liên quan đến nạp tiền hoặc thanh toán từ người thuê, coi là tiền vào
              else if (
                content.includes("nạp tiền") ||
                content.includes("thanh toán từ người thuê")
              ) {
                isDeposit = true;
              }
              // Xác định theo code giao dịch
              else if (transaction.code?.startsWith("RUT")) {
                isDeposit = false;
              } else if (
                transaction.code?.startsWith("NAP") &&
                !content.includes("phí")
              ) {
                isDeposit = true;
              }

              // Số tiền hiển thị:
              let amount;
              if (isDeposit) {
                amount = parseFloat(transaction.amount_in);
              } else {
                // Nếu là tiền ra, ưu tiên dùng amount_out, nếu amount_out = 0 thì dùng amount_in
                amount =
                  parseFloat(transaction.amount_out) ||
                  parseFloat(transaction.amount_in);
              }

              return {
                id: transaction.id,
                userId: transaction.user?.id || "0",
                userName: transaction.user?.name || "Không xác định",
                userEmail: transaction.user?.email,
                amount: amount,
                isDeposit: isDeposit,
                transactionDate: new Date(transaction.transaction_date),
                description:
                  transaction.transaction_content ||
                  (isDeposit
                    ? "Nạp tiền vào tài khoản"
                    : "Thanh toán phí dịch vụ"),
                status: transaction.status || "COMPLETED",
              };
            })
            .sort(
              (a, b) =>
                b.transactionDate.getTime() - a.transactionDate.getTime()
            );

        // Lưu tổng số giao dịch
        setTotalTransactions(formattedTransactions.length);

        // Lưu tất cả giao dịch để xuất báo cáo
        setAllTransactions(formattedTransactions);

        // Phân trang thủ công (tính offset và limit)
        const offset = (page - 1) * itemsPerPage;
        const paginatedTransactions = formattedTransactions.slice(
          offset,
          offset + itemsPerPage
        );

        setTransactions(paginatedTransactions);
        // Reset trang về 1 nếu thay đổi bộ lọc
        if (currentPage !== 1) {
          setCurrentPage(1);
        }
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu giao dịch:", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Hàm xử lý xem chi tiết giao dịch
  const handleViewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  // Tải dữ liệu lần đầu và khi trang thay đổi
  useEffect(() => {
    fetchTransactions(currentPage, transactionTimeFilter);
  }, [currentPage]);

  // Hàm thay đổi khoảng thời gian biểu đồ
  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
    // Reset date filter when switching to preset time ranges
    setDateFilter({ from: undefined, to: undefined });
  };

  // Hàm xác định loại giao dịch chi tiết dựa vào nội dung
  const getTransactionType = (transaction: Transaction) => {
    const content = transaction.description.toLowerCase();

    if (transaction.isDeposit) {
      if (
        content.includes("từ người thuê") ||
        content.includes("thanh toán") ||
        content.includes("nhận tiền đặt")
      ) {
        return "Thu từ người thuê";
      } else {
        return "Nạp tiền vào tài khoản";
      }
    } else {
      if (
        content.includes("phí đăng") ||
        content.includes("phí quảng cáo") ||
        content.includes("phí dịch vụ")
      ) {
        return "Phí đăng bài";
      } else if (content.includes("rút tiền")) {
        return "Rút tiền về tài khoản";
      } else {
        return "Chi phí dịch vụ";
      }
    }
  };

  // Thêm hàm hiển thị tên trạng thái
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Hoàn thành";
      case "PENDING":
        return "Đang chờ xử lý";
      case "CANCELED":
        return "Đã hủy";
      case "REJECTED":
        return "Bị từ chối";
      default:
        return "Không xác định";
    }
  };

  // Thêm hàm trả về màu variant cho badge trạng thái
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "outline";
      case "PENDING":
        return "warning";
      case "CANCELED":
      case "REJECTED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Thêm hàm xử lý thay đổi bộ lọc thời gian ở sau các hàm hiện có
  const handleTransactionTimeFilterChange = (days: number) => {
    setTransactionTimeFilter(days);
    // Gọi lại API để lấy dữ liệu theo khoảng thời gian mới
    fetchTransactions(1, days);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Tổng quan</h1>
      </header>

      {/* Thẻ thống kê */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 m-4">
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 md:p-3 md:pb-2 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xs md:text-sm font-medium">
              Tổng số nhà trọ
            </CardTitle>
            <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <HomeIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-lg md:text-xl lg:text-2xl font-bold">
                  {statistics?.totalRentals || 0}
                </div>
                <div className="flex items-center mt-1">
                  <Badge
                    variant={
                      statistics?.percentageChanges?.rentals &&
                      statistics?.percentageChanges?.rentals >= 0
                        ? "default"
                        : "destructive"
                    }
                    className={cn(
                      "text-[10px] md:text-xs",
                      statistics?.percentageChanges?.rentals &&
                        statistics?.percentageChanges?.rentals >= 0
                        ? "bg-green-100 text-green-700"
                        : ""
                    )}
                  >
                    {getPercentageChange(
                      statistics?.percentageChanges?.rentals
                    )}
                    %
                  </Badge>
                  <span className="text-[10px] md:text-xs text-muted-foreground ml-1">
                    so với tháng trước
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 md:p-3 md:pb-2 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-xs md:text-sm font-medium">
              Tổng số phòng trọ
            </CardTitle>
            <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-green-100 flex items-center justify-center">
              <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-700" />
            </div>
          </CardHeader>
          <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-lg md:text-xl lg:text-2xl font-bold">
                  {statistics?.totalRooms || 0}
                </div>
                <div className="flex items-center mt-1">
                  <Badge
                    variant={
                      statistics?.percentageChanges?.rooms &&
                      statistics?.percentageChanges?.rooms >= 0
                        ? "default"
                        : "destructive"
                    }
                    className={cn(
                      "text-[10px] md:text-xs",
                      statistics?.percentageChanges?.rooms &&
                        statistics?.percentageChanges?.rooms >= 0
                        ? "bg-green-100 text-green-700"
                        : ""
                    )}
                  >
                    {getPercentageChange(statistics?.percentageChanges?.rooms)}%
                  </Badge>
                  <span className="text-[10px] md:text-xs text-muted-foreground ml-1">
                    so với tháng trước
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 md:p-3 md:pb-2 bg-gradient-to-r from-purple-50 to-violet-50">
            <CardTitle className="text-xs md:text-sm font-medium">
              Tổng số bài viết đã đăng
            </CardTitle>
            <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-700" />
            </div>
          </CardHeader>
          <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-lg md:text-xl lg:text-2xl font-bold">
                  {statistics?.totalPosts || 0}
                </div>
                <div className="flex items-center mt-1">
                  <Badge
                    variant={
                      statistics?.percentageChanges?.posts &&
                      statistics?.percentageChanges?.posts >= 0
                        ? "default"
                        : "destructive"
                    }
                    className={cn(
                      "text-[10px] md:text-xs",
                      statistics?.percentageChanges?.posts &&
                        statistics?.percentageChanges?.posts >= 0
                        ? "bg-green-100 text-green-700"
                        : ""
                    )}
                  >
                    {getPercentageChange(statistics?.percentageChanges?.posts)}%
                  </Badge>
                  <span className="text-[10px] md:text-xs text-muted-foreground ml-1">
                    so với tháng trước
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 md:p-3 md:pb-2 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle className="text-xs md:text-sm font-medium">
              Số dư tài khoản
            </CardTitle>
            <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-700" />
            </div>
          </CardHeader>
          <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-lg md:text-xl lg:text-2xl font-bold">
                  {formatCurrency(statistics?.accountBalance || 0)}
                </div>
                <div className="flex items-center mt-1">
                  <Badge
                    variant={
                      statistics?.percentageChanges?.balance &&
                      statistics?.percentageChanges?.balance >= 0
                        ? "default"
                        : "destructive"
                    }
                    className={cn(
                      "text-[10px] md:text-xs",
                      statistics?.percentageChanges?.balance &&
                        statistics?.percentageChanges?.balance >= 0
                        ? "bg-green-100 text-green-700"
                        : ""
                    )}
                  >
                    {getPercentageChange(
                      statistics?.percentageChanges?.balance
                    )}
                    %
                  </Badge>
                  <span className="text-[10px] md:text-xs text-muted-foreground ml-1">
                    so với tháng trước
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ và lịch sử giao dịch */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 m-4">
        {/* Biểu đồ doanh thu */}
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Biến động Thu - Chi
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={timeRange === 7 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeRangeChange(7)}
                >
                  7 ngày
                </Button>
                <Button
                  variant={timeRange === 30 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeRangeChange(30)}
                >
                  30 ngày
                </Button>
                <RevenueReport
                  data={revenueData || []}
                  timeRange={timeRange}
                  dateFilter={dateFilter}
                />
              </div>
            </div>
            <CardDescription className="text-xs">
              Thống kê tiền vào và tiền ra trong khoảng thời gian
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="h-[240px] md:h-[300px] w-full">
              {isLoading || isLoadingRevenue ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                    <YAxis
                      tickFormatter={(value) =>
                        value >= 1000000
                          ? `${(value / 1000000).toFixed(0)}tr`
                          : value >= 1000
                            ? `${(value / 1000).toFixed(0)}k`
                            : value.toString()
                      }
                      fontSize={12}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{
                        fontWeight: "bold",
                        marginBottom: "5px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: "12px",
                        paddingTop: "10px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="đặt cọc"
                      name="Tiền đặt cọc"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="phí đăng bài"
                      name="Phí đăng bài"
                      stackId="2"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="hoàn cọc"
                      name="Hoàn tiền cọc"
                      stackId="3"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lịch sử giao dịch */}
        <Card className="col-span-3 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-3 md:p-4 lg:p-5">
            <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-1 md:gap-2">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              Lịch sử giao dịch của bạn
            </CardTitle>
            <CardDescription className="text-xs md:text-sm mt-1">
              Các giao dịch gần đây liên quan đến hoạt động cho thuê
            </CardDescription>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant={transactionTimeFilter === 7 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTransactionTimeFilterChange(7)}
                >
                  7 ngày
                </Button>
                <Button
                  variant={transactionTimeFilter === 30 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTransactionTimeFilterChange(30)}
                >
                  30 ngày
                </Button>
              </div>
              <TransactionReport
                transactions={allTransactions}
                title="Báo cáo giao dịch tài khoản"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {loadingTransactions ? (
                <div className="p-3 pt-0 md:p-6 md:pt-0 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : transactions.length > 0 ? (
                <>
                  <div className="divide-y">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-3 md:p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center",
                                transaction.isDeposit
                                  ? "bg-green-100"
                                  : "bg-red-100"
                              )}
                            >
                              {transaction.isDeposit ? (
                                <ArrowDownCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                              ) : (
                                <ArrowUpCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm md:text-base font-medium">
                                {transaction.isDeposit ? "Tiền vào" : "Tiền ra"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getTimeAgo(transaction.transactionDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span
                              className={cn(
                                "text-sm md:text-base font-semibold",
                                transaction.isDeposit
                                  ? "text-green-600"
                                  : "text-red-600"
                              )}
                            >
                              {transaction.isDeposit ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(
                                transaction.transactionDate,
                                "dd/MM/yyyy",
                                { locale: vi }
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs md:text-sm text-muted-foreground truncate max-w-[60%] sm:max-w-[70%]">
                            {transaction.description}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3"
                            onClick={() =>
                              handleViewTransactionDetails(transaction)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span>Chi tiết</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Phân trang */}
                  {totalPages > 1 && (
                    <div className="py-3 border-t flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                handlePageChange(Math.max(1, currentPage - 1))
                              }
                              className={cn(
                                currentPage === 1 &&
                                  "pointer-events-none opacity-50"
                              )}
                            />
                          </PaginationItem>

                          {Array.from({ length: totalPages }).map(
                            (_, index) => {
                              const page = index + 1;
                              // Hiển thị các trang gần trang hiện tại
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 &&
                                  page <= currentPage + 1)
                              ) {
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      isActive={page === currentPage}
                                      onClick={() => handlePageChange(page)}
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              }

                              // Hiển thị dấu ... nếu có khoảng cách
                              if (
                                (page === 2 && currentPage > 3) ||
                                (page === totalPages - 1 &&
                                  currentPage < totalPages - 2)
                              ) {
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                              }

                              return null;
                            }
                          )}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                handlePageChange(
                                  Math.min(totalPages, currentPage + 1)
                                )
                              }
                              className={cn(
                                currentPage === totalPages &&
                                  "pointer-events-none opacity-50"
                              )}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-sm md:text-base text-muted-foreground">
                  Bạn chưa có giao dịch nào gần đây
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog hiển thị chi tiết giao dịch */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết giao dịch</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về giao dịch của bạn
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 py-2">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      selectedTransaction.isDeposit
                        ? "bg-green-100"
                        : "bg-red-100"
                    )}
                  >
                    {selectedTransaction.isDeposit ? (
                      <ArrowDownCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <ArrowUpCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <span className="block text-sm font-medium">
                      {selectedTransaction.isDeposit ? "Tiền vào" : "Tiền ra"}
                    </span>
                    <span
                      className={cn(
                        "text-lg font-bold",
                        selectedTransaction.isDeposit
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {selectedTransaction.isDeposit ? "+" : "-"}
                      {formatCurrency(selectedTransaction.amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã giao dịch:</span>
                  <span className="font-medium">{selectedTransaction.id}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thời gian:</span>
                  <span className="font-medium">
                    {format(
                      selectedTransaction.transactionDate,
                      "dd/MM/yyyy HH:mm:ss",
                      { locale: vi }
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <Badge
                    variant={getStatusVariant(selectedTransaction.status)}
                    className="font-normal"
                  >
                    {getStatusDisplay(selectedTransaction.status)}
                  </Badge>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nội dung:</span>
                  <span className="font-medium text-right">
                    {selectedTransaction.description}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loại giao dịch:</span>
                  <span className="font-medium">
                    {getTransactionType(selectedTransaction)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarInset>
  );
};

export default LandlordPage;
