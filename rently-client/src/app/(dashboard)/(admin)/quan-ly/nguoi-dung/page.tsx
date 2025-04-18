"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { UserFilters } from "@/features/dashboard/components/filters/user-filters";
import {
  userColumns,
  User,
} from "@/features/dashboard/components/columns/user-columns";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import { CreateUserModal } from "@/features/dashboard/components/modals/create-user-modal";
import { EditUserModal } from "@/features/dashboard/components/modals/edit-user-modal";
import { ViewUserModal } from "@/features/dashboard/components/modals/view-user-modal";
import {
  useGetUsers,
  useDeleteUser,
  useGetLandlords,
} from "@/features/user/useUser";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";

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

export default function UsersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data: usersData, isLoading } = useGetUsers({
    page: currentPage,
    limit: 10,
    name: debouncedSearchQuery || undefined,
    status:
      statusFilter === "ALL"
        ? undefined
        : (statusFilter as "ACTIVE" | "INACTIVE" | "BLOCKED"),
    roleId: roleFilter === "ALL" ? undefined : Number(roleFilter),
  });

  const deleteUserMutation = useDeleteUser();

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleConfirmDelete = (userId: number) => {
    const user = usersData?.data.find((u) => u.id === userId) || null;
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUserMutation.mutateAsync(selectedUser.id);
      toast.success("Xóa người dùng thành công");
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
        toast.error("Xóa người dùng thất bại");
      }
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Quản lý người dùng</h1>
      </header>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 md:max-w-sm">
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

              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between w-full md:w-auto">
                <UserFilters
                  onStatusFilterChange={handleStatusFilterChange}
                  onRoleFilterChange={handleRoleFilterChange}
                />

                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Thêm người dùng</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable
          columns={
            userColumns({
              onDelete: handleConfirmDelete,
              onEdit: handleEditUser,
              onView: handleViewUser,
            }) as ColumnDef<User>[]
          }
          data={usersData?.data || []}
          currentPage={currentPage}
          totalPages={usersData?.totalPages || 1}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />

        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={selectedUser}
        />

        <ViewUserModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          user={selectedUser}
        />

        {/* Dialog xác nhận xóa */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                {selectedUser
                  ? `Bạn có chắc chắn muốn xóa người dùng ${selectedUser.name}?`
                  : "Bạn có chắc chắn muốn xóa người dùng này?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Đang xóa..." : "Xóa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarInset>
  );
}
