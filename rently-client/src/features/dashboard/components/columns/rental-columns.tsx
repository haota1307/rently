"use client";

import React, { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { ConfirmModal } from "@/components/confirm-modal";
import { useDeleteRental } from "@/features/rental/useRental";
import { toast } from "sonner";
import { RentalType } from "@/schemas/rental.schema";
import { UpdateRentalModal } from "@/features/rental/component/update-rental-modal";
import { RentalDetailModal } from "@/features/rental/component/rental-detail-modal";

function RentalActions({ rental }: { rental: RentalType }) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { mutateAsync: deleteRental, isPending } = useDeleteRental();

  const handleDelete = async () => {
    if (isPending) return;

    try {
      await deleteRental(rental.id);
      toast.success("Xóa nhà trọ thành công");
    } catch (error: any) {
      toast.error(`Xóa nhà trọ thất bại: ${error?.payload?.message}`);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
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
            onClick={() => navigator.clipboard.writeText(String(rental.id))}
          >
            Sao chép ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDetailModalOpen(true)}>
            Xem chi tiết
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsUpdateModalOpen(true)}>
            Chỉnh sửa
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-red-600"
          >
            Xóa nhà trọ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa nhà trọ này không? Sau khi xóa, dữ liệu sẽ không thể khôi phục lại."
        confirmText="Xóa"
        cancelText="Hủy"
      />

      <UpdateRentalModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        rental={rental}
      />

      <RentalDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        rental={rental}
      />
    </>
  );
}

export const rentalColumns: ColumnDef<any>[] = [
  {
    id: "index",
    header: "STT",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "title",
    header: "Tiêu đề",
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return description && description.length > 50
        ? `${description.substring(0, 50)}...`
        : description;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      const dateStr = row.getValue("createdAt") as string;
      return format(new Date(dateStr), "dd/MM/yyyy");
    },
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => {
      const rental = row.original;
      return <RentalActions rental={rental} />;
    },
  },
];
