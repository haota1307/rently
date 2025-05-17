"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Filter } from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CreatePostModal } from "@/features/post/components/create-post-modal";
import { EditPostModal } from "@/features/post/components/edit-post-modal";
import { PostDetailModal } from "@/features/post/components/post-detail-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useGetMyPosts,
  useDeletePost,
  useUpdatePostStatus,
} from "@/features/post/usePost";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CommonFilterLayout } from "@/features/dashboard/components/filters/common-filter-layout";
import { RentalPostStatus } from "@/schemas/post.schema";

// Custom hook debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function RentalPostsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const { mutateAsync: deletePost, isPending } = useDeletePost();
  const { mutateAsync: updateStatus, isPending: isUpdating } =
    useUpdatePostStatus();

  const debouncedSearch = useDebounce(searchInput, 300);
  const limit = 5;

  const searchTitle =
    debouncedSearch.trim() !== "" ? debouncedSearch.trim() : undefined;

  const queryParams = {
    page,
    limit,
    title: searchTitle,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
  };

  const { data, isLoading, error } = useGetMyPosts(queryParams);
  const posts = data?.data || [];
  const totalPages = data?.totalPages || 0;

  const handleViewPost = (post: any) => {
    setSelectedPost(post);
    setIsDetailModalOpen(true);
  };

  const handleEditPost = (post: any) => {
    setSelectedPost(post);
    setIsUpdateModalOpen(true);
  };

  const handleDeletePost = (post: any) => {
    setSelectedPost(post);
    setIsDeleteModalOpen(true);
  };

  const handleStatusToggle = async (postId: number, currentStatus: string) => {
    try {
      let newStatus;
      let actionText;

      if (currentStatus === RentalPostStatus.ACTIVE) {
        newStatus = RentalPostStatus.SUSPENDED;
        actionText = "tạm ngưng";
      } else if (currentStatus === RentalPostStatus.SUSPENDED) {
        newStatus = RentalPostStatus.ACTIVE;
        actionText = "kích hoạt";
      } else {
        newStatus = RentalPostStatus.ACTIVE;
        actionText = "kích hoạt";
      }

      await updateStatus({
        postId,
        body: { status: newStatus },
      });

      toast.success(`Đã ${actionText} bài đăng thành công`);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái bài đăng");
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPost || isPending) return;

    try {
      await deletePost(selectedPost.id);
      toast.success("Xóa bài đăng thành công");
    } catch (error: any) {
      toast.error(`Xóa bài đăng thất bại: ${error?.payload?.message}`);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleClearAllFilters = () => {
    setStatusFilter("ALL");
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchInput("");
    setPage(1);
  };

  const postColumns = [
    {
      id: "index",
      header: "STT",
      cell: ({ row }: any) => row.index + 1,
    },
    {
      accessorKey: "title",
      header: "Tiêu đề",
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }: any) => {
        const status = row.getValue("status");
        let statusClass = "bg-gray-100 text-gray-800";
        let statusText = "Chưa xác định";

        if (status === "ACTIVE") {
          statusClass = "bg-green-100 text-green-800";
          statusText = "Đang hoạt động";
        } else if (status === "INACTIVE") {
          statusClass = "bg-yellow-100 text-yellow-800";
          statusText = "Chưa bắt đầu/Hết hạn";
        } else if (status === "DELETED") {
          statusClass = "bg-red-100 text-red-800";
          statusText = "Đã xóa";
        } else if (status === "SUSPENDED") {
          statusClass = "bg-orange-100 text-orange-800";
          statusText = "Đã tạm ngưng";
        }

        return (
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
          >
            {statusText}
          </div>
        );
      },
    },
    {
      accessorKey: "startDate",
      header: "Ngày bắt đầu",
      cell: ({ row }: any) => {
        const date = row.getValue("startDate");
        return date ? new Date(date).toLocaleDateString("vi-VN") : "Chưa có";
      },
    },
    {
      accessorKey: "endDate",
      header: "Ngày kết thúc",
      cell: ({ row }: any) => {
        const date = row.getValue("endDate");
        return date ? new Date(date).toLocaleDateString("vi-VN") : "Chưa có";
      },
    },
    {
      accessorKey: "pricePaid",
      header: "Giá đã trả",
      cell: ({ row }: any) => {
        const price = row.getValue("pricePaid");
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price || 0);
      },
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }: any) => {
        const post = row.original;

        // Xác định nhãn nút dựa trên trạng thái
        const toggleButtonText =
          post.status === RentalPostStatus.ACTIVE
            ? "Tạm ngưng"
            : post.status === RentalPostStatus.SUSPENDED
              ? "Kích hoạt"
              : "Kích hoạt";

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
                onClick={() => navigator.clipboard.writeText(String(post.id))}
              >
                Sao chép ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewPost(post)}>
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditPost(post)}>
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusToggle(post.id, post.status)}
                disabled={
                  isUpdating || post.status === RentalPostStatus.DELETED
                }
              >
                {toggleButtonText}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeletePost(post)}
                className="text-red-600"
              >
                Xóa bài đăng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Quản lý bài đăng</h1>
      </header>

      <div className="flex flex-col justify-between m-4 gap-4">
        <CommonFilterLayout
          searchInput={searchInput}
          onSearchChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          clearAllFilters={handleClearAllFilters}
          showClearButton={
            statusFilter !== "ALL" ||
            !!startDate ||
            !!endDate ||
            searchInput.trim() !== ""
          }
          searchPlaceholder="Tìm kiếm theo tiêu đề..."
          actionButton={
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Thêm bài đăng</span>
            </Button>
          }
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
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Đang chờ</SelectItem>
                  <SelectItem value="DELETED">Đã xóa</SelectItem>
                  <SelectItem value="SUSPENDED">Đã tạm ngưng</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !startDate && !endDate && "text-muted-foreground"
                    )}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {startDate && endDate ? (
                      <span className="truncate">
                        {format(startDate, "dd/MM/yyyy", { locale: vi })} -{" "}
                        {format(endDate, "dd/MM/yyyy", { locale: vi })}
                      </span>
                    ) : (
                      <span>Lọc theo thời gian</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-2">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={startDate}
                      selected={{
                        from: startDate,
                        to: endDate,
                      }}
                      onSelect={(range) => {
                        setStartDate(range?.from);
                        setEndDate(range?.to);
                        setPage(1);
                      }}
                      numberOfMonths={1}
                      locale={vi}
                    />
                    {(startDate || endDate) && (
                      <Button
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => {
                          setStartDate(undefined);
                          setEndDate(undefined);
                          setPage(1);
                        }}
                      >
                        Xóa bộ lọc thời gian
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
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
            columns={postColumns}
            data={posts}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}

        {/* Các modal */}
        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        {selectedPost && (
          <>
            <EditPostModal
              isOpen={isUpdateModalOpen}
              onClose={() => setIsUpdateModalOpen(false)}
              post={selectedPost}
            />

            <PostDetailModal
              isOpen={isDetailModalOpen}
              onClose={() => setIsDetailModalOpen(false)}
              postId={selectedPost.id}
            />

            <ConfirmModal
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              onConfirm={confirmDelete}
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa bài đăng này không? Sau khi xóa, dữ liệu sẽ không thể khôi phục lại."
              confirmText="Xóa"
              cancelText="Hủy"
            />
          </>
        )}
      </div>
    </SidebarInset>
  );
}
