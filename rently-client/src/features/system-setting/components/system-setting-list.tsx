"use client";

import { useState, useEffect } from "react";
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
import {
  MoreHorizontal,
  Plus,
  Trash,
  Edit,
  FileEdit,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SYSTEM_SETTING_GROUPS } from "./system-setting-constants";
import { Skeleton } from "@/components/ui/skeleton";

type SystemSettingListProps = {
  group?: string;
};

export function SystemSettingList({ group }: SystemSettingListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddConfirmDialogOpen, setIsAddConfirmDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const {
    data: settings,
    isLoading,
    refetch,
    isRefetching,
  } = useGetAllSettings();
  const { mutateAsync: deleteSetting, isPending: isDeleting } =
    useDeleteSetting();

  // Lọc và sắp xếp cài đặt
  const filteredSettings = (
    group ? settings?.filter((setting) => setting.group === group) : settings
  )
    ?.filter(
      (setting) =>
        (!searchQuery ||
          setting.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (setting.description &&
            setting.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))) &&
        (!typeFilter || typeFilter === "all" || setting.type === typeFilter)
    )
    ?.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.key.localeCompare(b.key);
      } else {
        return b.key.localeCompare(a.key);
      }
    });

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
      refetch();
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

  const getGroupBadgeColor = (groupName: string) => {
    switch (groupName) {
      case "interface":
        return "bg-blue-100 text-blue-800";
      case "email":
        return "bg-green-100 text-green-800";
      case "pricing":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddSetting = () => {
    setIsAddConfirmDialogOpen(true);
  };

  const confirmAddSetting = () => {
    setIsAddConfirmDialogOpen(false);
    setIsAddDialogOpen(true);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Hàm reset tất cả các bộ lọc
  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  // Kiểm tra xem có bộ lọc nào đang được áp dụng không
  const hasActiveFilters = searchQuery || typeFilter;

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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center gap-1"
            >
              {isRefetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
            <Button
              onClick={handleAddSetting}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">Thêm cài đặt</span>
            </Button>
          </div>
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
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Lọc theo loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    <SelectItem value="string">Chuỗi</SelectItem>
                    <SelectItem value="number">Số</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="flex items-center gap-1"
                  >
                    <span>Xóa bộ lọc</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredSettings && filteredSettings.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="min-w-[200px]">
                        <div
                          className="flex items-center gap-1 cursor-pointer"
                          onClick={toggleSortOrder}
                        >
                          Khóa
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[150px]">Giá trị</TableHead>
                      <TableHead className="min-w-[80px]">Loại</TableHead>
                      <TableHead className="min-w-[100px]">Nhóm</TableHead>
                      <TableHead className="min-w-[80px] text-right">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSettings.map((setting) => (
                      <TableRow key={setting.key} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {setting.key}
                          {setting.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]">
                              {setting.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          <div
                            className="cursor-pointer hover:underline"
                            onClick={() => handleView(setting)}
                          >
                            {formatValuePreview(setting)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {typeLabel(setting.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`font-normal ${getGroupBadgeColor(setting.group)}`}
                          >
                            {groupLabel(setting.group)}
                          </Badge>
                        </TableCell>
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
                                <FileEdit className="mr-2 h-4 w-4" /> Xem chi
                                tiết
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
              <div className="py-2 px-4 bg-muted/20 text-sm text-muted-foreground">
                Hiển thị {filteredSettings.length} cài đặt{" "}
                {hasActiveFilters ? "(đã lọc)" : ""}
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-32 bg-muted/10 rounded-lg border border-dashed gap-3">
              {hasActiveFilters ? (
                <>
                  <p className="text-muted-foreground">
                    Không tìm thấy cài đặt nào phù hợp với bộ lọc
                  </p>
                  <Button variant="outline" onClick={resetFilters}>
                    Xóa bộ lọc
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">Không có dữ liệu</p>
                  <Button variant="outline" onClick={handleAddSetting}>
                    <Plus className="h-4 w-4 mr-2" /> Thêm cài đặt mới
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog xác nhận thêm cài đặt */}
      <Dialog
        open={isAddConfirmDialogOpen}
        onOpenChange={setIsAddConfirmDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Xác nhận thêm cài đặt</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn thêm cài đặt mới? Hãy đảm bảo rằng bạn hiểu rõ
            về cài đặt bạn sắp thêm và tác động của nó đến hệ thống.
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddConfirmDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={confirmAddSetting}>Tiếp tục</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog thêm cài đặt mới */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogTitle>Thêm cài đặt mới</DialogTitle>
          <SystemSettingForm
            initialGroup={group}
            onSuccess={() => {
              refetch();
              setIsAddDialogOpen(false);
              toast.success("Đã thêm cài đặt mới thành công");
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa cài đặt */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogTitle>Chỉnh sửa cài đặt</DialogTitle>
          <SystemSettingForm
            initialData={selectedSetting || undefined}
            onSuccess={() => {
              refetch();
              setIsEditDialogOpen(false);
              toast.success("Đã cập nhật cài đặt thành công");
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog xem chi tiết cài đặt */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-auto">
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
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
