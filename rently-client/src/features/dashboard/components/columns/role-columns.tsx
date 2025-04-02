"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { RoleType } from "@/schemas/role.schema";

// Interface mở rộng RoleType với truờng permissions
export interface Role extends RoleType {
  permissions: {
    id: number;
    name: string;
    module: string;
  }[];
}

export interface RoleColumnsProps {
  onEdit: (role: Role) => void;
  onDelete: (roleId: number) => void;
  onAssignPermissions: (role: Role) => void;
}

export const roleColumns = ({
  onEdit,
  onDelete,
  onAssignPermissions,
}: RoleColumnsProps): ColumnDef<Role>[] => [
  {
    accessorKey: "name",
    header: "Tên vai trò",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("name")}</div>;
    },
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => {
      return (
        <div className="max-w-[300px] truncate">
          {row.getValue("description")}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Trạng thái",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");
      return (
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={isActive ? "bg-green-500" : "bg-red-500"}
        >
          {isActive ? "Hoạt động" : "Không hoạt động"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "permissions",
    header: "Số quyền",
    cell: ({ row }) => {
      const role = row.original;
      // Đảm bảo permissions luôn là một mảng
      const permissions = Array.isArray(role.permissions)
        ? role.permissions
        : [];
      const count = permissions.length;

      return (
        <Badge
          variant={count > 0 ? "default" : "outline"}
          className={count > 0 ? "bg-primary" : ""}
        >
          {count} quyền
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return (
        <div>{format(new Date(row.getValue("createdAt")), "dd/MM/yyyy")}</div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const role = row.original;
      const baseRoles = ["ADMIN", "CLIENT", "LANDLORD"];
      const isBaseRole = baseRoles.includes(role.name);

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
              onClick={() => onAssignPermissions(role)}
              disabled={isBaseRole}
              className={isBaseRole ? "cursor-not-allowed opacity-50" : ""}
            >
              Gán quyền
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onEdit(role)}
              disabled={isBaseRole}
            >
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(role.id)}
              className="text-red-600"
              disabled={isBaseRole}
            >
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
