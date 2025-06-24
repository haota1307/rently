"use client";

import { Button } from "@/components/ui/button";
import { useDeleteRoom } from "@/features/rooms/useRoom";

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
};

export function DeleteRoomConfirm({
  open,
  onOpenChange,
  roomId,
  roomTitle,
}: DeleteRoomConfirmProps) {
  const { mutateAsync: deleteRoom, isPending } = useDeleteRoom();

  const handleDelete = async () => {
    if (!roomId) return;

    try {
      await deleteRoom(roomId);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error deleting room:", err);
      // Hiển thị thông báo lỗi từ server
      const errorMessage =
        err?.response?.data?.message ||
        "Không thể xóa phòng trọ. Vui lòng thử lại sau.";

      // Cập nhật dialog để hiển thị lỗi thay vì đóng nó
      const dialogContent = document.querySelector(
        '[role="dialog"] [role="document"]'
      );
      if (dialogContent) {
        const errorElement = document.createElement("div");
        errorElement.className =
          "mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm";
        errorElement.textContent = errorMessage;

        // Xóa thông báo lỗi cũ nếu có
        const oldError = dialogContent.querySelector(".bg-red-50");
        if (oldError) oldError.remove();

        // Thêm thông báo lỗi mới
        dialogContent.appendChild(errorElement);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa phòng trọ{" "}
            <span className="font-medium">{roomTitle || `#${roomId}`}</span>?
            Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
