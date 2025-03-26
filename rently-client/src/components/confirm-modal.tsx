"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận xóa",
  description = "Bạn có chắc chắn muốn xóa nhà trọ này không? Sau khi xóa, dữ liệu sẽ không thể khôi phục.",
  confirmText = "Xóa",
  cancelText = "Hủy",
}: ConfirmModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="lg:max-w-[500px] max-w-[400px] p-0 rounded-lg bg-white dark:bg-gray-800 border-none">
        <div className="p-6 space-y-4">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-300">
            {description}
          </DialogDescription>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full text-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className="w-full bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-800"
            >
              {confirmText}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
