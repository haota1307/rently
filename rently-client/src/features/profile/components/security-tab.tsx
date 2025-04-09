"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import { Lock, UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useCheckRoleUpgradeStatus } from "@/features/role-upgrade-request/role-upgrade-request.hook";
import PasswordDialog from "./password-dialog";
import LandlordDialog from "./landlord-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SecurityTabProps {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  landlordStatus: any;
  setLandlordStatus: Dispatch<SetStateAction<any>>;
}

export default function SecurityTab({
  isLoading,
  setIsLoading,
  landlordStatus,
  setLandlordStatus,
}: SecurityTabProps) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLandlordDialogOpen, setIsLandlordDialogOpen] = useState(false);
  const { data: roleUpgradeStatus } = useCheckRoleUpgradeStatus();

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Mật khẩu</h3>
              <p className="text-sm text-muted-foreground">
                Cập nhật mật khẩu đăng nhập của bạn
              </p>
            </div>
          </div>
          <PasswordDialog
            isOpen={isPasswordDialogOpen}
            setIsOpen={setIsPasswordDialogOpen}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-full bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Trở thành người cho thuê</h3>
                <p className="text-sm text-muted-foreground">
                  {landlordStatus === "none" &&
                    "Đăng ký để trở thành người cho thuê và bắt đầu kinh doanh"}
                  {landlordStatus === "PENDING" &&
                    "Yêu cầu của bạn đang được xem xét"}
                  {landlordStatus === "ACTIVE" && "Bạn đã là người cho thuê"}
                  {landlordStatus === "REJECTED" &&
                    "Yêu cầu của bạn đã bị từ chối. Bạn có thể gửi lại yêu cầu"}
                </p>
              </div>
            </div>
            <LandlordDialog
              isOpen={isLandlordDialogOpen}
              setIsOpen={setIsLandlordDialogOpen}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              landlordStatus={landlordStatus}
              setLandlordStatus={setLandlordStatus}
            />
          </div>
        </div>

        {/* Hiển thị lý do từ chối nếu có */}
        {landlordStatus === "REJECTED" && roleUpgradeStatus?.note && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lý do từ chối</AlertTitle>
            <AlertDescription>{roleUpgradeStatus.note}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
