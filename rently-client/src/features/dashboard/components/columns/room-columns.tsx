"use client";

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
import { formatPrice } from "@/lib/utils";
import { RoomType } from "@/schemas/room.schema";

export const roomColumns: ColumnDef<RoomType>[] = [
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
    id: "rental",
    header: "Nhà trọ",
    cell: ({ row }) => {
      const rental = row.original.rentalId;
      return rental ? rental : "Không có";
    },
  },
  {
    accessorKey: "price",
    header: "Giá thuê",
    cell: ({ row }) => {
      const price = row.getValue("price") as number;
      return formatPrice(price);
    },
  },
  {
    accessorKey: "area",
    header: "Diện tích",
    cell: ({ row }) => {
      const areaStr = row.getValue("area") as string;
      const area = parseFloat(areaStr);
      return `${area} m²`;
    },
  },
  {
    accessorFn: (row) => row.isAvailable,
    id: "status",
    header: "Trạng thái",
    cell: ({ getValue }) => {
      const isAvailable = getValue() as boolean;
      const statusText = isAvailable ? "Còn trống" : "Đã thuê";
      const statusClass = isAvailable
        ? "bg-green-100 text-green-800"
        : "bg-blue-100 text-blue-800";
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
    accessorKey: "createdAt",
    header: "Ngày đăng",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date | null;
      if (!createdAt) return "";
      return new Date(createdAt).toLocaleDateString();
    },
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => {
      const room = row.original;
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
              onClick={() => navigator.clipboard.writeText(room.id.toString())}
            >
              Sao chép ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
            <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Xóa</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
