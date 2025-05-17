"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, MoreHorizontal } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  useGetPosts,
  useUpdatePostStatus,
  useDeletePost,
} from "@/features/post/usePost";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice, createPostSlug } from "@/lib/utils";
import Link from "next/link";
import { RentalPostStatus } from "@/schemas/post.schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export default function PostsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Gọi API để lấy danh sách bài đăng
  const {
    data: postsData,
    isLoading,
    refetch,
  } = useGetPosts({
    page: currentPage,
    limit: 10,
    title: debouncedSearchQuery || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  // Mutation hooks
  const { mutateAsync: updateStatus, isPending: isUpdating } =
    useUpdatePostStatus();
  const { mutateAsync: deletePost, isPending: isDeleting } = useDeletePost();

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleViewPost = (postId: number, title: string) => {
    const slug = createPostSlug(title, postId);
    window.open(`/bai-dang/${slug}`, "_blank");
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

      // Refetch dữ liệu ngay để cập nhật UI
      await refetch();

      toast.success(`Đã ${actionText} bài đăng thành công`);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái bài đăng");
      console.error(error);
    }
  };

  const confirmDelete = (postId: number) => {
    setDeletingPostId(postId);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingPostId) return;

    try {
      await deletePost(deletingPostId);
      toast.success("Đã xóa bài đăng thành công");
      setConfirmDeleteOpen(false);
      setDeletingPostId(null);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa bài đăng");
      console.error(error);
    }
  };

  const handleDeleteCancelled = () => {
    setConfirmDeleteOpen(false);
    setDeletingPostId(null);
  };

  const postColumns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }: any) => (
        <span className="font-mono">{row.getValue("id")}</span>
      ),
      size: 80,
    },
    {
      accessorKey: "title",
      header: "Tiêu đề",
      cell: ({ row }: any) => (
        <div className="max-w-[280px] truncate" title={row.getValue("title")}>
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }: any) => {
        const status = row.getValue("status");
        let badgeVariant:
          | "default"
          | "secondary"
          | "destructive"
          | "outline"
          | "warning" = "outline";
        let statusText = "Chưa xác định";

        if (status === RentalPostStatus.ACTIVE) {
          badgeVariant = "default";
          statusText = "Đang hoạt động";
        } else if (status === RentalPostStatus.INACTIVE) {
          badgeVariant = "secondary";
          statusText = "Chưa bắt đầu/Hết hạn";
        } else if (status === RentalPostStatus.DELETED) {
          badgeVariant = "destructive";
          statusText = "Đã xóa";
        } else if (status === RentalPostStatus.SUSPENDED) {
          badgeVariant = "warning";
          statusText = "Đã tạm ngưng";
        }

        return <Badge variant={badgeVariant}>{statusText}</Badge>;
      },
      size: 140,
    },
    {
      accessorKey: "room.price",
      header: "Giá thuê",
      cell: ({ row }: any) => {
        const data = row.original;
        const price = data.room?.price;
        return price ? formatPrice(price) : "N/A";
      },
      size: 140,
    },
    {
      accessorKey: "landlord.name",
      header: "Chủ nhà",
      cell: ({ row }: any) => {
        const data = row.original;
        return data.landlord?.name || "N/A";
      },
    },
    {
      accessorKey: "createdAt",
      header: "Ngày đăng",
      cell: ({ row }: any) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString("vi-VN");
      },
      size: 120,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => {
        const post = row.original;
        const isProcessing = isUpdating && post.id === deletingPostId;

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
              <DropdownMenuItem
                onClick={() => handleViewPost(post.id, post.title)}
              >
                Xem chi tiết
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
                className="text-destructive"
                onClick={() => confirmDelete(post.id)}
                disabled={isDeleting}
              >
                Xóa bài đăng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 50,
    },
  ];

  return (
    <>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 " />
          <h1 className="text-lg font-semibold">Quản lý bài viết</h1>
        </header>

        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 md:max-w-md">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm theo tiêu đề..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Trạng thái:
                    </span>
                    <Select
                      value={statusFilter}
                      onValueChange={handleStatusFilterChange}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Tất cả trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                        <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                        <SelectItem value="INACTIVE">
                          Chưa bắt đầu/Hết hạn
                        </SelectItem>
                        <SelectItem value="SUSPENDED">Đã tạm ngưng</SelectItem>
                        <SelectItem value="DELETED">Đã xóa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={postColumns as ColumnDef<any>[]}
            data={postsData?.data || []}
            currentPage={currentPage}
            totalPages={postsData?.totalPages || 1}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </div>
      </SidebarInset>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bài đăng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài đăng này không? Hành động này không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancelled}
              disabled={isDeleting}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Đang xóa..." : "Xóa bài đăng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
