"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileTab from "@/features/users/components/profile-tab";
import SecurityTab from "@/features/users/components/security-tab";
import { useAccountMe } from "@/features/users/useAccount";
import {
  UpdateUserBodySchema,
  UpdateUserBodyType,
} from "@/features/users/schema/account.schema";

export default function AccountForm() {
  const { data } = useAccountMe();
  const user = data?.payload;

  const [isLoading, setIsLoading] = useState(false);
  const [landlordStatus, setLandlordStatus] = useState(user?.status);
  const form = useForm<UpdateUserBodyType>({
    resolver: zodResolver(UpdateUserBodySchema),
    defaultValues: {
      name: user?.name || "",
      avatar: user?.avatar || "",
      phoneNumber: user?.phoneNumber || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber,
      });
    }
  }, [user, form]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardHeader className="bg-primary text-primary-foreground p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-primary-foreground shadow-lg">
              <AvatarImage
                src={
                  form.watch("avatar") || "/placeholder.svg?height=96&width=96"
                }
                alt="Avatar"
              />
              <AvatarFallback className="bg-primary-foreground text-primary text-xl">
                {form.watch("name")!.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <Upload className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {form.watch("name") || "Tên người dùng"}
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
