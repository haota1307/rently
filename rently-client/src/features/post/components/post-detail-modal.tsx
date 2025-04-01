"use client";

import { Button } from "@/components/ui/button";
import { useGetPostDetail } from "@/features/post/usePost";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type PostDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
};

export function PostDetailModal({
  isOpen,
  onClose,
  postId,
}: PostDetailModalProps) {
  const { data: post, isLoading, error } = useGetPostDetail(postId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chi tiết bài đăng</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về bài đăng cho thuê phòng trọ
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-4 text-center">Đang tải dữ liệu bài đăng...</div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">
            Không thể tải thông tin bài đăng. Vui lòng thử lại sau.
          </div>
        ) : post ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Tiêu đề:</div>
              <div className="text-sm">{post.title}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Mô tả:</div>
              <div className="text-sm">{post.description}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Phòng trọ:</div>
              <div className="text-sm">
                {post.room?.title || `Phòng #${post.roomId}`}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Giá đăng bài:</div>
              <div className="text-sm">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(post.pricePaid || 0)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Ngày bắt đầu:</div>
              <div className="text-sm">
                {post.startDate
                  ? new Date(post.startDate).toLocaleDateString("vi-VN")
                  : "Chưa có"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Ngày kết thúc:</div>
              <div className="text-sm">
                {post.endDate
                  ? new Date(post.endDate).toLocaleDateString("vi-VN")
                  : "Chưa có"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Trạng thái:</div>
              <div className="text-sm">
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    post.status === "active"
                      ? "bg-green-100 text-green-800"
                      : post.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : post.status === "expired"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {post.status === "active"
                    ? "Đang hoạt động"
                    : post.status === "pending"
                    ? "Đang chờ duyệt"
                    : post.status === "expired"
                    ? "Hết hạn"
                    : "Chưa xác định"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Ngày tạo:</div>
              <div className="text-sm">
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString("vi-VN")
                  : "Không có"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Cập nhật lần cuối:</div>
              <div className="text-sm">
                {post.updatedAt
                  ? new Date(post.updatedAt).toLocaleDateString("vi-VN")
                  : "Không có"}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            Không tìm thấy thông tin bài đăng
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
