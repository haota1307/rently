"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
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
import { useGetMyPosts, useDeletePost } from "@/features/post/usePost";

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const { mutateAsync: deletePost, isPending } = useDeletePost();

  const debouncedSearch = useDebounce(searchInput, 300);
  const limit = 5;

  const searchTitle =
    debouncedSearch.trim() !== "" ? debouncedSearch.trim() : undefined;

  const { data, isLoading, error } = useGetMyPosts({
    page,
    limit,
    title: searchTitle,
  });
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

        if (status === "active") {
          statusClass = "bg-green-100 text-green-800";
          statusText = "Đang hoạt động";
        } else if (status === "pending") {
          statusClass = "bg-yellow-100 text-yellow-800";
          statusText = "Đang chờ duyệt";
        } else if (status === "expired") {
          statusClass = "bg-red-100 text-red-800";
          statusText = "Hết hạn";
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
        <div className="flex items-center justify-between">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Thêm bài đăng</span>
          </Button>

          <div className="flex items-center">
            <Input
              placeholder="Tìm kiếm theo tiêu đề..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="max-w-sm"
            />
          </div>
        </div>

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
            searchKey="title"
            searchPlaceholder="Tìm kiếm theo tiêu đề..."
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
