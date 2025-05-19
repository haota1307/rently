"use client";

import { useState, useEffect } from "react";
import { useGetRentalRequests } from "@/features/rental-request/useRentalRequest";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { RentalRequestStatus } from "@/schemas/rental-request.schema";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  Check,
  X,
  AlertCircle,
  Ban,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RentalRequestDetailDialog } from "@/features/rental-request/components/rental-request-detail-dialog";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CommonFilterLayout } from "@/features/dashboard/components/filters/common-filter-layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/useDebounce";

export default function RentalRequestsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 300);
  const limit = 10;

  const { data, isLoading, error } = useGetRentalRequests({
    page,
    limit,
    status:
      statusFilter === "ALL"
        ? undefined
        : (statusFilter as RentalRequestStatus),
    role: "LANDLORD", // Chỉ lấy các yêu cầu mà người dùng là landlord
  });

  const requests = data?.data || [];
  const totalPages = data?.totalPages || 0;

  // Hàm xử lý khi click vào xem chi tiết
  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  // Hàm lấy trạng thái hiển thị và màu sắc
  const getStatusBadge = (status: string) => {
    switch (status) {
      case RentalRequestStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Đang chờ xử lý
          </Badge>
        );
      case RentalRequestStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Check className="h-3.5 w-3.5 mr-1" />
            Đã chấp nhận
          </Badge>
        );
      case RentalRequestStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <X className="h-3.5 w-3.5 mr-1" />
            Đã từ chối
          </Badge>
        );
      case RentalRequestStatus.CANCELED:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            <Ban className="h-3.5 w-3.5 mr-1" />
            Đã hủy
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleClearAllFilters = () => {
    setStatusFilter("ALL");
    setSearchInput("");
    setPage(1);
  };

  const requestColumns = [
    {
      id: "index",
      header: "STT",
      cell: ({ row }: any) => (page - 1) * limit + row.index + 1,
    },
    {
      accessorKey: "post.title",
      header: "Tiêu đề tin đăng",
      cell: ({ row }: any) => (
        <div className="max-w-[280px] truncate font-medium">
          {row.original.post?.title || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "tenant.name",
      header: "Người thuê",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">
            {row.original.tenant?.name || "N/A"}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.tenant?.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "expectedMoveDate",
      header: "Ngày chuyển vào",
      cell: ({ row }: any) => {
        const date = row.getValue("expectedMoveDate");
        return date
          ? format(new Date(date), "dd/MM/yyyy", { locale: vi })
          : "N/A";
      },
    },
    {
      accessorKey: "duration",
      header: "Thời hạn thuê",
      cell: ({ row }: any) => `${row.getValue("duration")} tháng`,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }: any) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }: any) => {
        const request = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(String(request.id))
                }
              >
                Sao chép ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewRequest(request)}>
                Xem chi tiết
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Render loading state
  if (isLoading) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Quản lý yêu cầu thuê phòng</h1>
        </header>
        <div className="flex flex-col justify-between m-4 gap-4">
          <div className="py-8 text-center text-gray-500">Đang tải...</div>
        </div>
      </SidebarInset>
    );
  }

  // Render error state
  if (error) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Quản lý yêu cầu thuê phòng</h1>
        </header>
        <div className="flex flex-col justify-between m-4 gap-4">
          <div className="py-8 text-center text-red-500">
            Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Quản lý yêu cầu thuê phòng</h1>
      </header>

      <div className="flex flex-col justify-between m-4 gap-4">
        <CommonFilterLayout
          searchInput={searchInput}
          onSearchChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          clearAllFilters={handleClearAllFilters}
          showClearButton={statusFilter !== "ALL" || searchInput.trim() !== ""}
          searchPlaceholder="Tìm kiếm yêu cầu thuê..."
          filterControls={
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value={RentalRequestStatus.PENDING}>
                    Đang chờ xử lý
                  </SelectItem>
                  <SelectItem value={RentalRequestStatus.APPROVED}>
                    Đã chấp nhận
                  </SelectItem>
                  <SelectItem value={RentalRequestStatus.REJECTED}>
                    Đã từ chối
                  </SelectItem>
                  <SelectItem value={RentalRequestStatus.CANCELED}>
                    Đã hủy
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Đang tải...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">
            Đã xảy ra lỗi khi tải dữ liệu
          </div>
        ) : (
          <DataTable
            columns={requestColumns}
            data={requests}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyMessage="Không tìm thấy yêu cầu thuê nào"
          />
        )}

        {/* Dialog chi tiết yêu cầu thuê */}
        {selectedRequest && (
          <RentalRequestDetailDialog
            isOpen={isDetailDialogOpen}
            onClose={() => setIsDetailDialogOpen(false)}
            rentalRequest={selectedRequest}
          />
        )}
      </div>
    </SidebarInset>
  );
}
