"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Crown,
  Users,
  TrendingUp,
  Calendar,
  Eye,
  Play,
  Pause,
  Ban,
  RefreshCw,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Settings,
  Tag,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  getSubscriptionStatusText,
  getSubscriptionStatusColor,
} from "@/features/landlord-subscription/useSubscription";
import {
  useAdminSubscriptions,
  useAdminSubscriptionStats,
  useAdminSuspendSubscription,
  useAdminReactivateSubscription,
  useAdminCancelSubscription,
} from "@/features/landlord-subscription/useAdminSubscription";
import { AdminSubscriptionFilters } from "@/features/landlord-subscription/admin-subscription.api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

// Helper function to format date
const formatDateString = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

export default function AdminSubscriptionPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Prepare filters for API
  const filters: AdminSubscriptionFilters = useMemo(
    () => ({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [currentPage, itemsPerPage, searchTerm, statusFilter]
  );

  // API Hooks
  const {
    data: subscriptionsData,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
  } = useAdminSubscriptions(filters);
  const { data: statsData, isLoading: statsLoading } =
    useAdminSubscriptionStats();

  // Mutation hooks
  const suspendMutation = useAdminSuspendSubscription();
  const reactivateMutation = useAdminReactivateSubscription();
  const cancelMutation = useAdminCancelSubscription();

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle subscription actions
  const handleSuspendSubscription = (
    subscriptionId: number,
    reason?: string
  ) => {
    suspendMutation.mutate({ subscriptionId, reason });
  };

  const handleReactivateSubscription = (subscriptionId: number) => {
    reactivateMutation.mutate(subscriptionId);
  };

  const handleCancelSubscription = (
    subscriptionId: number,
    reason?: string
  ) => {
    cancelMutation.mutate({ subscriptionId, reason });
  };

  // Loading states
  if (subscriptionsError) {
    return (
      <SidebarInset>
        <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-2 md:px-4 w-full sticky top-0 bg-background z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 " />
          <h1 className="text-base md:text-lg font-semibold">
            Quản lý Subscription
          </h1>
        </header>

        <div className="p-2 md:p-4 space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Không thể tải dữ liệu
              </h3>
              <p className="text-gray-600 text-center">
                Có lỗi xảy ra khi tải danh sách subscription. Vui lòng thử lại
                sau.
              </p>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-2 md:px-4 w-full sticky top-0 bg-background z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-base md:text-lg font-semibold">
          Quản lý Subscription
        </h1>
        <div className="ml-auto">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </header>

      <div className="p-2 md:p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng Subscription
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {statsData?.totalSubscriptions || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Đang Hoạt Động
              </CardTitle>
              <Crown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {statsData?.activeSubscriptions || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hết Hạn</CardTitle>
              <Calendar className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-red-600">
                  {statsData?.expiredSubscriptions || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doanh Thu</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(statsData?.monthlyRevenue || 0)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quản lý gói subscription */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Quản lý gói Subscription
            </CardTitle>
            <CardDescription>
              Tùy chỉnh các gói subscription và giá tiền
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground mb-4">
              Thiết lập các gói subscription cho landlord, thêm mới hoặc chỉnh
              sửa giá tiền và thời hạn của gói.
            </p>
            <Button
              onClick={() =>
                (window.location.href = "/quan-ly/subscription-settings/plans")
              }
              variant="default"
              className="w-full"
            >
              <Tag className="mr-2 h-4 w-4" />
              Quản lý gói
            </Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo tên, email..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 items-center w-full md:w-auto">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={statusFilter}
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                      <SelectItem value="EXPIRED">Hết hạn</SelectItem>
                      <SelectItem value="SUSPENDED">Tạm dừng</SelectItem>
                      <SelectItem value="CANCELED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Loại gói</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Ngày kết thúc</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptionsLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : subscriptionsData?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Không có dữ liệu subscription nào
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptionsData?.data?.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>{subscription.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {subscription.user?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {subscription.user?.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getSubscriptionStatusColor(
                            subscription.status
                          )}
                        >
                          {getSubscriptionStatusText(subscription.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {subscription.isFreeTrial ? (
                          <Badge variant="outline" className="border-green-500">
                            Dùng thử
                          </Badge>
                        ) : (
                          subscription.planType
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateString(subscription.startDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateString(subscription.endDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatPrice(Number(subscription.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Mở menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <AlertDialog>
                                <AlertDialogTrigger className="flex w-full cursor-pointer items-center px-2 py-1.5 text-sm">
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>Chi tiết</span>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Chi tiết Subscription
                                    </AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="text-sm font-medium">
                                        ID:
                                      </div>
                                      <div>{subscription.id}</div>
                                      <div className="text-sm font-medium">
                                        Người dùng:
                                      </div>
                                      <div>{subscription.user?.name}</div>
                                      <div className="text-sm font-medium">
                                        Email:
                                      </div>
                                      <div>{subscription.user?.email}</div>
                                      <div className="text-sm font-medium">
                                        Trạng thái:
                                      </div>
                                      <div>
                                        <Badge
                                          variant="outline"
                                          className={getSubscriptionStatusColor(
                                            subscription.status
                                          )}
                                        >
                                          {getSubscriptionStatusText(
                                            subscription.status
                                          )}
                                        </Badge>
                                      </div>
                                      <div className="text-sm font-medium">
                                        Loại gói:
                                      </div>
                                      <div>
                                        {subscription.isFreeTrial
                                          ? "Dùng thử"
                                          : subscription.planType}
                                      </div>
                                      <div className="text-sm font-medium">
                                        Ngày bắt đầu:
                                      </div>
                                      <div>
                                        {formatDateString(
                                          subscription.startDate
                                        )}
                                      </div>
                                      <div className="text-sm font-medium">
                                        Ngày kết thúc:
                                      </div>
                                      <div>
                                        {formatDateString(subscription.endDate)}
                                      </div>
                                      <div className="text-sm font-medium">
                                        Giá:
                                      </div>
                                      <div>
                                        {formatPrice(
                                          Number(subscription.amount)
                                        )}
                                      </div>
                                      <div className="text-sm font-medium">
                                        Auto Renew:
                                      </div>
                                      <div>
                                        {subscription.autoRenew ? "Bật" : "Tắt"}
                                      </div>
                                      <div className="text-sm font-medium">
                                        Ngày tạo:
                                      </div>
                                      <div>
                                        {formatDateString(
                                          subscription.createdAt
                                        )}
                                      </div>
                                      <div className="text-sm font-medium">
                                        Cập nhật lần cuối:
                                      </div>
                                      <div>
                                        {formatDateString(
                                          subscription.updatedAt
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Đóng</AlertDialogCancel>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuItem>
                            {subscription.status === "ACTIVE" && (
                              <DropdownMenuItem asChild>
                                <AlertDialog>
                                  <AlertDialogTrigger className="flex w-full cursor-pointer items-center px-2 py-1.5 text-sm text-amber-600">
                                    <Pause className="mr-2 h-4 w-4" />
                                    <span>Tạm dừng</span>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Tạm dừng subscription
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bạn có chắc chắn muốn tạm dừng
                                        subscription này?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleSuspendSubscription(
                                            subscription.id
                                          )
                                        }
                                      >
                                        Xác nhận
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuItem>
                            )}
                            {subscription.status === "SUSPENDED" && (
                              <DropdownMenuItem asChild>
                                <AlertDialog>
                                  <AlertDialogTrigger className="flex w-full cursor-pointer items-center px-2 py-1.5 text-sm text-green-600">
                                    <Play className="mr-2 h-4 w-4" />
                                    <span>Kích hoạt lại</span>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Kích hoạt lại subscription
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bạn có chắc chắn muốn kích hoạt lại
                                        subscription này?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleReactivateSubscription(
                                            subscription.id
                                          )
                                        }
                                      >
                                        Xác nhận
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuItem>
                            )}
                            {subscription.status !== "CANCELED" && (
                              <DropdownMenuItem asChild>
                                <AlertDialog>
                                  <AlertDialogTrigger className="flex w-full cursor-pointer items-center px-2 py-1.5 text-sm text-red-600">
                                    <Ban className="mr-2 h-4 w-4" />
                                    <span>Hủy</span>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Hủy subscription
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bạn có chắc chắn muốn hủy subscription
                                        này?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleCancelSubscription(
                                            subscription.id
                                          )
                                        }
                                      >
                                        Xác nhận
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {subscriptionsData && subscriptionsData.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        handlePageChange(currentPage - 1);
                      }
                    }}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {Array.from({ length: subscriptionsData.totalPages }).map(
                  (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(i + 1);
                        }}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < subscriptionsData.totalPages) {
                        handlePageChange(currentPage + 1);
                      }
                    }}
                    className={
                      currentPage === subscriptionsData.totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </SidebarInset>
  );
}
