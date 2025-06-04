"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCheckSubscriptionAccess } from "../useSubscription";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Crown, Clock, CreditCard } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import { SubscriptionUpgradeModal } from "./subscription-upgrade-modal";
import { useState } from "react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SubscriptionGuard({
  children,
  fallback,
}: SubscriptionGuardProps) {
  const { data: accessCheck, isLoading, error } = useCheckSubscriptionAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Nếu đang loading, hiển thị loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Nếu có error, hiển thị error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Lỗi kết nối
            </CardTitle>
            <CardDescription>
              Không thể kiểm tra trạng thái subscription. Vui lòng thử lại.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Nếu có quyền truy cập, hiển thị nội dung
  if (accessCheck?.hasAccess) {
    return <>{children}</>;
  }

  // Nếu không có quyền truy cập, hiển thị UI yêu cầu upgrade
  const subscription = accessCheck?.subscription;
  const message = accessCheck?.message;

  // Nếu có fallback component, sử dụng nó
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto pt-16">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Crown className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-amber-800">
              {subscription
                ? "Subscription đã hết hạn"
                : "Cần đăng ký Subscription"}
            </CardTitle>
            <CardDescription className="text-amber-700">
              {message || "Bạn cần có subscription để truy cập trang cho thuê"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Thông tin subscription hiện tại nếu có */}
            {subscription && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Thông tin subscription
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Gói:</span>
                    <p className="font-medium">{subscription.planType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Trạng thái:</span>
                    <p className="font-medium text-red-600">
                      {subscription.status === "EXPIRED"
                        ? "Đã hết hạn"
                        : subscription.status}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ngày hết hạn:</span>
                    <p className="font-medium">
                      {new Date(subscription.endDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phí hàng tháng:</span>
                    <p className="font-medium">
                      {formatPrice(subscription.amount)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Benefits của subscription */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Lợi ích khi đăng ký Subscription
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Đăng bài cho thuê không giới hạn
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Quản lý phòng trọ và hợp đồng
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Nhận yêu cầu thuê và lịch xem phòng
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Hỗ trợ khách hàng ưu tiên
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Báo cáo thống kê chi tiết
                </li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="flex-1"
                size="lg"
              >
                {subscription ? "Gia hạn Subscription" : "Đăng ký ngay"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/tai-khoan")}
                size="lg"
              >
                Về tài khoản
              </Button>
            </div>

            {/* Free trial notice */}
            {!subscription && (
              <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                {accessCheck?.canUseFreeTrialAgain ? (
                  <>
                    🎉 <strong>Dùng thử miễn phí 30 ngày</strong> cho lần đăng
                    ký đầu tiên!
                  </>
                ) : (
                  <>
                    ℹ️ Bạn đã sử dụng gói dùng thử miễn phí. Chỉ có thể đăng ký
                    gói trả phí.
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Modal */}
        <SubscriptionUpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          currentSubscription={subscription}
        />
      </div>
    </div>
  );
}
