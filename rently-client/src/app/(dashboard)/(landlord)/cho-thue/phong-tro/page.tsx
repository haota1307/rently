"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Receipt, ChevronDown, Copy } from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { roomColumns } from "@/features/dashboard/components/columns/room-columns";
import { RoomFilters } from "@/features/dashboard/components/filters/room-filters";
import { CommonFilterLayout } from "@/features/dashboard/components/filters/common-filter-layout";
import { useGetMyRooms } from "@/features/rooms/useRoom";
import { CreateRoomModal } from "@/features/rooms/components/create-room-modal";
import { CreateBulkRoomsModal } from "@/features/rooms/components/create-bulk-rooms-modal";
import { EditRoomModal } from "@/features/rooms/components/edit-room-modal";
import { DeleteRoomConfirm } from "@/features/rooms/components/delete-room-confirm";
import { CreateRoomBillModal } from "@/features/rooms/components/create-room-bill-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export default function RoomsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [isAddBulkRoomsDialogOpen, setIsAddBulkRoomsDialogOpen] =
    useState(false);

  // State cho chức năng chỉnh sửa và xóa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const limit = 5;
  const queryParams = {
    limit,
    page,
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(priceFilter !== "all" && { priceRange: priceFilter }),
    ...(areaFilter !== "all" && { areaRange: areaFilter }),
  };

  const { data, isLoading, error } = useGetMyRooms(queryParams);
  const roomsData = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleStatusFilterChange = (status: string) => {
    setPage(1);
    setStatusFilter(status);
  };

  const handlePriceFilterChange = (price: string) => {
    setPage(1);
    setPriceFilter(price);
  };

  const handleAreaFilterChange = (area: string) => {
    setPage(1);
    setAreaFilter(area);
  };

  const handleClearAllFilters = () => {
    setStatusFilter("all");
    setPriceFilter("all");
    setAreaFilter("all");
    setSearchInput("");
    setPage(1);
  };

  // Callback khi người dùng chọn xem chi tiết
  const handleViewRoom = (room: any) => {
    router.push(`/cho-thue/phong-tro/${room.id}`);
  };

  // Callback khi người dùng chọn chỉnh sửa
  const handleEditRoom = (room: any) => {
    setSelectedRoom(room);
    setIsEditModalOpen(true);
  };

  // Callback khi người dùng chọn xóa
  const handleDeleteRoom = (room: any) => {
    // Kiểm tra xem phòng có đang được thuê không
    const isRented = !room.isAvailable;

    // Kiểm tra xem phòng có bài đăng active không
    const hasActivePost = room.RentalPost && room.RentalPost.length > 0;
    const postTitle = hasActivePost ? room.RentalPost[0]?.title : undefined;

    setSelectedRoom({
      ...room,
      isRented,
      hasActivePost,
      postTitle,
    });
    setIsDeleteModalOpen(true);
  };

  // Callback khi người dùng chọn tạo hóa đơn
  const handleCreateBill = (room: any) => {
    setSelectedRoom(room);
    setIsCreateBillModalOpen(true);
  };

  const columns = [
    ...roomColumns.filter((column) => column.id !== "actions"),
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }: any) => {
        const room = row.original;
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
                onClick={() =>
                  navigator.clipboard.writeText(room.id.toString())
                }
              >
                Sao chép ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewRoom(room)}>
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditRoom(room)}>
                Chỉnh sửa
              </DropdownMenuItem>
              {/* Chỉ hiển thị nút "Tạo hóa đơn" cho phòng đã thuê */}
              {!room.isAvailable && (
                <DropdownMenuItem onClick={() => handleCreateBill(room)}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Tạo hóa đơn
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleDeleteRoom(room)}
                className="text-red-600"
              >
                Xóa phòng trọ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Quản lý phòng trọ</h1>
      </header>

      <div className="flex flex-col justify-between m-4 gap-4">
        <CommonFilterLayout
          searchInput={searchInput}
          onSearchChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          clearAllFilters={handleClearAllFilters}
          showClearButton={
            statusFilter !== "all" ||
            priceFilter !== "all" ||
            areaFilter !== "all" ||
            searchInput.trim() !== ""
          }
          searchPlaceholder="Tìm kiếm theo tiêu đề..."
          actionButton={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Thêm phòng trọ</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Loại tạo phòng</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsAddRoomDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo phòng đơn lẻ
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsAddBulkRoomsDialogOpen(true)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Tạo phòng hàng loạt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
          filterControls={
            <RoomFilters
              onStatusFilterChange={handleStatusFilterChange}
              onPriceFilterChange={handlePriceFilterChange}
              onAreaFilterChange={handleAreaFilterChange}
              statusValue={statusFilter}
              priceValue={priceFilter}
              areaValue={areaFilter}
            />
          }
        />

        <CreateRoomModal
          open={isAddRoomDialogOpen}
          onOpenChange={setIsAddRoomDialogOpen}
        />

        <CreateBulkRoomsModal
          open={isAddBulkRoomsDialogOpen}
          onOpenChange={setIsAddBulkRoomsDialogOpen}
          onSuccess={() => setPage(1)}
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
            data={roomsData}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      {selectedRoom && (
        <>
          {/* Modal chỉnh sửa phòng */}
          <EditRoomModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            roomId={selectedRoom.id}
          />

          {/* Modal xóa phòng */}
          <DeleteRoomConfirm
            open={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            roomId={selectedRoom.id}
            roomTitle={selectedRoom.title}
            isRented={selectedRoom.isRented}
            hasActivePost={selectedRoom.hasActivePost}
            postTitle={selectedRoom.postTitle}
          />

          {/* Modal tạo hóa đơn */}
          <CreateRoomBillModal
            open={isCreateBillModalOpen}
            onOpenChange={setIsCreateBillModalOpen}
            roomId={selectedRoom.id}
          />
        </>
      )}
    </SidebarInset>
  );
}
