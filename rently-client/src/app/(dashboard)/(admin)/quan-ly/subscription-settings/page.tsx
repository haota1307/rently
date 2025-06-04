"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Settings,
  DollarSign,
  Calendar,
  Shield,
  Info,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

// Mock data - replace with real API
const mockSettings = {
  landlord_subscription_enabled: true,
  landlord_subscription_monthly_fee: 299000,
  landlord_subscription_free_trial_days: 30,
  landlord_subscription_grace_period_days: 7,
  post_payment_enabled: false,
};

export default function SubscriptionSettingsPage() {
  const [settings, setSettings] = useState(mockSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay
      toast.success("Cài đặt đã được lưu thành công!");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu cài đặt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SidebarInset>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-2 md:px-4 w-full sticky top-0 bg-background z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-base md:text-lg font-semibold">
          Cài đặt Subscription
        </h1>
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={isLoading} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      </header>

      <div className="p-2 md:p-4 space-y-4">
        {/* Warning Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Lưu ý:</strong> Thay đổi cài đặt subscription sẽ ảnh hưởng
            đến tất cả người dùng. Vui lòng cân nhắc kỹ trước khi thực hiện thay
            đổi.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Subscription Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Chế độ Subscription
              </CardTitle>
              <CardDescription>
                Bật/tắt chế độ subscription cho landlord
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Subscription cho Landlord</Label>
                  <p className="text-sm text-muted-foreground">
                    Bật để áp dụng subscription model thay vì thanh toán
                    per-post
                  </p>
                </div>
                <Switch
                  checked={settings.landlord_subscription_enabled}
                  onCheckedChange={(checked) =>
                    handleInputChange("landlord_subscription_enabled", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thanh toán per-post (Legacy)</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép thanh toán theo từng bài đăng
                  </p>
                </div>
                <Switch
                  checked={settings.post_payment_enabled}
                  onCheckedChange={(checked) =>
                    handleInputChange("post_payment_enabled", checked)
                  }
                />
              </div>

              {settings.landlord_subscription_enabled &&
                settings.post_payment_enabled && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Khi cả hai chế độ được bật, người dùng có thể chọn
                      subscription hoặc thanh toán per-post.
                    </AlertDescription>
                  </Alert>
                )}
            </CardContent>
          </Card>

          {/* Pricing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cài đặt Giá
              </CardTitle>
              <CardDescription>
                Thiết lập phí subscription hàng tháng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthly-fee">Phí hàng tháng (VND)</Label>
                <Input
                  id="monthly-fee"
                  type="number"
                  value={settings.landlord_subscription_monthly_fee}
                  onChange={(e) =>
                    handleInputChange(
                      "landlord_subscription_monthly_fee",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="299000"
                />
                <p className="text-sm text-muted-foreground">
                  Hiển thị:{" "}
                  {formatPrice(settings.landlord_subscription_monthly_fee)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trial & Grace Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Thời gian Dùng thử
              </CardTitle>
              <CardDescription>
                Cài đặt thời gian dùng thử miễn phí
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trial-days">Số ngày dùng thử miễn phí</Label>
                <Input
                  id="trial-days"
                  type="number"
                  value={settings.landlord_subscription_free_trial_days}
                  onChange={(e) =>
                    handleInputChange(
                      "landlord_subscription_free_trial_days",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="30"
                  min="0"
                  max="365"
                />
                <p className="text-sm text-muted-foreground">
                  Người dùng mới sẽ được dùng thử miễn phí trong{" "}
                  {settings.landlord_subscription_free_trial_days} ngày
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Grace Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Thời gian Gia hạn
              </CardTitle>
              <CardDescription>
                Cài đặt thời gian gia hạn sau khi hết hạn subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grace-days">Số ngày gia hạn</Label>
                <Input
                  id="grace-days"
                  type="number"
                  value={settings.landlord_subscription_grace_period_days}
                  onChange={(e) =>
                    handleInputChange(
                      "landlord_subscription_grace_period_days",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="7"
                  min="0"
                  max="30"
                />
                <p className="text-sm text-muted-foreground">
                  Sau khi hết hạn, người dùng vẫn có thể truy cập trong{" "}
                  {settings.landlord_subscription_grace_period_days} ngày
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}
