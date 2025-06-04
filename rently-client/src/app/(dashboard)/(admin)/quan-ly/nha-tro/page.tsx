"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { RentalFilters } from "@/features/dashboard/components/filters/rental-filters";
import { rentalColumns } from "@/features/dashboard/components/columns/rental-columns";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import { useGetRentals } from "@/features/rental/useRental";
import { RentalType } from "@/schemas/rental.schema";
import { CreateRoomForLandlordModal } from "@/features/rooms/components/create-room-for-landlord-modal";
import { CreateRentalForLandlordModal } from "@/features/rental/component/create-rental-for-landlord-modal";

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

export default function RentalsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [landlordFilter, setLandlordFilter] = useState<string>("all");
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isCreateRentalModalOpen, setIsCreateRentalModalOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Gọi API để lấy danh sách nhà trọ
  const { data: rentalsData, isLoading } = useGetRentals({
    page: currentPage,
    limit: 10,
    title: debouncedSearchQuery || undefined,
    landlordId: landlordFilter === "all" ? undefined : Number(landlordFilter),
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleLandlordFilterChange = (value: string) => {
    setLandlordFilter(value);
    setCurrentPage(1);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Quản lý nhà trọ</h1>
      </header>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 md:max-w-sm">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo tiêu đề..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between w-full md:w-auto">
                <RentalFilters
                  onLandlordFilterChange={handleLandlordFilterChange}
                />

                <div className="flex gap-2">
                  <Button onClick={() => setIsCreateRentalModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Thêm nhà trọ</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateRoomModalOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Thêm phòng trọ</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable
          columns={rentalColumns as ColumnDef<RentalType>[]}
          data={rentalsData?.data || []}
          currentPage={currentPage}
          totalPages={rentalsData?.totalPages || 1}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />

        {/* Modal tạo nhà trọ cho người cho thuê */}
        <CreateRentalForLandlordModal
          isOpen={isCreateRentalModalOpen}
          onClose={() => setIsCreateRentalModalOpen(false)}
        />

        {/* Modal tạo phòng trọ cho người cho thuê */}
        <CreateRoomForLandlordModal
          open={isCreateRoomModalOpen}
          onOpenChange={setIsCreateRoomModalOpen}
        />
      </div>
    </SidebarInset>
  );
}
