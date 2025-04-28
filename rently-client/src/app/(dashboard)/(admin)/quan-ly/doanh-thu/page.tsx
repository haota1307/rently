"use client";

import React, { useState, useEffect } from "react";
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
import { Download, Search } from "lucide-react";
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
  getPaginationRowModel,
  type ColumnDef,
  FilterFn,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  rawDate: Date; // Thêm trường này để lưu date gốc cho việc filter
  amount: number;
  type: string;
  user: string;
  userName: string;
  userEmail: string;
  userPhone: string;
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
  status?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
}

// DataTable component with pagination
function DataTable<TData, TValue>({
  columns,
  data,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center py-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm giao dịch..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 max-w-sm"
          />
        </div>
      </div>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Hiển thị {table.getFilteredRowModel().rows.length} trong {data.length}{" "}
          giao dịch
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Trước
          </Button>
          <div className="flex items-center text-muted-foreground text-sm">
            <span>
              Trang {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sau
          </Button>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue
                placeholder={table.getState().pagination.pageSize.toString()}
              />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// Revenue Filters component with functionality
const RevenueFilters = ({
  onFilterChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  activeFilter,
}: {
  onFilterChange: (type: string) => void;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  activeFilter: string;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={activeFilter === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("all")}
      >
        Tất cả
      </Button>
      <Button
        variant={activeFilter === "income" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("income")}
      >
        Tiền vào
      </Button>
      <Button
        variant={activeFilter === "expense" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("expense")}
      >
        Tiền ra
      </Button>
      <div className="flex items-center gap-2">
        <DatePicker date={startDate} onSelect={onStartDateChange} />
        <span>đến</span>
        <DatePicker date={endDate} onSelect={onEndDateChange} />
      </div>
    </div>
  );
};

const DashboardRevenuePage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [totalAmount, setTotalAmount] = useState<{
    income: number;
    expense: number;
  }>({ income: 0, expense: 0 });

  // Fetch transactions from our backend API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await paymentApiRequest.getTransactions();

        // Transform SePay transactions to our format
        if (response.payload?.transactions) {
          const formattedTransactions = response.payload.transactions.map(
            (t: ApiTransaction) => {
              const transactionDate = new Date(t.transaction_date);
              return {
                id: t.id,
                transactionId: t.reference_number || `TXN-${t.id}`,
                date: transactionDate.toLocaleDateString("vi-VN"),
                rawDate: transactionDate,
                amount:
                  parseFloat(t.amount_in) || parseFloat(t.amount_out) || 0,
                type: parseFloat(t.amount_in) > 0 ? "income" : "expense",
                user: t.user?.id || "Unknown",
                userName: t.user?.name || "Không rõ",
                userEmail: t.user?.email || "",
                userPhone: t.user?.phoneNumber || "",
                status: t.status || "PENDING",
                source: "SePay",
              };
            }
          );
          setTransactions(formattedTransactions);
          setFilteredTransactions(formattedTransactions);
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Không thể tải dữ liệu giao dịch. Vui lòng thử lại sau.");
        toast.error("Không thể tải dữ liệu giao dịch");

        // Fallback to dummy data if API fails
        const dummyData = [
          {
            id: "1",
            transactionId: "TXN-001",
            date: "15/01/2023",
            rawDate: new Date(2023, 0, 15),
            amount: 5000000,
            type: "income",
            user: "user1",
            userName: "Nguyễn Văn A",
            userEmail: "nguyenvana@example.com",
            userPhone: "0901234567",
            status: "completed",
          },
          {
            id: "2",
            transactionId: "TXN-002",
            date: "20/01/2023",
            rawDate: new Date(2023, 0, 20),
            amount: 3000000,
            type: "income",
            user: "user2",
            userName: "Trần Thị B",
            userEmail: "tranthib@example.com",
            userPhone: "0912345678",
            status: "completed",
          },
          {
            id: "3",
            transactionId: "TXN-003",
            date: "05/02/2023",
            rawDate: new Date(2023, 1, 5),
            amount: 2500000,
            type: "expense",
            user: "user3",
            userName: "Lê Văn C",
            userEmail: "levanc@example.com",
            userPhone: "0923456789",
            status: "pending",
          },
        ];
        setTransactions(dummyData);
        setFilteredTransactions(dummyData);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Calculate total amounts
  useEffect(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    setTotalAmount({ income, expense });
  }, [transactions]);

  // Apply filters when activeFilter or dateRange changes
  useEffect(() => {
    let filtered = [...transactions];

    // Apply transaction type filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === activeFilter);
    }

    // Apply start date filter
    if (startDate) {
      filtered = filtered.filter((t) => {
        if (t.rawDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          return t.rawDate >= start;
        }
        return true;
      });
    }

    // Apply end date filter
    if (endDate) {
      filtered = filtered.filter((t) => {
        if (t.rawDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return t.rawDate <= end;
        }
        return true;
      });
    }

    setFilteredTransactions(filtered);
  }, [activeFilter, startDate, endDate, transactions]);

  const handleFilterChange = (type: string) => {
    setActiveFilter(type);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
  };

  const handleExportReport = () => {
    toast.success("Đang chuẩn bị tải xuống báo cáo...");

    // Tạo nội dung CSV
    const headers = [
      "Mã giao dịch",
      "Ngày",
      "Số tiền",
      "Loại giao dịch",
      "Người dùng",
      "Email",
      "SĐT",
      "Trạng thái",
    ];
    const csvRows = [headers];

    // Hiển thị trạng thái đúng với enum PaymentStatus
    const getStatusText = (status: string) => {
      switch (status) {
        case "SUCCESS":
          return "Hoàn thành";
        case "PENDING":
          return "Đang xử lý";
        case "FAILED":
          return "Thất bại";
        case "CANCELED":
          return "Đã hủy";
        default:
          return status || "Không xác định";
      }
    };

    filteredTransactions.forEach((t) => {
      csvRows.push([
        t.transactionId,
        t.date,
        t.amount.toString(),
        t.type === "income" ? "Tiền vào" : "Tiền ra",
        t.userName,
        t.userEmail,
        t.userPhone,
        getStatusText(t.status),
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Tạo link tải xuống
    const link = document.createElement("a");
    const currentDate = format(new Date(), "dd-MM-yyyy");
    link.setAttribute("href", url);
    link.setAttribute("download", `bao-cao-doanh-thu-${currentDate}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to clear date range filter
  const handleClearFilters = () => {
    setActiveFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    toast.success("Đã xóa tất cả bộ lọc");
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Quản lý doanh thu</h1>
      </header>

      <div className="flex flex-col gap-5 m-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Giao dịch</h2>
            <p className="text-muted-foreground">
              Quản lý và theo dõi các giao dịch tài chính
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RevenueFilters
              onFilterChange={handleFilterChange}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              activeFilter={activeFilter}
            />
            {(activeFilter !== "all" || startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Xóa bộ lọc
              </Button>
            )}
            <Button size="sm" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng tiền vào
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(totalAmount.income)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng tiền ra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatPrice(totalAmount.expense)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số dư</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(totalAmount.income - totalAmount.expense)}
              </div>
            </CardContent>
          </Card>
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
              <DataTable columns={revenueColumns} data={filteredTransactions} />
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
};

export default DashboardRevenuePage;
