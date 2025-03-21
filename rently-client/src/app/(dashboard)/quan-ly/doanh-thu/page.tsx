"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { RevenueFilters } from "@/features/dashboard/components/revenue-filters";
import { revenueColumns } from "@/features/dashboard/components/revenue-columns";
import { formatPrice } from "@/lib/utils";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const transactions = [
  {
    id: "1",
    transactionId: "TXN-001",
    date: "2023-01-15",
    amount: 5000000,
    type: "subscription",
    user: "Nguyễn Văn A",
    status: "completed",
  },
  {
    id: "2",
    transactionId: "TXN-002",
    date: "2023-01-20",
    amount: 3000000,
    type: "listing",
    user: "Trần Thị B",
    status: "completed",
  },
  {
    id: "3",
    transactionId: "TXN-003",
    date: "2023-02-05",
    amount: 2500000,
    type: "subscription",
    user: "Lê Văn C",
    status: "pending",
  },
  {
    id: "4",
    transactionId: "TXN-004",
    date: "2023-02-10",
    amount: 6000000,
    type: "listing",
    user: "Phạm Thị D",
    status: "completed",
  },
  {
    id: "5",
    transactionId: "TXN-005",
    date: "2023-02-15",
    amount: 3500000,
    type: "subscription",
    user: "Hoàng Văn E",
    status: "failed",
  },
  {
    id: "6",
    transactionId: "TXN-006",
    date: "2023-03-01",
    amount: 4500000,
    type: "listing",
    user: "Ngô Thị F",
    status: "completed",
  },
  {
    id: "7",
    transactionId: "TXN-007",
    date: "2023-03-10",
    amount: 2000000,
    type: "subscription",
    user: "Đỗ Văn G",
    status: "completed",
  },
];

export type Transaction = (typeof transactions)[0];

export default function RevenuePage() {
  const [filteredData, setFilteredData] = useState<Transaction[]>(transactions);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const handleTypeFilterChange = (type: string) => {
    filterData(type, statusFilter, monthFilter);
  };

  const handleStatusFilterChange = (status: string) => {
    filterData(typeFilter, status, monthFilter);
  };

  const handleMonthFilterChange = (month: string) => {
    filterData(typeFilter, statusFilter, month);
  };

  const filterData = (type: string, status: string, month: string) => {
    setTypeFilter(type);
    setStatusFilter(status);
    setMonthFilter(month);

    const filtered = transactions.filter((transaction) => {
      if (type !== "all" && transaction.type !== type) return false;
      if (status !== "all" && transaction.status !== status) return false;

      if (month !== "all") {
        const transactionMonth = new Date(transaction.date).getMonth() + 1;
        if (Number.parseInt(month) !== transactionMonth) return false;
      }

      return true;
    });

    setFilteredData(filtered);
  };

  // Tính tổng doanh thu từ dữ liệu đã lọc
  const totalRevenue = filteredData.reduce((sum, transaction) => {
    if (transaction.status === "completed") {
      return sum + transaction.amount;
    }
    return sum;
  }, 0);

  // Tính doanh thu theo loại
  const subscriptionRevenue = filteredData.reduce((sum, transaction) => {
    if (
      transaction.status === "completed" &&
      transaction.type === "subscription"
    ) {
      return sum + transaction.amount;
    }
    return sum;
  }, 0);

  const listingRevenue = filteredData.reduce((sum, transaction) => {
    if (transaction.status === "completed" && transaction.type === "listing") {
      return sum + transaction.amount;
    }
    return sum;
  }, 0);

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Quản lý doanh thu</h1>
      </header>

      <div className="flex flex-col justify-between m-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button>
            <Download className="mr-2 h-4 w-4" />
            <span>Xuất báo cáo</span>
          </Button>

          <RevenueFilters
            onTypeFilterChange={handleTypeFilterChange}
            onStatusFilterChange={handleStatusFilterChange}
            onMonthFilterChange={handleMonthFilterChange}
          />
        </div>

        <DataTable
          columns={revenueColumns}
          data={filteredData}
          searchKey="transactionId"
          searchPlaceholder="Tìm kiếm theo mã giao dịch..."
        />
      </div>
    </SidebarInset>
  );
}
