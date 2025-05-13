"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { useUpdateRole, useGetRoleDetail } from "@/features/role/useRole";
import { useGetAllPermissions } from "@/features/permission/usePermission";
import { Role } from "@/features/dashboard/components/columns/role-columns";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PermissionType } from "@/schemas/permission.schema";
import { Badge } from "@/components/ui/badge";

// Interface để nhóm permissions theo module
interface GroupedPermissions {
  [key: string]: PermissionType[];
}

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
}

export function RolePermissionsModal({
  isOpen,
  onClose,
  role,
}: RolePermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  // Lưu trữ danh sách quyền ban đầu để có thể khôi phục
  const originalPermissionsRef = useRef<number[]>([]);

  // Fetch chi tiết role để có thông tin quyền đầy đủ nhất
  const { data: roleDetail, isLoading: isLoadingRoleDetail } = useGetRoleDetail(
    role?.id || 0
  );
  const { data: permissions = [], isLoading: isLoadingPermissions } =
    useGetAllPermissions();
  const updateRoleMutation = useUpdateRole();

  // Khởi tạo danh sách quyền đã chọn khi modal mở và có dữ liệu
  useEffect(() => {
    if (isOpen && roleDetail?.permissions) {
      const permissionIds = roleDetail.permissions.map((p) => p.id);
      setSelectedPermissions(permissionIds);
      originalPermissionsRef.current = [...permissionIds]; // Lưu trữ danh sách quyền ban đầu
    } else if (isOpen && role?.permissions) {
      // Fallback nếu không có dữ liệu chi tiết
      const permissionIds = role.permissions.map((p) => p.id);
      setSelectedPermissions(permissionIds);
      originalPermissionsRef.current = [...permissionIds];
    }
  }, [isOpen, roleDetail, role]);

  // Reset về trạng thái ban đầu khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Nhóm permissions theo module
  const groupedPermissions: GroupedPermissions = permissions.reduce(
    (groups: GroupedPermissions, permission) => {
      const module = permission.module;
      if (!groups[module]) {
        groups[module] = [];
      }
      groups[module].push(permission);
      return groups;
    },
    {}
  );

  // Lọc permissions theo search query
  const filteredGroups = Object.entries(groupedPermissions)
    .filter(([module, permissions]) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return (
        module.toLowerCase().includes(query) ||
        permissions.some(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.path.toLowerCase().includes(query)
        )
      );
    })
    .sort(([a], [b]) => a.localeCompare(b)); // Sắp xếp theo tên module

  const handleTogglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAllInModule = (modulePermissions: PermissionType[]) => {
    const modulePermissionIds = modulePermissions.map((p) => p.id);
    const allSelected = modulePermissionIds.every((id) =>
      selectedPermissions.includes(id)
    );

    if (allSelected) {
      // Nếu tất cả đã được chọn, bỏ chọn tất cả
      setSelectedPermissions((prev) =>
        prev.filter((id) => !modulePermissionIds.includes(id))
      );
    } else {
      // Nếu chưa chọn hết, chọn tất cả
      setSelectedPermissions((prev) => {
        const newPermissions = [...prev];
        modulePermissionIds.forEach((id) => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id);
          }
        });
        return newPermissions;
      });
    }
  };

  // Reset danh sách quyền về trạng thái ban đầu
  const handleReset = () => {
    setSelectedPermissions([...originalPermissionsRef.current]);
    toast.info("Đã khôi phục danh sách quyền về trạng thái ban đầu");
  };

  // Chọn tất cả quyền
  const handleSelectAll = () => {
    setSelectedPermissions(permissions.map((p) => p.id));
  };

  // Bỏ chọn tất cả quyền
  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  const handleSave = async () => {
    if (!role) return;

    try {
      await updateRoleMutation.mutateAsync({
        roleId: role.id,
        body: {
          name: role.name,
          description: role.description,
          isActive: role.isActive,
          permissionIds: selectedPermissions,
        },
      });
      toast.success("Cập nhật quyền thành công");
      onClose();
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
        toast.error("Cập nhật quyền thất bại");
      }
    }
  };

  const isLoading = isLoadingPermissions || isLoadingRoleDetail;

  // Kiểm tra xem có thay đổi so với danh sách ban đầu không
  const hasChanges = () => {
    if (selectedPermissions.length !== originalPermissionsRef.current.length)
      return true;
    return !selectedPermissions.every((id) =>
      originalPermissionsRef.current.includes(id)
    );
  };

  // Hàm tạo className cho badge method
  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100";
      case "POST":
        return "bg-green-100";
      case "PUT":
        return "bg-amber-100";
      case "DELETE":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle>Gán quyền cho vai trò: {role?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 py-2">
          <div className="flex items-center mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm quyền..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Badge
              variant="outline"
              className="ml-2 px-3 py-1 whitespace-nowrap"
            >
              {selectedPermissions.length}/{permissions.length}
            </Badge>
          </div>

          <div className="flex mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="mr-2 h-8 px-2 py-0"
            >
              Tất cả
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              className="mr-2 h-8 px-2 py-0"
            >
              Bỏ chọn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges()}
              className="h-8 px-2 py-0 flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Khôi phục</span>
            </Button>
          </div>

          <ScrollArea className="flex-1 h-[350px] pr-4 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                Đang tải danh sách quyền...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Không tìm thấy quyền nào phù hợp
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGroups.map(([module, modulePermissions]) => (
                  <div key={module}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <h3 className="font-medium text-sm uppercase">
                          {module}
                        </h3>
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs py-0 h-5"
                        >
                          {modulePermissions.length} quyền
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Checkbox
                          id={`select-all-${module}`}
                          checked={modulePermissions.every((p) =>
                            selectedPermissions.includes(p.id)
                          )}
                          onCheckedChange={() =>
                            handleSelectAllInModule(modulePermissions)
                          }
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`select-all-${module}`}
                          className="text-xs cursor-pointer"
                        >
                          Chọn tất cả
                        </Label>
                      </div>
                    </div>
                    <div className="pl-0">
                      {modulePermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between py-1.5 border-b"
                        >
                          <div className="flex-1">
                            <div className="font-normal text-sm flex items-start">
                              <div className="min-w-[70px] flex items-center mr-2">
                                <div
                                  className={`px-1.5 py-0.5 text-xs rounded ${getMethodBadgeClass(
                                    permission.method
                                  )}`}
                                >
                                  {permission.method}
                                </div>
                              </div>
                              <div className="text-muted-foreground text-xs font-mono overflow-hidden text-ellipsis">
                                {permission.path}
                              </div>
                            </div>
                          </div>
                          <Checkbox
                            checked={selectedPermissions.includes(
                              permission.id
                            )}
                            onCheckedChange={() =>
                              handleTogglePermission(permission.id)
                            }
                            className="ml-2 h-4 w-4"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="border-t pt-2 pb-0 mt-auto">
          <Button variant="outline" onClick={onClose} size="sm">
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateRoleMutation.isPending}
            className="ml-2"
            size="sm"
          >
            {updateRoleMutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
