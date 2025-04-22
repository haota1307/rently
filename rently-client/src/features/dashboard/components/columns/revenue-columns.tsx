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
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Transaction } from "@/app/(dashboard)/(admin)/quan-ly/doanh-thu/page";

export const revenueColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "transactionId",
    header: "Mã giao dịch",
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ngày
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Số tiền
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return formatPrice(amount);
    },
  },
  {
    accessorKey: "type",
    header: "Loại giao dịch",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      let typeText = "";

      switch (type) {
        case "subscription":
          typeText = "Đăng ký gói";
          break;
        case "listing":
          typeText = "Đăng tin";
          break;
        case "income":
          typeText = "Tiền vào";
          break;
        case "expense":
          typeText = "Tiền ra";
          break;
        default:
          typeText = type;
      }

      return typeText;
    },
  },
  {
    accessorKey: "user",
    header: "Người dùng",
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let statusText = "";
      let statusClass = "";

      switch (status) {
        case "completed":
          statusText = "Hoàn thành";
          statusClass = "bg-green-100 text-green-800";
          break;
        case "pending":
          statusText = "Đang xử lý";
          statusClass = "bg-yellow-100 text-yellow-800";
          break;
        case "failed":
          statusText = "Thất bại";
          statusClass = "bg-red-100 text-red-800";
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
    accessorKey: "source",
    header: "Nguồn",
    cell: ({ row }) => {
      const source = row.getValue("source") as string;
      return source || "Rently";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original;

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
              onClick={() => navigator.clipboard.writeText(transaction.id)}
            >
              Sao chép ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
            <DropdownMenuItem>In hóa đơn</DropdownMenuItem>
            {transaction.status === "pending" && (
              <DropdownMenuItem className="text-green-600">
                Xác nhận
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
