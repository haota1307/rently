"use client";

import { useState, useEffect, useCallback } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Edit,
  Loader2,
  Plus,
  Trash,
  XCircle,
  ArrowLeft,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useSubscriptionPlans } from "@/features/landlord-subscription/useSubscriptionPlans";
import { SubscriptionPlan } from "@/features/landlord-subscription/subscription.api";

export default function SubscriptionPlansPage() {
  const { plans, isLoading, updatePlan, addPlan, deletePlan } =
    useSubscriptionPlans();

  // Đơn giản hóa: chỉ sử dụng local state cho UI, update API khi onBlur
  const [localPrices, setLocalPrices] = useState<Record<string, number>>({});

  // Khởi tạo local prices từ plans (chỉ khi chưa có data)
  useEffect(() => {
    if (plans && plans.length > 0) {
      setLocalPrices((prev) => {
        // Chỉ init những plan chưa có trong local state
        const newPrices = { ...prev };
        let hasNewPlans = false;

        plans.forEach((plan) => {
          if (!(plan.id in newPrices)) {
            newPrices[plan.id] = plan.price;
            hasNewPlans = true;
          }
        });

        return hasNewPlans ? newPrices : prev;
      });
    }
  }, [plans]);

  // Function để handle price update khi blur
  const handlePriceUpdate = useCallback(
    (planId: string, newPrice: number) => {
      const originalPlan = plans?.find((p) => p.id === planId);
      if (originalPlan && Math.abs(originalPlan.price - newPrice) > 0.01) {
        updatePlan({
          planId,
          plan: { price: newPrice },
        });
      }
    },
    [plans, updatePlan]
  );

  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<SubscriptionPlan>>({
    id: "",
    name: "",
    description: "",
    price: 0,
    duration: 1,
    durationType: "months",
    features: [],
    isFreeTrial: false,
    isActive: true,
    color: "",
    badge: "",
    icon: "",
  });

  // Xử lý mở modal chỉnh sửa
  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan });
  };

  // Xử lý chỉnh sửa plan
  const handleUpdatePlan = () => {
    if (!editingPlan) return;

    updatePlan({
      planId: editingPlan.id,
      plan: editingPlan,
    });

    setEditingPlan(null);
  };

  // Xử lý thêm plan mới
  const handleAddPlan = () => {
    // Validate
    if (
      !newPlan.id ||
      !newPlan.name ||
      (newPlan?.price && newPlan?.price < 0)
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin hợp lệ");
      return;
    }

    addPlan(newPlan);
    setIsAddingPlan(false);
    setNewPlan({
      id: "",
      name: "",
      description: "",
      price: 0,
      duration: 1,
      durationType: "months",
      features: [],
      isFreeTrial: false,
      isActive: true,
      color: "",
      badge: "",
      icon: "",
    });
  };

  // Xử lý xóa plan
  const handleDeletePlan = (planId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa gói này?")) {
      deletePlan(planId);
    }
  };

  return (
    <SidebarInset>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-2 md:px-4 w-full sticky top-0 bg-background z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-base md:text-lg font-semibold">
          Quản lý gói Subscription
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={() =>
              (window.location.href = "/quan-ly/subscription-settings")
            }
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <Button
            onClick={() => setIsAddingPlan(true)}
            variant="default"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm gói mới
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Danh sách gói Subscription</CardTitle>
            <CardDescription>
              Quản lý các gói subscription cho landlord
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : plans && plans.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Chưa có gói subscription nào. Hãy thêm gói mới.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên gói</TableHead>
                    <TableHead>Giá tiền</TableHead>
                    <TableHead>Thời hạn</TableHead>
                    <TableHead>Tính năng</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans?.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {plan.description}
                          </div>
                          {plan.isFreeTrial && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 mt-1"
                            >
                              Dùng thử
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={localPrices[plan.id] ?? plan.price}
                            onChange={(e) => {
                              const newPrice = Number(e.target.value);
                              if (!isNaN(newPrice)) {
                                setLocalPrices((prev) => ({
                                  ...prev,
                                  [plan.id]: newPrice,
                                }));
                              }
                            }}
                            onBlur={(e) => {
                              const newPrice = Number(e.target.value);
                              if (!isNaN(newPrice)) {
                                handlePriceUpdate(plan.id, newPrice);
                              }
                            }}
                            className="w-24"
                          />
                          <span className="text-muted-foreground">VND</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {plan.duration}{" "}
                          {plan.durationType === "days"
                            ? "ngày"
                            : plan.durationType === "months"
                              ? "tháng"
                              : "năm"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] space-y-1">
                          {(plan.features?.length || 0) > 0 ? (
                            <>
                              <div className="text-sm font-medium mb-1">
                                {plan.features?.length} tính năng
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {plan.features
                                  ?.slice(0, 2)
                                  .map((feature, i) => (
                                    <span key={i} className="block truncate">
                                      • {feature as string}
                                    </span>
                                  ))}
                                {(plan.features?.length || 0) > 2 && (
                                  <span className="block text-xs text-muted-foreground">
                                    + {(plan.features?.length || 0) - 2} tính
                                    năng khác
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Chưa có tính năng
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {plan.color && (
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-3 w-3 rounded-full bg-${plan.color}-500`}
                              />
                              <span className="text-xs">{plan.color}</span>
                            </div>
                          )}
                          {plan.badge && (
                            <Badge
                              variant="secondary"
                              className="text-xs w-fit"
                            >
                              {plan.badge}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div
                            className={`h-2 w-2 rounded-full mr-2 ${
                              plan.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          <span className="text-sm">
                            {plan.isActive
                              ? "Đang hoạt động"
                              : "Không hoạt động"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePlan(plan.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal chỉnh sửa plan */}
      {editingPlan && (
        <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa gói subscription</DialogTitle>
              <DialogDescription>
                Thay đổi thông tin gói subscription
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Tên gói */}
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Tên gói
                </Label>
                <Input
                  id="edit-name"
                  value={editingPlan.name}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, name: e.target.value })
                  }
                  placeholder="Nhập tên gói subscription"
                />
              </div>

              {/* Mô tả */}
              <div className="space-y-2">
                <Label htmlFor="edit-desc" className="text-sm font-medium">
                  Mô tả
                </Label>
                <Textarea
                  id="edit-desc"
                  value={editingPlan.description || ""}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      description: e.target.value,
                    })
                  }
                  placeholder="Mô tả chi tiết về gói subscription"
                  className="min-h-[80px]"
                />
              </div>

              {/* Giá và Thời hạn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price" className="text-sm font-medium">
                    Giá (VND)
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        price: Number(e.target.value),
                      })
                    }
                    placeholder="299000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Thời hạn</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={editingPlan.duration}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          duration: Number(e.target.value),
                        })
                      }
                      placeholder="1"
                      className="flex-1"
                    />
                    <Select
                      value={editingPlan.durationType as string}
                      onValueChange={(val) =>
                        setEditingPlan({
                          ...editingPlan,
                          durationType: val as "days" | "months" | "years",
                        })
                      }
                    >
                      <SelectTrigger className="w-[100px] sm:w-[120px]">
                        <SelectValue placeholder="Đơn vị" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Ngày</SelectItem>
                        <SelectItem value="months">Tháng</SelectItem>
                        <SelectItem value="years">Năm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Tính năng */}
              <div className="space-y-2">
                <Label htmlFor="edit-features" className="text-sm font-medium">
                  Tính năng
                </Label>
                <div className="space-y-3">
                  {editingPlan?.features?.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature as string}
                        onChange={(e) => {
                          const newFeatures = [...(editingPlan.features || [])];
                          newFeatures[index] = e.target.value;
                          setEditingPlan({
                            ...editingPlan,
                            features: newFeatures,
                          });
                        }}
                        placeholder={`Tính năng ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => {
                          const newFeatures = [...(editingPlan.features || [])];
                          newFeatures.splice(index, 1);
                          setEditingPlan({
                            ...editingPlan,
                            features: newFeatures,
                          });
                        }}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      const newFeatures = [...(editingPlan.features || []), ""];
                      setEditingPlan({
                        ...editingPlan,
                        features: newFeatures,
                      });
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm tính năng
                  </Button>
                </div>
              </div>

              {/* Màu sắc và Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-color" className="text-sm font-medium">
                    Màu sắc
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={editingPlan.color || ""}
                      onValueChange={(val) =>
                        setEditingPlan({ ...editingPlan, color: val })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Chọn màu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="green">Xanh lá</SelectItem>
                        <SelectItem value="blue">Xanh dương</SelectItem>
                        <SelectItem value="amber">Vàng cam</SelectItem>
                        <SelectItem value="red">Đỏ</SelectItem>
                        <SelectItem value="purple">Tím</SelectItem>
                        <SelectItem value="pink">Hồng</SelectItem>
                      </SelectContent>
                    </Select>
                    {editingPlan.color && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                        <div
                          className={`w-4 h-4 rounded-full bg-${editingPlan.color}-500`}
                        />
                        <span className="text-xs hidden sm:inline">
                          {editingPlan.color}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-badge" className="text-sm font-medium">
                    Badge
                  </Label>
                  <Input
                    id="edit-badge"
                    value={editingPlan.badge || ""}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, badge: e.target.value })
                    }
                    placeholder="Phổ biến, Khuyến nghị..."
                  />
                </div>
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label htmlFor="edit-icon" className="text-sm font-medium">
                  Icon
                </Label>
                <Input
                  id="edit-icon"
                  value={editingPlan.icon || ""}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, icon: e.target.value })
                  }
                  placeholder="gift, calendar, crown, star..."
                />
              </div>

              {/* Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">
                      Dùng thử miễn phí
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cho phép người dùng dùng thử
                    </p>
                  </div>
                  <Switch
                    checked={editingPlan.isFreeTrial}
                    onCheckedChange={(checked) =>
                      setEditingPlan({ ...editingPlan, isFreeTrial: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">
                      Trạng thái hoạt động
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {editingPlan.isActive ? "Đang hoạt động" : "Tạm dừng"}
                    </p>
                  </div>
                  <Switch
                    checked={editingPlan.isActive}
                    onCheckedChange={(checked) =>
                      setEditingPlan({ ...editingPlan, isActive: checked })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingPlan(null)}
                className="w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button onClick={handleUpdatePlan} className="w-full sm:w-auto">
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal thêm plan mới */}
      <Dialog open={isAddingPlan} onOpenChange={setIsAddingPlan}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm gói subscription mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin cho gói subscription mới
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* ID và Tên gói */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-id" className="text-sm font-medium">
                  ID gói <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-id"
                  value={newPlan.id}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, id: e.target.value })
                  }
                  placeholder="basic_monthly"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-name" className="text-sm font-medium">
                  Tên gói <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-name"
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value })
                  }
                  placeholder="Gói cơ bản"
                />
              </div>
            </div>

            {/* Mô tả */}
            <div className="space-y-2">
              <Label htmlFor="add-desc" className="text-sm font-medium">
                Mô tả
              </Label>
              <Textarea
                id="add-desc"
                value={newPlan.description}
                onChange={(e) =>
                  setNewPlan({
                    ...newPlan,
                    description: e.target.value,
                  })
                }
                placeholder="Mô tả chi tiết về gói subscription"
                className="min-h-[80px]"
              />
            </div>

            {/* Giá và Thời hạn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-price" className="text-sm font-medium">
                  Giá (VND) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-price"
                  type="number"
                  value={newPlan.price}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      price: Number(e.target.value),
                    })
                  }
                  placeholder="299000"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Thời hạn <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newPlan.duration}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        duration: Number(e.target.value),
                      })
                    }
                    placeholder="1"
                    className="flex-1"
                  />
                  <Select
                    value={newPlan.durationType as string}
                    onValueChange={(val) =>
                      setNewPlan({
                        ...newPlan,
                        durationType: val as "days" | "months" | "years",
                      })
                    }
                  >
                    <SelectTrigger className="w-[100px] sm:w-[120px]">
                      <SelectValue placeholder="Đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Ngày</SelectItem>
                      <SelectItem value="months">Tháng</SelectItem>
                      <SelectItem value="years">Năm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tính năng */}
            <div className="space-y-2">
              <Label htmlFor="add-features" className="text-sm font-medium">
                Tính năng
              </Label>
              <div className="space-y-3">
                {newPlan.features?.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature as string}
                      onChange={(e) => {
                        const newFeatures = [...(newPlan.features || [])];
                        newFeatures[index] = e.target.value;
                        setNewPlan({
                          ...newPlan,
                          features: newFeatures,
                        });
                      }}
                      placeholder={`Tính năng ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => {
                        const newFeatures = [...(newPlan.features || [])];
                        newFeatures.splice(index, 1);
                        setNewPlan({
                          ...newPlan,
                          features: newFeatures,
                        });
                      }}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const newFeatures = [...(newPlan.features || []), ""];
                    setNewPlan({
                      ...newPlan,
                      features: newFeatures,
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm tính năng
                </Button>
              </div>
            </div>

            {/* Màu sắc và Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-color" className="text-sm font-medium">
                  Màu sắc
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={newPlan.color || ""}
                    onValueChange={(val) =>
                      setNewPlan({ ...newPlan, color: val })
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Chọn màu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="green">Xanh lá</SelectItem>
                      <SelectItem value="blue">Xanh dương</SelectItem>
                      <SelectItem value="amber">Vàng cam</SelectItem>
                      <SelectItem value="red">Đỏ</SelectItem>
                      <SelectItem value="purple">Tím</SelectItem>
                      <SelectItem value="pink">Hồng</SelectItem>
                    </SelectContent>
                  </Select>
                  {newPlan.color && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                      <div
                        className={`w-4 h-4 rounded-full bg-${newPlan.color}-500`}
                      />
                      <span className="text-xs hidden sm:inline">
                        {newPlan.color}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-badge" className="text-sm font-medium">
                  Badge
                </Label>
                <Input
                  id="add-badge"
                  value={newPlan.badge || ""}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, badge: e.target.value })
                  }
                  placeholder="Phổ biến, Khuyến nghị..."
                />
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label htmlFor="add-icon" className="text-sm font-medium">
                Icon
              </Label>
              <Input
                id="add-icon"
                value={newPlan.icon || ""}
                onChange={(e) =>
                  setNewPlan({ ...newPlan, icon: e.target.value })
                }
                placeholder="gift, calendar, crown, star..."
              />
            </div>

            {/* Switch Dùng thử */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tùy chọn nâng cao</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">
                    Dùng thử miễn phí
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Cho phép người dùng dùng thử gói này
                  </p>
                </div>
                <Switch
                  checked={newPlan.isFreeTrial}
                  onCheckedChange={(checked) =>
                    setNewPlan({ ...newPlan, isFreeTrial: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddingPlan(false)}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button onClick={handleAddPlan} className="w-full sm:w-auto">
              Thêm gói
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  );
}
