"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { rentalColumns } from "@/features/dashboard/components/columns/rental-columns";
import { CreateRentalModal } from "@/features/rental/component/create-rental-modal";
import { CreateRentalBodyType } from "@/schemas/rental.schema";
import { useGetRentalsById } from "@/features/rental/useRental";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";

export default function LandlordRentalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const accessToken = getAccessTokenFromLocalStorage();
  const userId = accessToken ? decodeAccessToken(accessToken).userId : null;

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data } = useGetRentalsById(userId!, {
    page,
    limit,
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

        <DataTable
          columns={rentalColumns}
          data={rentals}
          searchKey="title"
          searchPlaceholder="Tìm kiếm theo tiêu đề..."
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
