"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Role } from "@/features/dashboard/components/columns/role-columns";
import { useCreateRole, useUpdateRole } from "@/features/role/useRole";
import { toast } from "sonner";

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  mode: "create" | "edit";
}

export function RoleModal({ isOpen, onClose, role, mode }: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    permissionIds: [] as number[],
  });

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen && mode === "edit" && role) {
      setFormData({
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        permissionIds: role.permissions?.map((p) => p.id) || [],
      });
    } else if (isOpen && mode === "create") {
      setFormData({
        name: "",
        description: "",
        isActive: true,
        permissionIds: [],
      });
    }
  }, [isOpen, role, mode]);

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === "create") {
        // Khi tạo mới, chỉ gửi các trường cần thiết (không gửi permissionIds)
        const createData = {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
        };
        await createRoleMutation.mutateAsync(createData);
        toast.success("Tạo vai trò thành công");
      } else if (mode === "edit" && role) {
        // Khi cập nhật, gửi đầy đủ các trường bao gồm permissionIds
        await updateRoleMutation.mutateAsync({
          roleId: role.id,
          body: {
            name: formData.name,
            description: formData.description,
            isActive: formData.isActive,
            permissionIds: formData.permissionIds,
          },
        });
        toast.success("Cập nhật vai trò thành công");
      }
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
        toast.error(
          mode === "create"
            ? "Tạo vai trò thất bại"
            : "Cập nhật vai trò thất bại"
        );
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tạo mới vai trò" : "Chỉnh sửa vai trò"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên vai trò</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nhập tên vai trò"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả vai trò"
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked === true })
              }
            />
            <Label htmlFor="isActive" className="text-sm font-medium">
              Hoạt động
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={
                createRoleMutation.isPending || updateRoleMutation.isPending
              }
            >
              {createRoleMutation.isPending || updateRoleMutation.isPending
                ? "Đang xử lý..."
                : mode === "create"
                ? "Tạo vai trò"
                : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
