"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SystemSetting } from "@/features/system-setting/system-setting.api";
import { useDeleteSetting, useGetAllSettings } from "../useSystemSetting";
import { MoreHorizontal, Plus, Trash, Edit, FileEdit } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SystemSettingForm } from "./system-setting-form";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SystemSettingValueDisplay } from "@/features/system-setting/components/system-setting-value-display";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type SystemSettingListProps = {
  group?: string;
};

export function SystemSettingList({ group }: SystemSettingListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: settings, isLoading, refetch } = useGetAllSettings();
  const { mutateAsync: deleteSetting } = useDeleteSetting();

  const filteredSettings = (
    group ? settings?.filter((setting) => setting.group === group) : settings
  )?.filter(
    (setting) =>
      !searchQuery ||
      setting.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (setting.description &&
        setting.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupLabel = (groupName: string) => {
    switch (groupName) {
      case "interface":
        return "Giao diện";
      case "email":
        return "Mẫu Email";
      case "pricing":
        return "Giá dịch vụ";
      default:
        return groupName;
    }
  };

  const typeLabel = (typeName: string) => {
    switch (typeName) {
      case "string":
        return "Chuỗi";
      case "number":
        return "Số";
      case "boolean":
        return "Boolean";
      case "json":
        return "JSON";
      case "file":
        return "File";
      default:
        return typeName;
    }
  };

  const handleDelete = async () => {
    if (!selectedSetting) return;

    try {
      await deleteSetting(selectedSetting.key);
      toast.success("Xóa cài đặt thành công");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Không thể xóa cài đặt này");
    }
  };

  const handleEdit = (setting: SystemSetting) => {
    setSelectedSetting(setting);
    setIsEditDialogOpen(true);
  };

  const handleView = (setting: SystemSetting) => {
    setSelectedSetting(setting);
    setIsViewDialogOpen(true);
  };

  const formatValuePreview = (setting: SystemSetting) => {
    if (!setting.value) return "---";

    if (setting.type === "json") {
      try {
        return "JSON Object";
      } catch {
        return (
          setting.value.substring(0, 50) +
          (setting.value.length > 50 ? "..." : "")
        );
      }
    }

    if (setting.value.length > 50) {
      return setting.value.substring(0, 50) + "...";
    }

    return setting.value;
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base font-medium">
              {group ? `Cài đặt ${groupLabel(group)}` : "Tất cả cài đặt"}
            </CardTitle>
            <CardDescription className="text-sm">
              {group
                ? `Quản lý các cài đặt thuộc nhóm ${groupLabel(group)}`
                : "Quản lý tất cả các cài đặt hệ thống"}
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            size="sm"
            className="gap-1"
          >
            <Plus className="h-4 w-4" /> Thêm mới
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo khóa hoặc mô tả..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          ) : filteredSettings && filteredSettings.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[250px]">Khóa</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead className="w-[100px]">Loại</TableHead>
                    <TableHead className="w-[120px]">Nhóm</TableHead>
                    <TableHead className="w-[80px] text-right">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSettings.map((setting) => (
                    <TableRow key={setting.key} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {setting.key}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {formatValuePreview(setting)}
                      </TableCell>
                      <TableCell>{typeLabel(setting.type)}</TableCell>
                      <TableCell>{groupLabel(setting.group)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Mở menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleView(setting)}
                            >
                              <FileEdit className="mr-2 h-4 w-4" /> Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(setting)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSetting(setting);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" /> Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-center items-center h-24 bg-muted/10 rounded-lg border border-dashed">
              <p className="text-muted-foreground">Không có dữ liệu</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog thêm cài đặt mới */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogTitle>Thêm cài đặt mới</DialogTitle>
          <SystemSettingForm
            onSuccess={() => {
              refetch();
              setIsAddDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa cài đặt */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogTitle>Chỉnh sửa cài đặt</DialogTitle>
          <SystemSettingForm
            initialData={selectedSetting || undefined}
            onSuccess={() => {
              refetch();
              setIsEditDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog xem chi tiết cài đặt */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
          <DialogTitle>Chi tiết cài đặt</DialogTitle>
          {selectedSetting && (
            <SystemSettingValueDisplay setting={selectedSetting} />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa cài đặt này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
