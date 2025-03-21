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
import { Room } from "@/app/(dashboard)/quan-ly/phong-tro/page";

export const roomColumns: ColumnDef<Room>[] = [
  {
    accessorKey: "title",
    header: "Tiêu đề",
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
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
      const area = row.getValue("area") as number;
      return `${area} m²`;
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let statusText = "";
      let statusClass = "";

      switch (status) {
        case "available":
          statusText = "Còn trống";
          statusClass = "bg-green-100 text-green-800";
          break;
        case "rented":
          statusText = "Đã thuê";
          statusClass = "bg-blue-100 text-blue-800";
          break;
        case "maintenance":
          statusText = "Bảo trì";
          statusClass = "bg-yellow-100 text-yellow-800";
          break;
        default:
          statusText = status;
          statusClass = "bg-gray-100 text-gray-800";
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
    accessorKey: "landlord",
    header: "Chủ trọ",
  },
  {
    accessorKey: "createdAt",
    header: "Ngày đăng",
  },
  {
    id: "actions",
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
              onClick={() => navigator.clipboard.writeText(room.id)}
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
