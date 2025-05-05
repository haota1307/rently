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
import { ArrowUpDown, MoreHorizontal, User } from "lucide-react";
import { formatPrice } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Transaction } from "@/schemas/payment.schema";

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
    accessorKey: "userName",
    header: "Người dùng",
    cell: ({ row }) => {
      const userName = row.getValue("userName") as string;
      const userEmail = row.original.userEmail;
      const userPhone = row.original.userPhone;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{userName}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="text-sm">
                  <b>Email:</b> {userEmail || "Không có"}
                </p>
                <p className="text-sm">
                  <b>SĐT:</b> {userPhone || "Không có"}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
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
        case "SUCCESS":
          statusText = "Hoàn thành";
          statusClass = "bg-green-100 text-green-800";
          break;
        case "PENDING":
          statusText = "Đang xử lý";
          statusClass = "bg-yellow-100 text-yellow-800";
          break;
        case "FAILED":
          statusText = "Thất bại";
          statusClass = "bg-red-100 text-red-800";
          break;
        case "CANCELED":
          statusText = "Đã hủy";
          statusClass = "bg-gray-100 text-gray-800";
          break;
        default:
          statusText = status || "Không xác định";
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
