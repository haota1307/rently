import { useEffect, useState } from "react";
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
import { useUpdateUser } from "@/features/user/useUser";
import { UserStatus } from "@/constants/auth.constant";
import { User } from "@/features/dashboard/components/columns/user-columns";
import { UpdateUserBodyType } from "@/schemas/user.schema";

type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    roleId: 3,
    status: UserStatus.ACTIVE as UserStatusType,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        password: "", // Không hiển thị mật khẩu
        roleId: user.roleId,
        status: user.status as UserStatusType,
      });
    }
  }, [user]);

  const updateUserMutation = useUpdateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Chỉ gửi những thông tin đã thay đổi
      const updateData: Partial<UpdateUserBodyType> = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber || null,
        roleId: formData.roleId,
        status: formData.status,
      };

      // Chỉ thêm password nếu người dùng nhập
      if (formData.password) {
        updateData.password = formData.password;
      }

      await updateUserMutation.mutateAsync({
        userId: user.id,
        body: updateData as UpdateUserBodyType,
      });

      toast.success("Cập nhật thông tin người dùng thành công");
      onClose();
    } catch (error: any) {
      console.error("Error updating user:", error);

      // Xử lý lỗi từ server
      if (error.response?.data) {
        const errorData = error.response.data;

        if (Array.isArray(errorData.message)) {
          // Hiển thị thông báo lỗi
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
          toast.error("Cập nhật thông tin người dùng thất bại");
        }
      } else {
        toast.error("Cập nhật thông tin người dùng thất bại");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle>
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
            <Label htmlFor="password">
              Mật khẩu mới (để trống nếu không thay đổi)
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
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
            <Button type="submit" disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "Đang xử lý..." : "Cập nhật"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
