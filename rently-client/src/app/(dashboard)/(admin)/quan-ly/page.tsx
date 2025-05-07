"use client";

import "mapbox-gl/dist/mapbox-gl.css";
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
  Layers,
  Calendar,
  MoreHorizontal,
  Search,
  Circle,
  X,
  Map,
  PieChart,
  Activity,
  Eye,
} from "lucide-react";
import {
  useGetStatisticsOverview,
  useGetRevenueData,
  useGetRoomDistribution,
  useGetPostsByArea,
  useGetPopularAreas,
} from "@/features/statistics/statistics.hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState, useMemo, useRef } from "react";
import paymentApiRequest from "@/features/payment/payment.api";
import { format, subDays } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPostsByArea } from "@/features/statistics/statistics.api";
import dynamic from "next/dynamic";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Kiểu dữ liệu cho hoạt động giao dịch
interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  amount: number;
  isDeposit: boolean;
  transactionDate: Date;
  description: string;
}

// Kiểu dữ liệu cho tổng kết giao dịch
interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

// Tải MapBox theo kiểu dynamic để tránh lỗi SSR
const MapWithGeocodeDynamic = dynamic(
  () => import("@/features/map/map-with-geocode"),
  { ssr: false }
);

const DashboardPage = () => {
  const { data, isLoading, error } = useGetStatisticsOverview();
  const [timeRange, setTimeRange] = useState<number>(7);
  const { data: revenueData, isLoading: isLoadingRevenue } =
    useGetRevenueData(timeRange);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: roomDistribution, isLoading: isLoadingRoomDistribution } =
    useGetRoomDistribution();
  const {
    data: postsByArea,
    isLoading: isLoadingPostsByArea,
    error: postsByAreaError,
  } = useGetPostsByArea(5);
  const { data: popularAreasData, isLoading: isLoadingPopularAreas } =
    useGetPopularAreas(5);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionSummary, setTransactionSummary] =
    useState<TransactionSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // State cho bộ lọc giao dịch
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showUserFilter, setShowUserFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [userFilter, setUserFilter] = useState("");
  const [transactionFilters, setTransactionFilters] = useState<
    Record<string, string | number | boolean>
  >({
    limit: "5",
  });

  // Thêm state cho phân trang trong tab tài chính
  const [financeCurrentPage, setFinanceCurrentPage] = useState(1);
  const [financeItemsPerPage, setFinanceItemsPerPage] = useState(10);

  // Tính toán phần trăm thay đổi an toàn
  const getPercentage = (value?: number) => {
    if (value === undefined || isNaN(value)) return "0";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}`;
  };

  // Tải tổng kết giao dịch
  useEffect(() => {
    const fetchTransactionSummary = async () => {
      try {
        setLoadingSummary(true);
        const response = await paymentApiRequest.getTransactionSummary();

        if (response.status === 200 && response.payload?.summary) {
          setTransactionSummary({
            totalIncome: response.payload.summary.totalIncome || 0,
            totalExpense: response.payload.summary.totalExpense || 0,
            balance: response.payload.summary.balance || 0,
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải tổng kết giao dịch:", error);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchTransactionSummary();
  }, []);

  // Tải danh sách giao dịch gần đây
  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        setLoadingTransactions(true);

        // Chuẩn bị tham số lọc
        const params: Record<string, string> = {
          limit: transactionFilters.limit.toString(),
        };

        if (dateFilter.from) {
          params.startDate = format(dateFilter.from, "yyyy-MM-dd");
        }

        if (dateFilter.to) {
          params.endDate = format(dateFilter.to, "yyyy-MM-dd");
        }

        if (userFilter) {
          params.userId = userFilter;
        }

        // Gọi API với tham số đã lọc
        const response = await paymentApiRequest.getTransactions(params);

        if (response.status === 200 && response.payload?.transactions) {
          // Chuyển đổi dữ liệu API thành định dạng cần hiển thị
          const transactions: Transaction[] = response.payload.transactions
            .map((transaction: any) => {
              const isDeposit = parseFloat(transaction.amount_in) > 0;
              return {
                id: transaction.id,
                userId: transaction.user?.id || "0",
                userName: transaction.user?.name || "Người dùng ẩn danh",
                userEmail: transaction.user?.email,
                amount: isDeposit
                  ? parseFloat(transaction.amount_in)
                  : parseFloat(transaction.amount_out),
                isDeposit: isDeposit,
                transactionDate: new Date(transaction.transaction_date),
                description:
                  transaction.transaction_content ||
                  (isDeposit
                    ? "Nạp tiền vào tài khoản"
                    : "Rút tiền từ tài khoản"),
              };
            })
            .sort(
              (a, b) =>
                b.transactionDate.getTime() - a.transactionDate.getTime()
            ); // Sắp xếp mới nhất lên đầu

          setRecentTransactions(transactions);
        }
      } catch (error) {
        console.error("Lỗi khi tải giao dịch gần đây:", error);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchRecentTransactions();
  }, [dateFilter, userFilter, transactionFilters]);

  // Thêm useEffect để log dữ liệu postsByArea
  useEffect(() => {
    if (postsByArea) {
      console.log("Dữ liệu postsByArea:", postsByArea);
    }
  }, [postsByArea]);

  // Tính thời gian hiển thị cho giao dịch
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

  // Cấu hình các màu sắc cho biểu đồ
  const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Handler for changing time range
  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
  };

  // Handler cho bộ lọc theo ngày
  const handleDateFilterToggle = () => {
    setShowDateFilter(true);
  };

  // Handler cho bộ lọc theo người dùng
  const handleUserFilterToggle = () => {
    setShowUserFilter(true);
  };

  // Handler để áp dụng bộ lọc ngày
  const handleApplyDateFilter = () => {
    setShowDateFilter(false);

    // Cập nhật transaction filters
    setTransactionFilters((prev) => ({
      ...prev,
      limit: "10", // Tăng limit khi áp dụng bộ lọc
    }));
  };

  // Handler để xóa bộ lọc ngày
  const handleClearDateFilter = () => {
    setDateFilter({ from: undefined, to: undefined });
  };

  // Handler để áp dụng bộ lọc người dùng
  const handleApplyUserFilter = () => {
    setShowUserFilter(false);

    // Cập nhật transaction filters
    setTransactionFilters((prev) => ({
      ...prev,
      limit: "10", // Tăng limit khi áp dụng bộ lọc
    }));
  };

  // Handler để xóa bộ lọc người dùng
  const handleClearUserFilter = () => {
    setUserFilter("");
  };

  // Xử lý dữ liệu khu vực
  const normalizedPostsByArea = useMemo(() => {
    if (!postsByArea || !Array.isArray(postsByArea)) return [];

    // Đảm bảo dữ liệu có đúng cấu trúc
    return postsByArea.map((area) => ({
      name: area.name || "Không xác định",
      posts: typeof area.posts === "number" ? area.posts : 0,
    }));
  }, [postsByArea]);

  // Tính toán số trang cho phân trang
  const totalPages = Math.ceil(
    (recentTransactions?.length || 0) / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    recentTransactions?.length || 0
  );
  const currentTransactions =
    recentTransactions?.slice(startIndex, endIndex) || [];

  // Hàm xử lý khi chuyển trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Hàm xử lý xem chi tiết giao dịch
  const handleViewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  // Tính toán số trang và dữ liệu hiển thị cho tab tài chính
  const financeTotalPages = Math.ceil(
    (recentTransactions?.length || 0) / financeItemsPerPage
  );
  const financeStartIndex = (financeCurrentPage - 1) * financeItemsPerPage;
  const financeEndIndex = Math.min(
    financeStartIndex + financeItemsPerPage,
    recentTransactions?.length || 0
  );
  const financeCurrentTransactions =
    recentTransactions?.slice(financeStartIndex, financeEndIndex) || [];

  // Hàm xử lý khi chuyển trang trong tab tài chính
  const handleFinancePageChange = (page: number) => {
    setFinanceCurrentPage(page);
  };

  // Thêm bản đồ nhiệt khu vực
  const HeatmapRentalDistribution = () => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [areaData, setAreaData] = useState<
      {
        name: string;
        posts: number;
        coordinates?: [number, number];
      }[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mapboxInstance, setMapboxInstance] = useState<any>(null);

    // Tọa độ trung tâm Cần Thơ (hoặc Nam Cần Thơ)
    const centerCoordinates: [number, number] = [105.7228, 10.008];

    // Tải dữ liệu khu vực
    useEffect(() => {
      const fetchHeatmapData = async () => {
        try {
          setLoading(true);
          // Lấy dữ liệu từ API
          const postsByAreaData = await getPostsByArea(10);

          // Dữ liệu demo tọa độ cho các khu vực (trong thực tế cần API riêng)
          // Các tọa độ này chỉ là ví dụ, trong thực tế cần lưu tọa độ thực của mỗi phường
          const demoCoordinates: Record<string, [number, number]> = {
            "Phường An Khánh": [105.7622, 10.0334],
            "Phường An Hòa": [105.7731, 10.0392],
            "Phường Xuân Khánh": [105.7687, 10.0294],
            "Phường Hưng Lợi": [105.7558, 10.0198],
            "Phường An Bình": [105.7416, 10.0334],
            "P. An Cư": [105.7792, 10.0341],
            "P. Thới Bình": [105.7838, 10.0427],
            "Khu vực khác": [105.752, 10.021],
            // Thêm các phường khác ở đây
          };

          // Kết hợp dữ liệu bài đăng và tọa độ
          const dataWithCoordinates = postsByAreaData.map((area) => ({
            ...area,
            coordinates: demoCoordinates[area.name] || [
              centerCoordinates[0] + (Math.random() * 0.04 - 0.02),
              centerCoordinates[1] + (Math.random() * 0.04 - 0.02),
            ],
          }));

          setAreaData(dataWithCoordinates);
        } catch (err) {
          console.error("Lỗi khi tải dữ liệu bản đồ nhiệt:", err);
          setError("Không thể tải dữ liệu bản đồ nhiệt");
        } finally {
          setLoading(false);
        }
      };

      fetchHeatmapData();
    }, []);

    // Khởi tạo bản đồ
    useEffect(() => {
      if (!mapContainerRef.current || mapLoaded || loading || !areaData.length)
        return;

      // Tải mapbox-gl theo cách này để tránh lỗi SSR
      const initMap = async () => {
        try {
          // Import mapboxgl động từ module
          const mapboxgl = (await import("mapbox-gl")).default;
          setMapboxInstance(mapboxgl);

          // Thiết lập token
          const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
          if (!token) {
            console.error("Thiếu Mapbox access token");
            setError("Thiếu cấu hình bản đồ");
            return;
          }

          // Kiểm tra container
          if (!mapContainerRef.current) {
            console.error("Container không tồn tại");
            return;
          }

          mapboxgl.accessToken = token;

          // Tạo bản đồ
          const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/streets-v11",
            center: centerCoordinates,
            zoom: 13,
          });

          // Xử lý sự kiện
          map.on("load", () => {
            setMapLoaded(true);

            // Thêm marker cho mỗi khu vực
            areaData.forEach((area) => {
              if (!area.coordinates) return;

              // Tính màu dựa trên số lượng bài đăng
              const maxPosts = Math.max(...areaData.map((a) => a.posts));
              const colorScale = area.posts / maxPosts;

              // Màu từ xanh lá -> vàng -> đỏ
              const r = Math.floor(255 * Math.min(1, colorScale * 2));
              const g = Math.floor(255 * Math.min(1, 2 - colorScale * 2));
              const color = `rgb(${r}, ${g}, 0)`;

              // Tính kích thước marker tỷ lệ với số bài đăng
              const size = 20 + (area.posts / maxPosts) * 40;

              // Tạo phần tử HTML cho marker
              const el = document.createElement("div");
              el.className = "custom-marker";
              el.style.width = `${size}px`;
              el.style.height = `${size}px`;
              el.style.borderRadius = "50%";
              el.style.backgroundColor = color;
              el.style.opacity = "0.7";

              // Thêm marker vào bản đồ
              new mapboxgl.Marker({ element: el })
                .setLngLat(area.coordinates)
                .setPopup(
                  new mapboxgl.Popup({ offset: 25 }).setHTML(
                    `<h3>${area.name}</h3><p>${area.posts} bài đăng</p>`
                  )
                )
                .addTo(map);
            });
          });

          // Bắt lỗi
          map.on("error", (e) => {
            console.error("Lỗi bản đồ:", e);
            setError("Lỗi khi tải bản đồ");
          });

          return () => {
            map.remove();
          };
        } catch (error) {
          console.error("Lỗi khởi tạo mapbox:", error);
          setError("Không thể khởi tạo bản đồ");
        }
      };

      initMap();
    }, [areaData, loading, mapLoaded]);

    if (loading) {
      return (
        <div className="h-[400px] w-full flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-[400px] w-full flex items-center justify-center">
          <div className="text-center">
            <Circle className="h-10 w-10 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-500">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Tải lại
            </Button>
          </div>
        </div>
      );
    }

    if (!areaData.length) {
      return (
        <div className="h-[400px] w-full bg-muted/30 rounded-md flex items-center justify-center">
          <div className="text-center">
            <Map className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Chưa có dữ liệu bản đồ nhiệt
            </p>
          </div>
        </div>
      );
    }

    return (
      <div ref={mapContainerRef} className="h-[400px] w-full rounded-md" />
    );
  };

  return (
    <SidebarInset>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-2 md:px-4 w-full sticky top-0 bg-background z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-base md:text-lg font-semibold">Tổng quan</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative rounded-md shadow-sm hidden md:flex">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              className="pl-10 pr-4 py-2 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Calendar className="h-4 w-4 mr-1" />
            Hôm nay
          </Button>
          <Button variant="outline" size="icon" className="flex md:hidden">
            <Search className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <div className="p-2 md:p-4 space-y-4 overflow-y-auto overflow-x-hidden max-w-full">
        <Tabs
          defaultValue="overview"
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList className="mb-0 w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="overview" className="text-xs md:text-sm">
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="finance" className="text-xs md:text-sm">
                Tài chính
              </TabsTrigger>
              <TabsTrigger value="regions" className="text-xs md:text-sm">
                Khu vực
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0">
            <div className="grid gap-3 md:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
              <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 md:p-3 md:pb-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-xs md:text-sm font-medium">
                    Tổng nhà trọ
                  </CardTitle>
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-700" />
                  </div>
                </CardHeader>
                <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-lg md:text-xl lg:text-2xl font-bold">
                        {data?.totalRentals?.toLocaleString("vi-VN") || "0"}
                      </div>
                      <div className="flex items-center mt-1">
                        <Badge
                          variant={
                            data?.percentageChanges?.rentals &&
                            data?.percentageChanges?.rentals >= 0
                              ? "default"
                              : "destructive"
                          }
                          className={cn(
                            "text-[10px] md:text-xs",
                            data?.percentageChanges?.rentals &&
                              data?.percentageChanges?.rentals >= 0
                              ? "bg-green-100 text-green-700"
                              : ""
                          )}
                        >
                          {getPercentage(data?.percentageChanges?.rentals)}%
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
                    Phòng trọ
                  </CardTitle>
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <HomeIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-700" />
                  </div>
                </CardHeader>
                <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-lg md:text-xl lg:text-2xl font-bold">
                        {data?.totalRooms?.toLocaleString("vi-VN") || "0"}
                      </div>
                      <div className="flex items-center mt-1">
                        <Badge
                          variant={
                            data?.percentageChanges?.rooms &&
                            data?.percentageChanges?.rooms >= 0
                              ? "default"
                              : "destructive"
                          }
                          className={cn(
                            "text-[10px] md:text-xs",
                            data?.percentageChanges?.rooms &&
                              data?.percentageChanges?.rooms >= 0
                              ? "bg-green-100 text-green-700"
                              : ""
                          )}
                        >
                          {getPercentage(data?.percentageChanges?.rooms)}%
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
                    Bài đăng
                  </CardTitle>
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Layers className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-700" />
                  </div>
                </CardHeader>
                <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-lg md:text-xl lg:text-2xl font-bold">
                        {data?.totalPosts?.toLocaleString("vi-VN") || "0"}
                      </div>
                      <div className="flex items-center mt-1">
                        <Badge
                          variant={
                            data?.percentageChanges?.posts &&
                            data?.percentageChanges?.posts >= 0
                              ? "default"
                              : "destructive"
                          }
                          className={cn(
                            "text-[10px] md:text-xs",
                            data?.percentageChanges?.posts &&
                              data?.percentageChanges?.posts >= 0
                              ? "bg-green-100 text-green-700"
                              : ""
                          )}
                        >
                          {getPercentage(data?.percentageChanges?.posts)}%
                        </Badge>
                        <span className="text-[10px] md:text-xs text-muted-foreground ml-1">
                          so với tháng trước
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Card hiển thị doanh thu với số tiền nạp và rút */}
              <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 md:p-3 md:pb-2 bg-gradient-to-r from-amber-50 to-yellow-50">
                  <CardTitle className="text-xs md:text-sm font-medium">
                    Doanh thu
                  </CardTitle>
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-700" />
                  </div>
                </CardHeader>
                <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
                  {loadingSummary ? (
                    <Skeleton className="h-14 w-full" />
                  ) : (
                    <div className="space-y-1 md:space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-[10px] md:text-xs">
                            Doanh thu vào:
                          </span>
                        </div>
                        <span className="text-[10px] md:text-xs font-medium text-green-600">
                          {formatCurrency(transactionSummary?.totalIncome || 0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-red-600">
                          <TrendingDown className="h-3 w-3" />
                          <span className="text-[10px] md:text-xs">
                            Doanh thu ra:
                          </span>
                        </div>
                        <span className="text-[10px] md:text-xs font-medium text-red-600">
                          {formatCurrency(
                            transactionSummary?.totalExpense || 0
                          )}
                        </span>
                      </div>

                      <div className="pt-1 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] md:text-xs font-medium">
                            Chênh lệch:
                          </span>
                          <span className="text-xs md:text-sm font-bold">
                            {formatCurrency(transactionSummary?.balance || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-3 mt-4">
              {/* Biểu đồ doanh thu 7 ngày qua */}
              <Card className="lg:col-span-2 overflow-hidden shadow-sm">
                <CardHeader className="p-2 md:p-3 lg:p-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs md:text-sm lg:text-base">
                      Doanh thu 7 ngày qua
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-[10px] md:text-xs font-normal"
                    >
                      7 ngày
                    </Badge>
                  </div>
                  <CardDescription className="text-[10px] md:text-xs">
                    Thống kê doanh thu vào và ra trong 7 ngày gần đây
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 md:p-3 pt-0 lg:p-6 lg:pt-0">
                  <div className="h-[200px] sm:h-[240px] md:h-[300px] w-full">
                    {isLoading || isLoadingRevenue ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={revenueData}
                          margin={{
                            top: 10,
                            right: 5,
                            left: 0,
                            bottom: 0,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" fontSize={10} tickMargin={5} />
                          <YAxis
                            tickFormatter={(value) =>
                              value >= 1000000
                                ? `${(value / 1000000).toFixed(0)}tr`
                                : value >= 1000
                                ? `${(value / 1000).toFixed(0)}k`
                                : value.toString()
                            }
                            fontSize={10}
                            width={35}
                          />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelStyle={{
                              fontWeight: "bold",
                              marginBottom: "5px",
                              fontSize: "12px",
                            }}
                            contentStyle={{
                              fontSize: "12px",
                            }}
                          />
                          <Legend
                            wrapperStyle={{
                              fontSize: "10px",
                              paddingTop: "10px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="nạp"
                            name="Doanh thu vào"
                            stackId="1"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="rút"
                            name="Doanh thu ra"
                            stackId="2"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Hoạt động nạp/rút tiền gần đây */}
              <Card className="overflow-hidden shadow-sm">
                <CardHeader className="p-2 md:p-3 lg:p-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs md:text-sm lg:text-base flex items-center gap-1 md:gap-2">
                      <Activity className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                      Hoạt động gần đây
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] md:text-xs"
                      onClick={() => {
                        setTransactionFilters((prev) => ({
                          ...prev,
                          limit: "20",
                        }));
                      }}
                    >
                      <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      Xem thêm
                    </Button>
                  </div>
                  <CardDescription className="text-[10px] md:text-xs mt-1">
                    Các giao dịch mới nhất trong hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {loadingTransactions ? (
                      <div className="p-2 md:p-3 lg:p-6 pt-0 space-y-3 md:space-y-4">
                        <Skeleton className="h-10 md:h-12 w-full" />
                        <Skeleton className="h-10 md:h-12 w-full" />
                        <Skeleton className="h-10 md:h-12 w-full" />
                        <Skeleton className="h-10 md:h-12 w-full" />
                        <Skeleton className="h-10 md:h-12 w-full" />
                      </div>
                    ) : recentTransactions.length > 0 ? (
                      <>
                        <div className="divide-y">
                          {currentTransactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="p-2 md:p-3 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 md:gap-3">
                                  <div
                                    className={cn(
                                      "h-7 w-7 md:h-9 md:w-9 rounded-full flex items-center justify-center",
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
                                    <p className="text-xs md:text-sm font-medium line-clamp-1 max-w-[120px] sm:max-w-full">
                                      {transaction.userName}
                                    </p>
                                    <p className="text-[10px] md:text-xs text-muted-foreground">
                                      {getTimeAgo(transaction.transactionDate)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span
                                    className={cn(
                                      "text-xs md:text-sm font-medium",
                                      transaction.isDeposit
                                        ? "text-green-600"
                                        : "text-red-600"
                                    )}
                                  >
                                    {transaction.isDeposit ? "+" : "-"}
                                    {formatCurrency(transaction.amount)}
                                  </span>
                                  <span className="text-[10px] md:text-xs text-muted-foreground">
                                    {format(
                                      transaction.transactionDate,
                                      "dd/MM/yyyy HH:mm",
                                      { locale: vi }
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[50%] sm:max-w-[70%]">
                                  {transaction.description ||
                                    (transaction.isDeposit
                                      ? "Nạp tiền vào tài khoản"
                                      : "Rút tiền từ tài khoản")}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 md:h-7 px-1.5 md:px-2 text-[10px] md:text-xs"
                                  onClick={() =>
                                    handleViewTransactionDetails(transaction)
                                  }
                                >
                                  <Eye className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
                                  <span className="text-[10px] md:text-xs">
                                    Chi tiết
                                  </span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Phân trang */}
                        {totalPages > 1 && (
                          <div className="py-2 md:py-3 border-t flex justify-center">
                            <Pagination>
                              <PaginationContent className="flex items-center gap-0 md:gap-1">
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={() =>
                                      handlePageChange(
                                        Math.max(1, currentPage - 1)
                                      )
                                    }
                                    className={cn(
                                      "h-7 w-7 md:h-8 md:w-8 p-0 md:p-2",
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
                                            onClick={() =>
                                              handlePageChange(page)
                                            }
                                            className="h-7 w-7 md:h-8 md:w-8 p-0 text-xs"
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
                                      "h-7 w-7 md:h-8 md:w-8 p-0 md:p-2",
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
                      <div className="text-center py-4 md:py-6 text-xs md:text-sm text-muted-foreground">
                        Chưa có giao dịch nào gần đây
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-3 mt-4">
              {/* Biểu đồ phân phối phòng trọ */}
              <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all">
                <CardHeader className="p-2 md:p-3 lg:p-6 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <CardTitle className="text-xs md:text-sm lg:text-base flex items-center gap-1 md:gap-2">
                    <PieChart className="h-3 w-3 md:h-4 md:w-4 text-indigo-600" />
                    Phân phối phòng trọ
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-xs">
                    Tỉ lệ phòng đã cho thuê và còn trống
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 md:p-3 pt-0 lg:p-6 lg:pt-3">
                  {isLoading || isLoadingRoomDistribution ? (
                    <Skeleton className="h-[180px] md:h-[220px] w-full" />
                  ) : (
                    <div className="flex flex-col items-center">
                      {/* Biểu đồ tròn với % ở giữa */}
                      <div className="h-[150px] w-[150px] md:h-[180px] md:w-[180px] relative mb-3 md:mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={roomDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={65}
                              innerRadius={45}
                              dataKey="value"
                              label={false}
                              strokeWidth={1}
                              stroke="#fff"
                            >
                              {roomDistribution?.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                  className="drop-shadow-sm hover:opacity-90 transition-opacity"
                                />
                              ))}
                            </Pie>
                          </RechartsPieChart>
                        </ResponsiveContainer>

                        {/* Hiển thị % phòng trống ở giữa biểu đồ */}
                        {roomDistribution && roomDistribution.length >= 2 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-xl md:text-3xl font-bold text-indigo-700">
                              {Math.round(
                                (roomDistribution[1].value /
                                  (roomDistribution[0].value +
                                    roomDistribution[1].value)) *
                                  100
                              )}
                              %
                            </div>
                            <div className="text-[10px] md:text-xs text-indigo-600">
                              Còn trống
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chú thích tùy chỉnh đẹp hơn */}
                      <div className="grid grid-cols-2 gap-2 md:gap-4 w-full">
                        {roomDistribution?.map((entry, index) => {
                          const total = roomDistribution.reduce(
                            (sum, item) => sum + item.value,
                            0
                          );
                          const percent =
                            total > 0
                              ? Math.round((entry.value / total) * 100)
                              : 0;

                          return (
                            <div
                              key={`legend-${index}`}
                              className="flex items-center gap-2 md:gap-3 p-1 md:p-2 rounded-md hover:bg-muted/40 transition-colors"
                            >
                              <div className="flex-shrink-0">
                                <div
                                  className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-white shadow-sm"
                                  style={{ backgroundColor: entry.color }}
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs md:text-sm font-medium">
                                  {entry.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs md:text-sm font-bold">
                                    {percent}%
                                  </span>
                                  <span className="text-[10px] md:text-xs text-muted-foreground">
                                    ({entry.value} phòng)
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Biểu đồ số bài đăng theo khu vực */}
              <Card className="overflow-hidden shadow-sm">
                <CardHeader className="p-2 md:p-3 lg:p-6">
                  <CardTitle className="text-xs md:text-sm lg:text-base">
                    Bài đăng theo khu vực
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-xs">
                    Top 5 khu vực có nhiều bài đăng nhất
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 md:p-3 pt-0 lg:p-6 lg:pt-0">
                  <div className="h-[150px] md:h-[180px] lg:h-[220px] w-full">
                    {isLoading || isLoadingPostsByArea ? (
                      <Skeleton className="h-full w-full" />
                    ) : postsByAreaError ? (
                      <div className="text-center py-4 md:py-6 text-xs md:text-sm text-red-500">
                        <p>
                          Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.
                        </p>
                        <p className="text-[10px] md:text-xs mt-2">
                          {postsByAreaError.message}
                        </p>
                      </div>
                    ) : normalizedPostsByArea.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={normalizedPostsByArea}
                          margin={{
                            top: 5,
                            right: 5,
                            left: 0,
                            bottom: 5,
                          }}
                          layout="vertical"
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={true}
                            vertical={false}
                            opacity={0.2}
                          />
                          <XAxis type="number" fontSize={10} tickMargin={5} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            fontSize={10}
                            width={80}
                            tick={{ fill: "#666" }}
                          />
                          <Tooltip
                            formatter={(value) => [
                              `${value} bài đăng`,
                              "Số lượng",
                            ]}
                            contentStyle={{
                              fontSize: "12px",
                            }}
                          />
                          <Legend
                            wrapperStyle={{
                              fontSize: "10px",
                              paddingTop: "5px",
                            }}
                          />
                          <Bar
                            dataKey="posts"
                            name="Số bài đăng"
                            fill="#8884d8"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                          >
                            {normalizedPostsByArea?.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-4 md:py-6 text-xs md:text-sm text-muted-foreground">
                        Chưa có dữ liệu về bài đăng theo khu vực
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Khu vực nổi bật */}
              <Card className="overflow-hidden shadow-sm">
                <CardHeader className="p-2 md:p-3 lg:p-6">
                  <CardTitle className="text-xs md:text-sm lg:text-base">
                    Khu vực nổi bật
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-xs">
                    Khu vực có lượng tìm kiếm cao nhất
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {isLoading || isLoadingPopularAreas ? (
                      <div className="p-2 md:p-3 pt-0 space-y-3 md:space-y-4">
                        <Skeleton className="h-8 md:h-12 w-full" />
                        <Skeleton className="h-8 md:h-12 w-full" />
                        <Skeleton className="h-8 md:h-12 w-full" />
                        <Skeleton className="h-8 md:h-12 w-full" />
                        <Skeleton className="h-8 md:h-12 w-full" />
                      </div>
                    ) : popularAreasData && popularAreasData.length > 0 ? (
                      popularAreasData.map((area, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 md:p-3 hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="h-6 w-6 md:h-7 md:w-7 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-[10px] md:text-xs font-medium text-blue-700">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs md:text-sm font-medium">
                                {area.name}
                              </p>
                              <p className="text-[10px] md:text-xs text-muted-foreground">
                                {area.count} phòng
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 md:py-6 text-xs md:text-sm text-muted-foreground">
                        Chưa có dữ liệu về khu vực nổi bật
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="mt-0 space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* Thẻ tổng doanh thu */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm md:text-base">
                    Tổng doanh thu
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tổng số tiền trong hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSummary ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(transactionSummary?.balance || 0)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Thẻ tổng tiền nạp */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm md:text-base">
                    Tổng tiền nạp
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tổng tiền nạp vào hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSummary ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(transactionSummary?.totalIncome || 0)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Thẻ tổng tiền rút */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm md:text-base">
                    Tổng tiền rút
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tổng tiền rút ra từ hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSummary ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(transactionSummary?.totalExpense || 0)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Thẻ thông tin phí giao dịch */}
              {/* <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm md:text-base">
                    Phí giao dịch
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Thông tin phí hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Phí đăng bài:</span>
                      <span className="font-medium">5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí giao dịch:</span>
                      <span className="font-medium">2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí rút tiền:</span>
                      <span className="font-medium">1.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card> */}
            </div>

            {/* Biểu đồ doanh thu chi tiết */}
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              <Card className="shadow-sm">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm md:text-base">
                      Doanh thu theo thời gian
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
                      <Button
                        variant={timeRange === 90 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTimeRangeChange(90)}
                      >
                        90 ngày
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full">
                    {isLoadingRevenue ? (
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
                            dataKey="nạp"
                            name="Doanh thu vào"
                            stackId="1"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="rút"
                            name="Doanh thu ra"
                            stackId="2"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bảng giao dịch gần đây */}
            <Card className="shadow-sm">
              <CardHeader className="p-2 md:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-xs md:text-sm lg:text-base flex items-center gap-1 md:gap-2">
                    <Activity className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Giao dịch gần đây
                  </CardTitle>
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 md:h-8 text-[10px] md:text-xs px-2 md:px-3"
                      onClick={handleDateFilterToggle}
                    >
                      <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      Ngày
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 md:h-8 text-[10px] md:text-xs px-2 md:px-3"
                      onClick={handleUserFilterToggle}
                    >
                      <Users className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      Người dùng
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-[10px] md:text-xs mt-1">
                  Danh sách các giao dịch tiền nạp và rút trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 md:p-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground">
                          ID
                        </th>
                        <th className="p-2 md:p-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground">
                          Người dùng
                        </th>
                        <th className="p-2 md:p-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground">
                          Loại
                        </th>
                        <th className="p-2 md:p-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground">
                          Ngày
                        </th>
                        <th className="p-2 md:p-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground">
                          Số tiền
                        </th>
                        <th className="p-2 md:p-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground">
                          Trạng thái
                        </th>
                        <th className="p-2 md:p-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loadingTransactions ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index}>
                            <td colSpan={7} className="p-2 md:p-3">
                              <Skeleton className="h-5 md:h-6 w-full" />
                            </td>
                          </tr>
                        ))
                      ) : financeCurrentTransactions.length > 0 ? (
                        financeCurrentTransactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="hover:bg-muted/30"
                          >
                            <td className="p-2 md:p-3 text-[10px] md:text-xs">
                              {transaction.id.substring(0, 6)}...
                            </td>
                            <td className="p-2 md:p-3 text-[10px] md:text-xs">
                              {transaction.userName}
                            </td>
                            <td className="p-2 md:p-3 text-[10px] md:text-xs">
                              <Badge
                                variant={
                                  transaction.isDeposit
                                    ? "default"
                                    : "destructive"
                                }
                                className={cn(
                                  "font-normal text-[10px] whitespace-nowrap",
                                  transaction.isDeposit
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                )}
                              >
                                {transaction.isDeposit
                                  ? "Nạp tiền"
                                  : "Rút tiền"}
                              </Badge>
                            </td>
                            <td className="p-2 md:p-3 text-[10px] md:text-xs whitespace-nowrap">
                              {format(
                                transaction.transactionDate,
                                "dd/MM/yyyy HH:mm",
                                { locale: vi }
                              )}
                            </td>
                            <td
                              className="p-2 md:p-3 text-[10px] md:text-xs font-medium whitespace-nowrap"
                              style={{
                                color: transaction.isDeposit
                                  ? "#10b981"
                                  : "#ef4444",
                              }}
                            >
                              {transaction.isDeposit ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="p-2 md:p-3 text-[10px] md:text-xs">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-normal"
                              >
                                Hoàn thành
                              </Badge>
                            </td>
                            <td className="p-2 md:p-3 text-[10px] md:text-xs">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 md:h-7 px-1.5 md:px-2"
                                onClick={() =>
                                  handleViewTransactionDetails(transaction)
                                }
                              >
                                <Eye className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
                                <span className="text-[10px] md:text-xs">
                                  Chi tiết
                                </span>
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-4 md:p-6 text-center text-xs md:text-sm text-muted-foreground"
                          >
                            Không có giao dịch nào gần đây
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang cho bảng tài chính */}
                {financeTotalPages > 1 && (
                  <div className="py-2 md:py-4 flex justify-center border-t">
                    <Pagination>
                      <PaginationContent className="flex items-center gap-0 md:gap-1">
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              handleFinancePageChange(
                                Math.max(1, financeCurrentPage - 1)
                              )
                            }
                            className={cn(
                              "h-7 w-7 md:h-8 md:w-8 p-0 md:p-2",
                              financeCurrentPage === 1 &&
                                "pointer-events-none opacity-50"
                            )}
                          />
                        </PaginationItem>

                        {Array.from({ length: financeTotalPages }).map(
                          (_, index) => {
                            const page = index + 1;
                            // Hiển thị các trang gần trang hiện tại
                            if (
                              page === 1 ||
                              page === financeTotalPages ||
                              (page >= financeCurrentPage - 1 &&
                                page <= financeCurrentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    isActive={page === financeCurrentPage}
                                    onClick={() =>
                                      handleFinancePageChange(page)
                                    }
                                    className="h-7 w-7 md:h-8 md:w-8 p-0 text-xs"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }

                            // Hiển thị dấu ... nếu có khoảng cách
                            if (
                              (page === 2 && financeCurrentPage > 3) ||
                              (page === financeTotalPages - 1 &&
                                financeCurrentPage < financeTotalPages - 2)
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
                              handleFinancePageChange(
                                Math.min(
                                  financeTotalPages,
                                  financeCurrentPage + 1
                                )
                              )
                            }
                            className={cn(
                              "h-7 w-7 md:h-8 md:w-8 p-0 md:p-2",
                              financeCurrentPage === financeTotalPages &&
                                "pointer-events-none opacity-50"
                            )}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regions" className="mt-0 space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {/* Bản đồ nhiệt khu vực */}
              <Card className="md:col-span-2 shadow-sm">
                <CardHeader className="p-2 md:p-4">
                  <CardTitle className="text-xs md:text-sm lg:text-base">
                    Phân bố nhà trọ theo khu vực
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-xs">
                    Hiển thị mật độ nhà trọ theo khu vực
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 md:p-4 pt-0">
                  <HeatmapRentalDistribution />
                </CardContent>
              </Card>

              {/* Thông tin khu vực */}
              <Card className="shadow-sm">
                <CardHeader className="p-2 md:p-4">
                  <CardTitle className="text-xs md:text-sm lg:text-base">
                    Khu vực nổi bật
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-xs">
                    Các khu vực có nhiều nhà trọ và bài đăng nhất
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {isLoadingPopularAreas ? (
                      <div className="p-2 md:p-3 pt-0 space-y-3 md:space-y-4">
                        <Skeleton className="h-8 md:h-12 w-full" />
                        <Skeleton className="h-8 md:h-12 w-full" />
                        <Skeleton className="h-8 md:h-12 w-full" />
                        <Skeleton className="h-8 md:h-12 w-full" />
                        <Skeleton className="h-8 md:h-12 w-full" />
                      </div>
                    ) : popularAreasData && popularAreasData.length > 0 ? (
                      popularAreasData.map((area, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 md:p-3 hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="h-6 w-6 md:h-7 md:w-7 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-[10px] md:text-xs font-medium text-blue-700">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs md:text-sm font-medium">
                                {area.name}
                              </p>
                              <p className="text-[10px] md:text-xs text-muted-foreground">
                                {area.count} phòng
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 md:py-6 text-xs md:text-sm text-muted-foreground">
                        Chưa có dữ liệu về khu vực nổi bật
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Biểu đồ phân bố bài đăng theo khu vực */}
            <Card className="shadow-sm">
              <CardHeader className="p-2 md:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-xs md:text-sm lg:text-base">
                    Phân bố bài đăng theo khu vực
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 md:h-8 text-[10px] md:text-xs px-2 md:px-3"
                  >
                    <ArrowDownCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Xuất dữ liệu
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-2 md:p-4 pt-0">
                <div className="h-[250px] sm:h-[300px] md:h-[350px] w-full">
                  {isLoadingPostsByArea ? (
                    <Skeleton className="h-full w-full" />
                  ) : postsByAreaError ? (
                    <div className="text-center py-4 md:py-6 text-xs md:text-sm text-red-500">
                      <p>
                        Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.
                      </p>
                      <p className="text-[10px] md:text-xs mt-2">
                        {postsByAreaError.message}
                      </p>
                    </div>
                  ) : normalizedPostsByArea.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={normalizedPostsByArea}
                        margin={{
                          top: 5,
                          right: 5,
                          left: 0,
                          bottom: 5,
                        }}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={true}
                          vertical={false}
                          opacity={0.2}
                        />
                        <XAxis type="number" fontSize={10} tickMargin={5} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          fontSize={10}
                          width={80}
                          tick={{ fill: "#666" }}
                        />
                        <Tooltip
                          formatter={(value) => [
                            `${value} bài đăng`,
                            "Số lượng",
                          ]}
                          contentStyle={{
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: "10px",
                            paddingTop: "5px",
                          }}
                        />
                        <Bar
                          dataKey="posts"
                          name="Số bài đăng"
                          fill="#8884d8"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        >
                          {normalizedPostsByArea?.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-4 md:py-6 text-xs md:text-sm text-muted-foreground">
                      Chưa có dữ liệu về bài đăng theo khu vực
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Thông tin chi tiết về khu vực */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card className="shadow-sm">
                <CardHeader className="p-2 md:p-4 pb-1 md:pb-2">
                  <CardTitle className="text-xs md:text-sm lg:text-base">
                    Giá trung bình
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 md:p-4">
                  <div className="flex items-center gap-1 md:gap-2">
                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                    <span className="text-base md:text-lg lg:text-xl font-bold">
                      1.800.000 ₫
                    </span>
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                    Giá trung bình phòng trọ
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog hiển thị chi tiết giao dịch */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[90vw] sm:max-w-md rounded-lg p-4 md:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              Chi tiết giao dịch
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Thông tin chi tiết về giao dịch
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-3 md:space-y-4 py-2">
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
                      {selectedTransaction.isDeposit ? "Nạp tiền" : "Rút tiền"}
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
                  <span className="text-muted-foreground">Người dùng:</span>
                  <span className="font-medium">
                    {selectedTransaction.userName}
                  </span>
                </div>

                {selectedTransaction.userEmail && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">
                      {selectedTransaction.userEmail}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ID người dùng:</span>
                  <span className="font-medium">
                    {selectedTransaction.userId}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nội dung:</span>
                  <span className="font-medium text-right">
                    {selectedTransaction.description ||
                      (selectedTransaction.isDeposit
                        ? "Nạp tiền vào tài khoản"
                        : "Rút tiền từ tài khoản")}
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

export default DashboardPage;
