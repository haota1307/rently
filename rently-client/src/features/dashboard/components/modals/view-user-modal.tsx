import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGetUserDetail } from "@/features/user/useUser";
import { User } from "@/features/dashboard/components/columns/user-columns";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { UserCircle, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SendUserEmailModal } from "@/features/dashboard/components/modals/send-user-email-modal";

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function ViewUserModal({ isOpen, onClose, user }: ViewUserModalProps) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Lấy thông tin chi tiết của người dùng
  const { data: userDetail, isLoading } = useGetUserDetail(user?.id || 0, {
    enabled: !!user && isOpen && user.id > 0,
  });

  // Hiển thị trạng thái
  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "INACTIVE":
        return "Không hoạt động";
      case "BLOCKED":
        return "Bị khóa";
      default:
        return status;
    }
  };

  // Hiển thị vai trò
  const getRoleText = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "Quản trị viên";
      case 2:
        return "Người cho thuê";
      case 3:
        return "Người dùng";
      default:
        return `Vai trò #${roleId}`;
    }
  };

  // Format ngày tháng
  const formatDate = (date: Date | string) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const handleSendEmail = () => {
    setIsEmailModalOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thông tin chi tiết người dùng</DialogTitle>
          </DialogHeader>

          {!user ? (
            <div className="text-center py-4 text-gray-500">
              Không tìm thấy thông tin người dùng
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : userDetail ? (
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24 border-2 border-gray-200">
                  <AvatarImage
                    src={userDetail.avatar || undefined}
                    alt={`Avatar của ${userDetail.name}`}
                  />
                  <AvatarFallback className="text-lg">
                    {userDetail.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-gray-500">
                    Họ và tên
                  </h3>
                  <p className="text-base">{userDetail.name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-500">Email</h3>
                  <p className="text-base">{userDetail.email}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-500">
                    Số điện thoại
                  </h3>
                  <p className="text-base">
                    {userDetail.phoneNumber || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-500">Vai trò</h3>
                  <p className="text-base">{getRoleText(userDetail.roleId)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-500">
                    Trạng thái
                  </h3>
                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${
                      userDetail.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : userDetail.status === "INACTIVE"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {getStatusText(userDetail.status)}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-500">Số dư</h3>
                  <p className="text-base">
                    {userDetail.balance?.toLocaleString()} VND
                  </p>
                </div>
              </div>

              {/* Thông tin thời gian */}
              <div className="border-t pt-3 mt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">
                      Ngày tạo
                    </h3>
                    <p className="text-sm">
                      {formatDate(userDetail.createdAt)}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">
                      Cập nhật lần cuối
                    </h3>
                    <p className="text-sm">
                      {formatDate(userDetail.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleSendEmail}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Gửi email
                </Button>
                <Button onClick={onClose}>Đóng</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Không tìm thấy thông tin chi tiết của người dùng
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <SendUserEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        user={user}
      />
    </>
  );
}
