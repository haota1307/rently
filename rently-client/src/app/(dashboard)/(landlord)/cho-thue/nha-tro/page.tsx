"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { rentalColumns } from "@/features/dashboard/components/columns/rental-columns";
import { CreateRentalModal } from "@/features/rental/component/create-rental-modal";
import { CreateRentalBodyType } from "@/schemas/rental.schema";
import { useGetRentalsById } from "@/features/rental/useRental";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// Custom hook debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function LandlordRentalPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const accessToken = getAccessTokenFromLocalStorage();
  const userId = accessToken ? decodeAccessToken(accessToken).userId : null;

  const debouncedSearch = useDebounce(searchInput, 300);
  const limit = 5;

  const searchTitle =
    debouncedSearch.trim() !== "" ? debouncedSearch.trim() : undefined;

  const { data } = useGetRentalsById(userId!, {
    page,
    limit,
    title: searchTitle,
  });

  const rentals = data?.data || [];
  const totalPages = data?.totalPages || 0;

  const handleCreateRental = (data: CreateRentalBodyType) => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center gap-2 border-b px-4">
        <h1 className="text-lg font-semibold">Danh sách nhà trọ</h1>
      </header>

      <div className="m-4 space-y-4">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          <span>Thêm nhà trọ</span>
        </Button>

        <div className="flex items-center py-4">
          <Input
            placeholder="Tìm kiếm theo tiêu đề..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
        </div>

        <DataTable
          columns={rentalColumns}
          data={rentals}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        <CreateRentalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateRental}
        />
      </div>
    </div>
  );
}
