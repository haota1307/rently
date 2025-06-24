"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { rentalColumns } from "@/features/dashboard/components/columns/rental-columns";
import { CreateRentalModal } from "@/features/rental/component/create-rental-modal";
import { CreateRentalBodyType, RentalType } from "@/schemas/rental.schema";
import {
  useGetRentalsById,
  useDeleteRental,
  useGetRentalDetail,
} from "@/features/rental/useRental";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UpdateRentalModal } from "@/features/rental/component/update-rental-modal";
import { RentalDetailModal } from "@/features/rental/component/rental-detail-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommonFilterLayout } from "@/features/dashboard/components/filters/common-filter-layout";

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<RentalType | null>(null);
  const [selectedRentalId, setSelectedRentalId] = useState<number | null>(null);

  const { mutateAsync: deleteRental, isPending } = useDeleteRental();

  const accessToken = getAccessTokenFromLocalStorage();
  const userId = accessToken ? decodeAccessToken(accessToken).userId : null;

  const debouncedSearch = useDebounce(searchInput, 300);
  const limit = 5;

  const searchTitle =
    debouncedSearch.trim() !== "" ? debouncedSearch.trim() : undefined;

  const { data, isLoading, error } = useGetRentalsById(userId!, {
    page,
    limit,
    title: searchTitle,
  });

  // Fetch detailed rental information
  const { data: detailedRental, isLoading: isLoadingDetail } =
    useGetRentalDetail(selectedRentalId || 0, {
      enabled: !!selectedRentalId && isDetailModalOpen,
    });

  const rentals = data?.data || [];
  const totalPages = data?.totalPages || 0;

  const handleCreateRental = (data: CreateRentalBodyType) => {
    setIsCreateModalOpen(false);
  };

  // Xử lý xem chi tiết
  const handleViewRental = (rental: RentalType) => {
    setSelectedRental(rental);
    setSelectedRentalId(rental.id);
    setIsDetailModalOpen(true);
  };

  // Xử lý chỉnh sửa
  const handleEditRental = (rental: RentalType) => {
    setSelectedRental(rental);
    setIsUpdateModalOpen(true);
  };

  // Xử lý xóa
  const handleDeleteRental = (rental: RentalType) => {
    setSelectedRental(rental);
    setIsDeleteModalOpen(true);
  };

  // Xác nhận xóa
  const confirmDelete = async () => {
    if (!selectedRental || isPending) return;

    try {
      await deleteRental(selectedRental.id);
      toast.success("Xóa nhà trọ thành công");
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.payload?.message ||
        "Không thể xóa nhà trọ. Vui lòng thử lại sau.";

      // Hiển thị thông báo lỗi
      toast.error(`Không thể xóa nhà trọ: ${errorMessage}`);

      // Cập nhật nội dung modal để hiển thị lỗi
      const dialogContent = document.querySelector(
        '[role="dialog"] [role="document"]'
      );
      if (dialogContent) {
        const errorElement = document.createElement("div");
        errorElement.className =
          "mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm";
        errorElement.textContent = errorMessage;

        // Xóa thông báo lỗi cũ nếu có
        const oldError = dialogContent.querySelector(".bg-red-50");
        if (oldError) oldError.remove();

        // Thêm thông báo lỗi mới
        dialogContent.appendChild(errorElement);
      }
    }
  };

  const columns = [
    ...rentalColumns.filter((column) => column.id !== "actions"),
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }: any) => {
        const rental = row.original;
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
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(String(rental.id))}
              >
                Sao chép ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewRental(rental)}>
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditRental(rental)}>
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteRental(rental)}
                className="text-red-600"
              >
                Xóa nhà trọ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleClearAllFilters = () => {
    setSearchInput("");
    setPage(1);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Danh sách nhà trọ</h1>
      </header>

      <div className="flex flex-col justify-between m-4 gap-4">
        <CommonFilterLayout
          searchInput={searchInput}
          onSearchChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          clearAllFilters={handleClearAllFilters}
          showClearButton={searchInput.trim() !== ""}
          searchPlaceholder="Tìm kiếm theo tiêu đề..."
          actionButton={
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Thêm nhà trọ</span>
            </Button>
          }
        />

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Đang tải...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">
            Đã xảy ra lỗi khi tải dữ liệu
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rentals}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}

        {/* Các modal */}
        <CreateRentalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateRental}
        />

        {selectedRental && (
          <>
            <UpdateRentalModal
              isOpen={isUpdateModalOpen}
              onClose={() => setIsUpdateModalOpen(false)}
              rental={selectedRental}
            />

            <RentalDetailModal
              isOpen={isDetailModalOpen}
              onClose={() => {
                setIsDetailModalOpen(false);
                setSelectedRentalId(null);
              }}
              rental={detailedRental || selectedRental}
            />

            <ConfirmModal
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              onConfirm={confirmDelete}
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa nhà trọ này không? Sau khi xóa, dữ liệu sẽ không thể khôi phục lại."
              confirmText="Xóa"
              cancelText="Hủy"
            />
          </>
        )}
      </div>
    </SidebarInset>
  );
}
