"use client";

import { Button } from "@/components/ui/button";
import { useDeleteRoom } from "@/features/rooms/useRoom";
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteRoomConfirmProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number | null;
  roomTitle?: string;
  isRented?: boolean;
  hasActivePost?: boolean;
  postTitle?: string;
};

export function DeleteRoomConfirm({
  open,
  onOpenChange,
  roomId,
  roomTitle,
  isRented = false,
  hasActivePost = false,
  postTitle,
}: DeleteRoomConfirmProps) {
  const { mutateAsync: deleteRoom, isPending } = useDeleteRoom();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!roomId) return;
    setError(null);

    try {
      await deleteRoom(roomId);
      onOpenChange(false);
      toast.success("Xóa phòng trọ thành công");
    } catch (err: any) {
      console.error("Error deleting room:", err);
      setError(err?.payload?.message || "Không thể xóa phòng trọ");
      toast.error(err?.payload?.message || "Không thể xóa phòng trọ");
    }
  };

  // Kiểm tra nếu phòng đang được thuê hoặc có bài đăng
  const cannotDelete = isRented || hasActivePost;
  const reasonText = isRented
    ? "Phòng đang được thuê"
    : hasActivePost
      ? `Phòng đang có bài đăng "${postTitle || "cho thuê"}" còn hiệu lực`
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogDescription>
            {!cannotDelete ? (
              <>
                Bạn có chắc chắn muốn xóa phòng trọ{" "}
                <span className="font-medium">{roomTitle || `#${roomId}`}</span>
                ? Hành động này không thể hoàn tác.
              </>
            ) : (
              <>
                <span className="text-red-500 font-medium">
                  Không thể xóa phòng trọ
                </span>{" "}
                <span className="font-medium">{roomTitle || `#${roomId}`}</span>{" "}
                vì: {reasonText}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {cannotDelete ? "Đóng" : "Hủy"}
          </Button>
          {!cannotDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
