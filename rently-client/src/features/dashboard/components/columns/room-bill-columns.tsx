import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { RoomBillType } from "@/schemas/room-bill.schema";

export const roomBillColumns: ColumnDef<RoomBillType>[] = [
  {
    id: "id",
    header: "ID",
    accessorKey: "id",
  },
  {
    id: "roomTitle",
    header: "Phòng",
    accessorFn: (row) => row.room?.title || `Phòng #${row.roomId}`,
  },
  {
    id: "billingMonth",
    header: "Kỳ thu",
    accessorFn: (row) => {
      const date = new Date(row.billingMonth);
      return format(date, "MM/yyyy");
    },
  },
  {
    id: "electricityUsage",
    header: "Tiền điện",
    accessorFn: (row) => {
      const usage = row.electricityNew - row.electricityOld;
      const amount = usage * Number(row.electricityPrice);
      return `${usage} kWh (${amount.toLocaleString("vi-VN")} đ)`;
    },
  },
  {
    id: "waterUsage",
    header: "Tiền nước",
    accessorFn: (row) => {
      const usage = row.waterNew - row.waterOld;
      const amount = usage * Number(row.waterPrice);
      return `${usage} m³ (${amount.toLocaleString("vi-VN")} đ)`;
    },
  },
  {
    id: "totalAmount",
    header: "Tổng tiền",
    accessorFn: (row) => {
      return `${Number(row.totalAmount).toLocaleString("vi-VN")} đ`;
    },
  },
  {
    id: "dueDate",
    header: "Hạn thanh toán",
    accessorFn: (row) => {
      const date = new Date(row.dueDate);
      return format(date, "dd/MM/yyyy", { locale: vi });
    },
  },
  {
    id: "status",
    header: "Trạng thái",
    accessorFn: (row) => (row.isPaid ? "Đã thanh toán" : "Chưa thanh toán"),
    cell: ({ row }) => {
      const isPaid = row.original.isPaid;
      const isEmailSent = row.original.emailSent;

      return (
        <div className="flex flex-col gap-1">
          <Badge variant={isPaid ? "success" : "destructive"}>
            {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
          </Badge>
          {isEmailSent && (
            <Badge variant="outline" className="text-xs">
              Đã gửi email
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "createdAt",
    header: "Ngày tạo",
    accessorFn: (row) => {
      const date = new Date(row.createdAt);
      return format(date, "dd/MM/yyyy", { locale: vi });
    },
  },
];
