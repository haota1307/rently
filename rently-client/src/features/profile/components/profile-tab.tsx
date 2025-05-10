"use client";

import type { Dispatch, SetStateAction } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  useUpdateMeMutation,
  useAccountMe,
} from "@/features/profile/useProfile";
import { Loader2, Calendar, MapPin, User, Shield } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { Card, CardContent } from "@/components/ui/card";

import { toast } from "sonner";
import { UpdateMeBodyType } from "@/schemas/profile.model";
import { Role } from "@/constants/type";

interface ProfileTabProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

export default function ProfileTab({
  form,
  isLoading,
  setIsLoading,
}: ProfileTabProps) {
  const { mutateAsync: updateMe, isPending } = useUpdateMeMutation();
  const { data } = useAccountMe();
  const user = data?.payload;

  function onSubmit(data: UpdateMeBodyType) {
    if (isPending) return;
    setIsLoading(true);

    try {
      updateMe(data);

      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "Quản trị viên";
      case 2:
        return "Người cho thuê";
      case 3:
        return "Người dùng";
      default:
        return "Không xác định";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Thông tin cơ bản */}
        <div className="md:col-span-2">
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-medium flex items-center gap-2 mb-3 sm:mb-4">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Thông tin cá nhân
              </h3>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Họ và tên</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập họ và tên" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Số điện thoại
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập số điện thoại"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      )}
                      Lưu thay đổi
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar thông tin tài khoản */}
        <div>
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-medium flex items-center gap-2 mb-3 sm:mb-4">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                Thông tin tài khoản
              </h3>

              <div className="space-y-3 sm:space-y-4 text-sm">
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Email
                  </h4>
                  <p className="mt-1">{user?.email}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Vai trò
                  </h4>
                  <p className="mt-1">
                    {user?.role ? getRoleName(user.role.id) : "Không xác định"}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Ngày tham gia
                  </h4>
                  <p className="mt-1">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                      : "Không xác định"}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Trạng thái
                  </h4>
                  <div className="mt-1">
                    {user?.status === "ACTIVE" ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Hoạt động
                      </span>
                    ) : user?.status === "INACTIVE" ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                        Chưa kích hoạt
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        Bị khóa
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
