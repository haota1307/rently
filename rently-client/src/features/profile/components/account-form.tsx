"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileTab from "@/features/profile/components/profile-tab";
import SecurityTab from "@/features/profile/components/security-tab";
import { useAccountMe } from "@/features/profile/useProfile";
import { UpdateMeBodySchema, UpdateMeBodyType } from "@/schemas/profile.model";

export default function AccountForm() {
  const { data } = useAccountMe();
  const user = data?.payload;

  const [isLoading, setIsLoading] = useState(false);
  const [landlordStatus, setLandlordStatus] = useState(
    user?.status || "INACTIVE"
  );

  const form = useForm<UpdateMeBodyType>({
    resolver: zodResolver(UpdateMeBodySchema),
    defaultValues: {
      name: user?.name || "",
      avatar: user?.avatar || "",
      phoneNumber: user?.phoneNumber || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        avatar: user.avatar || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user, form]);

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  // Lấy các giá trị đã được watch và ép về chuỗi nếu cần
  const watchedName = form.watch("name") || "";
  const watchedAvatar =
    form.watch("avatar") || "/placeholder.svg?height=96&width=96";

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardHeader className="bg-primary text-primary-foreground p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-primary-foreground shadow-lg">
              <AvatarImage src={watchedAvatar} alt="Avatar" />
              <AvatarFallback className="bg-primary-foreground text-primary text-xl">
                {watchedName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <Upload className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {watchedName || "Tên người dùng"}
            </h2>
            <p className="text-primary-foreground/80">
              {user.email || "abc@gmail.com"}
            </p>
            {landlordStatus === "ACTIVE" && (
              <Badge className="mt-2 bg-green-500 text-primary hover:bg-green-500/95">
                Người cho thuê
              </Badge>
            )}
            {landlordStatus === "INACTIVE" && (
              <Badge className="mt-2 bg-red-600 hover:bg-red-600/95 text-white">
                Đang xét duyệt
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
            <TabsTrigger value="security">Bảo mật</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileTab
              form={form}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </TabsContent>
          <TabsContent value="security">
            <SecurityTab
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              landlordStatus={landlordStatus}
              setLandlordStatus={setLandlordStatus}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
