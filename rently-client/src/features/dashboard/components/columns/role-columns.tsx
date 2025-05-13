"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Key, Edit, Trash } from "lucide-react";
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
import { Role } from "@/constants/type";

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

// Hàm kiểm tra xem vai trò có phải là vai trò cơ bản không
const isBaseRole = (roleName: string): boolean => {
  return [Role.Admin, Role.Landlord, Role.Client].includes(roleName as any);
};

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
      const isBasic = isBaseRole(role.name);

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAssignPermissions(role)}>
              <Key className="mr-2 h-4 w-4" />
              <span>Phân quyền</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit(role)}
              disabled={isBasic}
              className={isBasic ? "cursor-not-allowed opacity-50" : ""}
              title={isBasic ? "Không thể chỉnh sửa vai trò cơ bản" : ""}
            >
              <Edit className="mr-2 h-4 w-4" />
              <span>Chỉnh sửa</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(role.id)}
              disabled={isBasic}
              className={
                isBasic
                  ? "cursor-not-allowed opacity-50 text-red-600"
                  : "text-red-600"
              }
              title={isBasic ? "Không thể xóa vai trò cơ bản" : ""}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Xóa</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
