"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, Gift, Loader2, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  useCreateSubscription,
  useRenewSubscription,
  useCheckSubscriptionAccess,
} from "../useSubscription";
import { LandlordSubscription } from "../subscription.api";
import { useAccountMe } from "@/features/profile/useProfile";

interface SubscriptionUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSubscription?: LandlordSubscription | null;
}

const MONTHLY_FEE = 299000; // 299k VND
const FREE_TRIAL_DAYS = 30;

export function SubscriptionUpgradeModal({
  open,
  onOpenChange,
  currentSubscription,
}: SubscriptionUpgradeModalProps) {
  // Get access check data (includes free trial eligibility)
  const { data: accessCheck } = useCheckSubscriptionAccess();

  // Get user profile for balance info
  const { data: userProfile } = useAccountMe();

  const [selectedPlan, setSelectedPlan] = useState<"free_trial" | "monthly">(
    currentSubscription
      ? "monthly"
      : accessCheck?.canUseFreeTrialAgain
        ? "free_trial"
        : "monthly"
  );

  const createSubscription = useCreateSubscription();
  const renewSubscription = useRenewSubscription();

  const isExistingUser = !!currentSubscription;
  const isLoading = createSubscription.isPending || renewSubscription.isPending;

  // Check if user has enough balance for paid plans
  const userBalance = userProfile?.payload?.balance || 0;
  const needsPayment = selectedPlan === "monthly" || isExistingUser;
  const hasInsufficientBalance = needsPayment && userBalance < MONTHLY_FEE;

  // Update selected plan when access check data changes
  useState(() => {
    if (
      !isExistingUser &&
      !accessCheck?.canUseFreeTrialAgain &&
      selectedPlan === "free_trial"
    ) {
      setSelectedPlan("monthly");
    }
  });

  const handleSubmit = async () => {
    try {
      if (isExistingUser) {
        // Gia hạn cho user đã có subscription
        await renewSubscription.mutateAsync({});
      } else {
        // Tạo mới cho user chưa có subscription
        await createSubscription.mutateAsync({
          planType: "BASIC",
          isFreeTrial: selectedPlan === "free_trial",
          autoRenew: true,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error đã được handle trong hooks
    }
  };

  const getSelectedPlanDetails = () => {
    if (isExistingUser) {
      return {
        title: "Gia hạn Subscription",
        subtitle: "Tiếp tục sử dụng dịch vụ cho thuê",
        price: MONTHLY_FEE,
        duration: "1 tháng",
        features: [
          "Đăng bài cho thuê không giới hạn",
          "Quản lý phòng trọ và hợp đồng",
          "Nhận yêu cầu thuê và lịch xem phòng",
          "Hỗ trợ khách hàng ưu tiên",
          "Báo cáo thống kê chi tiết",
        ],
      };
    }

    if (selectedPlan === "free_trial") {
      return {
        title: "Dùng thử miễn phí",
        subtitle: "Trải nghiệm đầy đủ tính năng",
        price: 0,
        duration: `${FREE_TRIAL_DAYS} ngày`,
        features: [
          "Đăng bài cho thuê không giới hạn",
          "Quản lý phòng trọ và hợp đồng",
          "Nhận yêu cầu thuê và lịch xem phòng",
          "Hỗ trợ khách hàng",
          "Tự động chuyển sang gói trả phí sau 30 ngày",
        ],
      };
    }

    return {
      title: "Subscription hàng tháng",
      subtitle: "Truy cập đầy đủ tính năng",
      price: MONTHLY_FEE,
      duration: "1 tháng",
      features: [
        "Đăng bài cho thuê không giới hạn",
        "Quản lý phòng trọ và hợp đồng",
        "Nhận yêu cầu thuê và lịch xem phòng",
        "Hỗ trợ khách hàng ưu tiên",
        "Báo cáo thống kê chi tiết",
      ],
    };
  };

  const planDetails = getSelectedPlanDetails();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Crown className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
            {isExistingUser ? "Gia hạn Subscription" : "Đăng ký Subscription"}
          </DialogTitle>
          <DialogDescription>
            {isExistingUser
              ? "Gia hạn để tiếp tục sử dụng tính năng cho thuê"
              : "Chọn gói phù hợp để bắt đầu cho thuê"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Plan Selection for new users */}
          {!isExistingUser && (
            <div className="lg:col-span-2 space-y-4">
              <h4 className="font-medium text-lg">Chọn gói phù hợp</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free Trial Option - Only show if eligible */}
                {accessCheck?.canUseFreeTrialAgain && (
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedPlan === "free_trial"
                        ? "ring-2 ring-blue-500 border-blue-200 shadow-md"
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPlan("free_trial")}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift className="h-5 w-5 text-green-600" />
                          <CardTitle className="text-lg">
                            Dùng thử miễn phí
                          </CardTitle>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 text-xs"
                        >
                          Khuyến nghị
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {FREE_TRIAL_DAYS} ngày đầu hoàn toàn miễn phí
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        Miễn phí
                      </div>
                      <div className="text-sm text-gray-600">
                        Sau đó {formatPrice(MONTHLY_FEE)}/tháng
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Monthly Plan Option */}
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPlan === "monthly"
                      ? "ring-2 ring-blue-500 border-blue-200 shadow-md"
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedPlan("monthly")}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-lg">
                          Gói hàng tháng
                        </CardTitle>
                      </div>
                      {!accessCheck?.canUseFreeTrialAgain && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-700 text-xs"
                        >
                          Duy nhất
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm">
                      {accessCheck?.canUseFreeTrialAgain
                        ? "Truy cập ngay lập tức"
                        : "Bạn đã sử dụng gói dùng thử"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600 mb-1">
                      {formatPrice(MONTHLY_FEE)}
                    </div>
                    <div className="text-sm text-gray-600">per tháng</div>
                  </CardContent>
                </Card>
              </div>

              {/* Free trial used notice */}
              {!accessCheck?.canUseFreeTrialAgain && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800">
                      Gói dùng thử đã sử dụng
                    </span>
                  </div>
                  <p className="text-sm text-amber-700">
                    Bạn đã sử dụng gói dùng thử miễn phí trước đây. Vui lòng
                    chọn gói trả phí để tiếp tục sử dụng dịch vụ.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Right side - Plan Details */}
          <div
            className={`space-y-4 ${!isExistingUser ? "lg:col-span-1" : "lg:col-span-3"}`}
          >
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                {selectedPlan === "free_trial" ? (
                  <Gift className="h-5 w-5 text-green-600" />
                ) : (
                  <Crown className="h-5 w-5 text-amber-600" />
                )}
                <h4 className="font-semibold text-lg">{planDetails.title}</h4>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {planDetails.subtitle}
              </p>

              <div className="bg-white p-4 rounded-lg mb-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {planDetails.price === 0
                      ? "Miễn phí"
                      : formatPrice(planDetails.price)}
                  </span>
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {planDetails.duration}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-sm">Tính năng bao gồm:</h5>
                <ul className="space-y-2">
                  {planDetails.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* User Balance Info */}
            {(selectedPlan === "monthly" || isExistingUser) &&
              userProfile?.payload && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">
                      Số dư tài khoản
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                      Số dư hiện tại:
                    </span>
                    <span className="text-lg font-semibold text-blue-800">
                      {formatPrice(userProfile.payload.balance || 0)}
                    </span>
                  </div>
                  {(userProfile.payload.balance || 0) < MONTHLY_FEE && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      ⚠️ Số dư không đủ để thanh toán. Vui lòng nạp thêm{" "}
                      {formatPrice(
                        MONTHLY_FEE - (userProfile.payload.balance || 0)
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Additional info for existing users */}
            {isExistingUser && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-800">
                    Thông tin gia hạn
                  </span>
                </div>
                <p className="text-sm text-amber-700">
                  Subscription sẽ được gia hạn thêm 1 tháng từ ngày hết hạn hiện
                  tại. Tính năng sẽ được khôi phục ngay lập tức sau khi thanh
                  toán thành công.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || hasInsufficientBalance}
            className="w-full sm:w-auto min-w-[120px]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasInsufficientBalance
              ? "Số dư không đủ"
              : isExistingUser
                ? "Gia hạn ngay"
                : "Bắt đầu ngay"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
