"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { revenueColumns } from "@/features/dashboard/components/columns/revenue-columns";
import { formatPrice } from "@/lib/utils";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import paymentApiRequest from "@/features/dashboard/payment.api";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

// Map to local Transaction type
export interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  amount: number;
  type: string;
  user: string;
  status: string;
  source?: string;
}

// Define transaction interface from API
interface ApiTransaction {
  id: string;
  bank_brand_name?: string;
  account_number: string;
  transaction_date: string;
  amount_out: string;
  amount_in: string;
  accumulated: string;
  transaction_content: string | null;
  reference_number: string | null;
  code: string | null;
  sub_account: string | null;
  bank_account_id?: string;
}

// Simplified DataTable component without pagination
function SimpleDataTable<TData, TValue>({
  columns,
  data,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Simplified RevenueFilters component
const SimpleRevenueFilters = () => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm">
        Tất cả
      </Button>
      <Button variant="outline" size="sm">
        Tiền vào
      </Button>
      <Button variant="outline" size="sm">
        Tiền ra
      </Button>
    </div>
  );
};

const DashboardRevenuePage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions from our backend API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await paymentApiRequest.getTransactions();

        // Transform SePay transactions to our format
        if (response.payload?.transactions) {
          const formattedTransactions = response.payload.transactions.map(
            (t: ApiTransaction) => ({
              id: t.id,
              transactionId: t.reference_number || `TXN-${t.id}`,
              date: new Date(t.transaction_date).toLocaleDateString("vi-VN"),
              amount: parseFloat(t.amount_in) || parseFloat(t.amount_out) || 0,
              type: parseFloat(t.amount_in) > 0 ? "income" : "expense",
              user: t.transaction_content?.split(" ")[0] || "Unknown",
              status: "completed",
              source: "SePay",
            })
          );
          setTransactions(formattedTransactions);
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Không thể tải dữ liệu giao dịch. Vui lòng thử lại sau.");
        toast.error("Không thể tải dữ liệu giao dịch");

        // Fallback to dummy data if API fails
        setTransactions([
          {
            id: "1",
            transactionId: "TXN-001",
            date: "15/01/2023",
            amount: 5000000,
            type: "subscription",
            user: "Nguyễn Văn A",
            status: "completed",
          },
          {
            id: "2",
            transactionId: "TXN-002",
            date: "20/01/2023",
            amount: 3000000,
            type: "listing",
            user: "Trần Thị B",
            status: "completed",
          },
          {
            id: "3",
            transactionId: "TXN-003",
            date: "05/02/2023",
            amount: 2500000,
            type: "subscription",
            user: "Lê Văn C",
            status: "pending",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Quản lý doanh thu</h1>
      </header>

      <div className="flex flex-col gap-5 m-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Giao dịch</h2>
            <p className="text-muted-foreground">
              Quản lý và theo dõi các giao dịch tài chính
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SimpleRevenueFilters />
            <Button size="sm">
              <Download className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-80">
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              <SimpleDataTable columns={revenueColumns} data={transactions} />
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
};

export default DashboardRevenuePage;
