"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import { Lock, UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import PasswordDialog from "./password-dialog";
import LandlordDialog from "./landlord-dialog";

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
                {landlordStatus === "pending" &&
                  "Yêu cầu của bạn đang được xem xét"}
                {landlordStatus === "approved" && "Bạn đã là người cho thuê"}
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
    </div>
  );
}
