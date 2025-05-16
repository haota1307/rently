"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Contact } from "../contact.api";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { ContactActions } from "./contact-actions";
import { MoreHorizontal, CheckCircle, XCircle, Clock } from "lucide-react";

export const contactColumns: ColumnDef<Contact>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      return <div className="font-medium">#{row.getValue("id")}</div>;
    },
  },
  {
    accessorKey: "fullName",
    header: "Họ tên",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("fullName")}</div>;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return (
        <div className="text-muted-foreground text-xs">
          {row.getValue("email")}
        </div>
      );
    },
  },
  {
    accessorKey: "subject",
    header: "Tiêu đề",
    cell: ({ row }) => {
      return (
        <div
          className="max-w-[200px] truncate text-sm"
          title={row.getValue("subject")}
        >
          {row.getValue("subject")}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;

      switch (status) {
        case "PENDING":
          return (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200"
              >
                Chờ xử lý
              </Badge>
            </div>
          );
        case "RESPONDED":
          return (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200"
              >
                Đã phản hồi
              </Badge>
            </div>
          );
        case "CLOSED":
          return (
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-gray-500" />
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-700 hover:bg-gray-100"
              >
                Đã đóng
              </Badge>
            </div>
          );
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      const dateStr = row.getValue("createdAt") as string;
      const date = new Date(dateStr);

      // Format date to Vietnamese relative time (e.g., "2 ngày trước")
      return (
        <div
          className="text-xs text-muted-foreground"
          title={date.toLocaleDateString("vi-VN")}
        >
          {formatDistanceToNow(date, { addSuffix: true, locale: vi })}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const contact = row.original;
      return <ContactActions contact={contact} />;
    },
  },
];
