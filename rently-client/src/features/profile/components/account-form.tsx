"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Upload,
  Wallet,
  User,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AccountTabs } from "@/features/profile/components/account-tabs";
import { useAccountMe } from "@/features/profile/useProfile";
import { UpdateMeBodySchema, UpdateMeBodyType } from "@/schemas/profile.model";
import { useUploadImage } from "@/features/media/useMedia";
import { Role } from "@/constants/type";
import { useCheckRoleUpgradeStatus } from "@/features/role-upgrade-request/role-upgrade-request.hook";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function AccountForm() {
  const { data } = useAccountMe();
  const user = data?.payload;
  const { data: roleUpgradeStatus } = useCheckRoleUpgradeStatus();

  const uploadAvatarMutation = useUploadImage();

  const [isLoading, setIsLoading] = useState(false);
  const [landlordStatus, setLandlordStatus] = useState<
    "ACTIVE" | "PENDING" | "REJECTED" | "none"
  >("none");

  const form = useForm<UpdateMeBodyType>({
    resolver: zodResolver(UpdateMeBodySchema),
    defaultValues: {
      name: user?.name || "",
      avatar: user?.avatar || "",
      phoneNumber: user?.phoneNumber || "",
    },
  });

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        avatar: user.avatar || "",
        phoneNumber: user.phoneNumber || "",
      });

      if (user.role.name === Role.Landlord) {
        setLandlordStatus("ACTIVE");
      }
    }
  }, [user, form]);

  useEffect(() => {
    if (roleUpgradeStatus) {
      if (roleUpgradeStatus.status === "PENDING") {
        setLandlordStatus("PENDING");
      } else if (roleUpgradeStatus.status === "REJECTED") {
        setLandlordStatus("REJECTED");
      }
    } else if (user?.role.name !== Role.Landlord) {
      setLandlordStatus("none");
    }
  }, [roleUpgradeStatus]);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);
        const response = await uploadAvatarMutation.mutateAsync(formData);

        const imageUrl = response.payload.url;
        form.setValue("avatar", imageUrl);
      } catch (error) {
        console.error("Lỗi upload ảnh:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  const watchedName = form.watch("name") || "";
  const watchedAvatar =
    form.watch("avatar") || "/placeholder.svg?height=96&width=96";

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardHeader className="bg-primary text-primary-foreground p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Phần Avatar */}
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-primary-foreground shadow-lg">
              <AvatarImage src={watchedAvatar} alt="Avatar" />
              <AvatarFallback className="bg-primary-foreground text-primary text-xl">
                {watchedName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              ref={avatarInputRef}
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <div
              className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Upload className="h-6 w-6 text-white" />
              )}
            </div>
          </div>

          {/* Thông tin cơ bản */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {watchedName || "Tên người dùng"}
                </h2>
                <p className="text-primary-foreground/80 flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email || "abc@gmail.com"}
                </p>
                <p className="text-primary-foreground/80 flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4" />
                  {user.phoneNumber || "Chưa cập nhật"}
                </p>
                <p className="text-primary-foreground/80 flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  Tham gia:{" "}
                  {format(new Date(user.createdAt), "dd MMMM, yyyy", {
                    locale: vi,
                  })}
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
                <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-md px-3 py-2">
                  <Wallet className="h-5 w-5" />
                  <div>
                    <p className="text-xs text-primary-foreground/90">Số dư</p>
                    <p className="font-bold">
                      {user.balance?.toLocaleString()} VNĐ
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  {user?.role.name === Role.Admin && (
                    <Badge className="bg-purple-500 hover:bg-purple-500/95">
                      Quản trị viên
                    </Badge>
                  )}
                  {user?.role.name === Role.Landlord && (
                    <Badge className="bg-green-500 hover:bg-green-500/95">
                      Người cho thuê
                    </Badge>
                  )}
                  {user?.role.name === Role.Client && (
                    <Badge className="bg-blue-500 hover:bg-blue-500/95">
                      Người dùng
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <AccountTabs
          form={form}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          landlordStatus={landlordStatus}
          setLandlordStatus={setLandlordStatus}
        />
      </CardContent>
    </Card>
  );
}
