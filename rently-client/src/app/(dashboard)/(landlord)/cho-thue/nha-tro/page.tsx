"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { rentalColumns } from "@/features/dashboard/components/columns/rental-columns";
import { CreateRentalModal } from "@/features/rental/component/create-rental-modal";
import { CreateRentalBodyType } from "@/schemas/rental.schema";

export const rentals = [
  {
    id: 1,
    title: "Nhà trọ Trần Hào 1",
    description: "Gần trung tâm, tiện nghi cao cấp",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    lat: 10.774567,
    lng: 106.700345,
    createdAt: "2023-01-15T00:00:00Z",
    updatedAt: "2023-01-15T00:00:00Z",
    landlordId: 2,
    rentalImages: [],
  },
  {
    id: 2,
    title: "Nhà trọ Trần Hào 2",
    description: "Phù hợp sinh viên, có nội thất cơ bản",
    address: "456 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM",
    lat: 10.805123,
    lng: 106.713456,
    createdAt: "2023-02-10T00:00:00Z",
    updatedAt: "2023-02-12T00:00:00Z",
    landlordId: 2,
    rentalImages: [],
  },
  {
    id: 3,
    title: "Nhà trọ Trần Hào 3",
    description: "Đi bộ 5 phút tới cổng trường, an ninh tốt",
    address: "789 Lý Thường Kiệt, Quận 10, TP.HCM",
    lat: 10.776789,
    lng: 106.658222,
    createdAt: "2023-03-05T00:00:00Z",
    updatedAt: "2023-03-06T00:00:00Z",
    landlordId: 2,
    rentalImages: [],
  },
];

export default function LandlordRentalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rentalsList, setRentalsList] = useState(rentals);

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
          data={rentalsList}
          searchKey="title"
          searchPlaceholder="Tìm kiếm theo tiêu đề..."
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
