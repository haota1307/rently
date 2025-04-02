import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateUser } from "@/features/user/useUser";
import { UserStatus } from "@/constants/auth.constant";

type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    roleId: 3, // Mặc định là người dùng
    status: UserStatus.ACTIVE as UserStatusType,
  });

  const createUserMutation = useCreateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber || null,
        password: formData.password,
        roleId: Number(formData.roleId),
        avatar: null,
        status: formData.status,
      });
      toast.success("Thêm người dùng thành công");
      onClose();
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        password: "",
        roleId: 3,
        status: UserStatus.ACTIVE as UserStatusType,
      });
    } catch (error: any) {
      console.error("Error creating user:", error);

      // Xử lý lỗi từ server
      if (error.response?.data) {
        const errorData = error.response.data;

        // Kiểm tra nếu có message là mảng
        if (Array.isArray(errorData.message)) {
          errorData.message.forEach((err: any) => {
            if (
              err.path === "email" &&
              err.message === "Error.UserAlreadyExists"
            ) {
              toast.error("Email đã tồn tại trong hệ thống");
            } else {
              toast.error(`Lỗi: ${err.path} - ${err.message}`);
            }
          });
        } else if (typeof errorData.message === "string") {
          toast.error(errorData.message);
        } else {
          toast.error("Thêm người dùng thất bại");
        }
      } else {
        toast.error("Thêm người dùng thất bại");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm người dùng mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Vai trò</Label>
            <Select
              value={formData.roleId.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, roleId: Number(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Quản trị viên</SelectItem>
                <SelectItem value="2">Người cho thuê</SelectItem>
                <SelectItem value="3">Người dùng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as UserStatusType })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserStatus.ACTIVE}>Hoạt động</SelectItem>
                <SelectItem value={UserStatus.INACTIVE}>
                  Không hoạt động
                </SelectItem>
                <SelectItem value={UserStatus.BLOCKED}>Bị khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Đang xử lý..." : "Thêm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
