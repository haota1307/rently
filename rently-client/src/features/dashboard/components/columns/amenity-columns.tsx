import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Eye, MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AmenityType } from "@/schemas/amenity.schema";

export type Amenity = AmenityType;

interface AmenityColumnsProps {
  onDelete: (id: number) => void;
  onEdit: (amenity: Amenity) => void;
  onView: (amenity: Amenity) => void;
}

export const amenityColumns = ({
  onDelete,
  onEdit,
  onView,
}: AmenityColumnsProps): ColumnDef<Amenity>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      return <span>#{row.getValue("id")}</span>;
    },
  },
  {
    accessorKey: "name",
    header: "Tên tiện ích",
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      // Xử lý createdAt có thể là chuỗi hoặc đối tượng Date
      const createdAt = row.getValue("createdAt");
      try {
        const date = new Date(createdAt as string | Date);
        return <span>{date.toLocaleDateString("vi-VN")}</span>;
      } catch (error) {
        return <span>Không xác định</span>;
      }
    },
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const amenity = row.original;

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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onView(amenity)}>
              <Eye className="mr-2 h-4 w-4" />
              <span>Xem chi tiết</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(amenity)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Chỉnh sửa</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(amenity.id)}>
              <Trash className="mr-2 h-4 w-4" />
              <span>Xóa</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
