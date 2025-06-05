import React from "react";
import { ContractTable, Contract } from "./contract-table";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractDataTableProps {
  contracts: Contract[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  currentUserId?: number;
  emptyMessage?: string;
}

export function ContractDataTable({
  contracts,
  currentPage,
  totalPages,
  onPageChange,
  loading,
  currentUserId,
  emptyMessage = "Không có hợp đồng nào",
}: ContractDataTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-8 w-20" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ContractTable
        contracts={contracts}
        loading={loading}
        onRefresh={() => onPageChange(currentPage)}
        currentUserId={currentUserId}
      />

      {/* Phân trang */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs text-muted-foreground">
          Trang {currentPage} / {totalPages || 1}
        </div>
        <div className="flex space-x-2">
          <button
            className="h-8 w-8 p-0 flex items-center justify-center border rounded-md disabled:opacity-50"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || totalPages === 0}
          >
            <span className="sr-only">Trang trước</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            className="h-8 w-8 p-0 flex items-center justify-center border rounded-md disabled:opacity-50"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || totalPages === 0}
          >
            <span className="sr-only">Trang sau</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
