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

export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  roleId: number;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  createdAt: Date;
  updatedAt: Date;
}

interface UserColumnsProps {
  onDelete: (userId: number) => void;
  onBlock: (user: User) => void;
  onUnblock: (userId: number) => void;
  onEdit: (user: User) => void;
  onView: (user: User) => void;
}

export const userColumns = ({
  onDelete,
  onBlock,
  onUnblock,
  onEdit,
  onView,
}: UserColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: "Tên",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return (
        <div className="font-medium truncate max-w-[120px] md:max-w-[200px]">
          {name}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return (
        <div className="truncate max-w-[120px] md:max-w-[200px]">{email}</div>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "SĐT",
    cell: ({ row }) => {
      const phone = row.getValue("phoneNumber") as string;
      return <div className="truncate max-w-[100px]">{phone || "N/A"}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <div
          className={`inline-flex items-center px-1.5 md:px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : status === "INACTIVE"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status === "ACTIVE"
            ? "Hoạt động"
            : status === "INACTIVE"
            ? "Không HĐ"
            : "Bị khóa"}
        </div>
      );
    },
  },
  {
    accessorKey: "roleId",
    header: "Vai trò",
    cell: ({ row }) => {
      const roleId = row.getValue("roleId");

      let bgColor = "bg-blue-100 text-blue-800";
      let roleText = "Người dùng";

      if (roleId === 1) {
        bgColor = "bg-purple-100 text-purple-800";
        roleText = "Admin";
      } else if (roleId === 2) {
        bgColor = "bg-green-100 text-green-800";
        roleText = "Chủ trọ";
      }

      return (
        <div
          className={`inline-flex items-center px-1.5 md:px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}
        >
          {roleText}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="whitespace-nowrap text-xs md:text-sm">
          {date.toLocaleDateString("vi-VN")}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const user = row.original;
      const isBlocked = user.status === "BLOCKED";

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id.toString())}
            >
              Sao chép ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onView(user)}>
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(user)}>
              Chỉnh sửa
            </DropdownMenuItem>
            {isBlocked ? (
              <DropdownMenuItem
                className="text-green-600"
                onClick={() => onUnblock(user.id)}
              >
                Mở khóa tài khoản
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-orange-600"
                onClick={() => onBlock(user)}
              >
                Khóa tài khoản
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(user.id)}
            >
              Xóa tài khoản
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
