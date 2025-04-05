"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { AmenityFilters } from "@/features/dashboard/components/filters/amenity-filters";
import {
  amenityColumns,
  Amenity,
} from "@/features/dashboard/components/columns/amenity-columns";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import { CreateAmenityModal } from "@/features/dashboard/components/modals/create-amenity-modal";
import { EditAmenityModal } from "@/features/dashboard/components/modals/edit-amenity-modal";
import { ViewAmenityModal } from "@/features/dashboard/components/modals/view-amenity-modal";
import {
  useGetAmenities,
  useDeleteAmenity,
} from "@/features/amenity/useAmenity";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

export default function AmenitiesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data: amenitiesData, isLoading } = useGetAmenities({
    page: currentPage,
    limit: 10,
    name: debouncedSearchQuery || undefined,
  });

  const deleteAmenityMutation = useDeleteAmenity();

  const handleSortChange = (value: string) => {
    setSortOption(value);
    setCurrentPage(1);
  };

  const handleEditAmenity = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setIsEditModalOpen(true);
  };

  const handleViewAmenity = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setIsViewModalOpen(true);
  };

  const handleConfirmDelete = (amenityId: number) => {
    // Tìm thông tin amenity để hiển thị tên trong dialog xác nhận
    const amenity = amenitiesData?.data.find((a) => a.id === amenityId) || null;
    setSelectedAmenity(amenity);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAmenity = async () => {
    if (!selectedAmenity) return;

    try {
      await deleteAmenityMutation.mutateAsync(selectedAmenity.id);
      toast.success("Xóa tiện ích thành công");
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      if (error.response?.data?.message) {
        if (typeof error.response.data.message === "string") {
          toast.error(error.response.data.message);
        } else if (Array.isArray(error.response.data.message)) {
          error.response.data.message.forEach((err: any) => {
            toast.error(`Lỗi: ${err.message}`);
          });
        }
      } else {
        toast.error("Xóa tiện ích thất bại");
      }
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Xử lý dữ liệu từ API
  const amenities = amenitiesData?.data || [];
  const totalPages = amenitiesData?.totalPages || 1;

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Quản lý tiện ích</h1>
      </header>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex-1 sm:max-w-md">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo tên..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <AmenityFilters onSortChange={handleSortChange} />

                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Thêm tiện ích</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable
          columns={
            amenityColumns({
              onDelete: handleConfirmDelete,
              onEdit: handleEditAmenity,
              onView: handleViewAmenity,
            }) as ColumnDef<Amenity>[]
          }
          data={amenities}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />

        <CreateAmenityModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        <EditAmenityModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          amenity={selectedAmenity}
        />

        <ViewAmenityModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          amenity={selectedAmenity}
        />

        {/* Dialog xác nhận xóa */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa tiện ích này? Hành động này không thể
                hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedAmenity && (
                <p>
                  <span className="font-medium">Tiện ích: </span>
                  {selectedAmenity.name}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAmenity}
                disabled={deleteAmenityMutation.isPending}
              >
                {deleteAmenityMutation.isPending ? "Đang xóa..." : "Xóa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarInset>
  );
}
