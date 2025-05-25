"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { toast } from "sonner";
import {
  roleColumns,
  Role,
} from "@/features/dashboard/components/columns/role-columns";
import { useGetRoles, useDeleteRole } from "@/features/role/useRole";
import { RoleModal } from "@/features/dashboard/components/modals/role-modal";
import { RolePermissionsModal } from "@/features/dashboard/components/modals/role-permissions-modal";

export default function RolesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: rolesData, isLoading } = useGetRoles({
    page: currentPage,
    limit: 10,
    staleTime: 0,
  });

  const deleteRoleMutation = useDeleteRole();

  const handleEditRole = (role: Role) => {
    // Kiểm tra xem vai trò có phải là vai trò cơ bản không
    const baseRoles = ["ADMIN", "CLIENT", "LANDLORD"];
    if (baseRoles.includes(role.name)) {
      toast.warning(
        "Không thể chỉnh sửa vai trò cơ bản của hệ thống. Bạn chỉ có thể thay đổi phân quyền cho vai trò này."
      );
      return;
    }

    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handleAssignPermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsModalOpen(true);
  };

  const handleConfirmDelete = (roleId: number) => {
    const role = rolesData?.data.find((r) => r.id === roleId) || null;
    setSelectedRole(role as Role);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      await deleteRoleMutation.mutateAsync(selectedRole.id);
      toast.success("Xóa vai trò thành công");
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
        toast.error("Xóa vai trò thất bại");
      }
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleClosePermissionsModal = () => {
    setIsPermissionsModalOpen(false);
    setSelectedRole(null);
  };

  const enhancedData = (rolesData?.data || []).map((role: any) => {
    return {
      ...role,
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
    };
  }) as Role[];

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Quản lý quyền</h1>
      </header>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 md:max-w-sm">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm vai trò..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>

              {/* <div className="flex justify-end">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Thêm vai trò</span>
                </Button>
              </div> */}
            </div>
          </CardContent>
        </Card>

        <DataTable<Role, unknown>
          columns={roleColumns({
            onDelete: handleConfirmDelete,
            onEdit: handleEditRole,
            onAssignPermissions: handleAssignPermissions,
          })}
          data={enhancedData}
          currentPage={currentPage}
          totalPages={rolesData?.totalPages || 1}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />

        <RoleModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
        />

        <RoleModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          role={selectedRole}
          mode="edit"
        />

        <RolePermissionsModal
          isOpen={isPermissionsModalOpen}
          onClose={handleClosePermissionsModal}
          role={selectedRole}
        />

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                {selectedRole
                  ? `Bạn có chắc chắn muốn xóa vai trò ${selectedRole.name}?`
                  : "Bạn có chắc chắn muốn xóa vai trò này?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDeleteRole}
                disabled={deleteRoleMutation.isPending}
              >
                {deleteRoleMutation.isPending ? "Đang xóa..." : "Xóa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarInset>
  );
}
