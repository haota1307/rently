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
    } catch (err) {
      console.error("Error deleting room:", err);
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
