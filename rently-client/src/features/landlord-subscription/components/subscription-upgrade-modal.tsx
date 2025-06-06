"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Clock,
  Crown,
  Gift,
  Loader2,
  RefreshCw,
  Calendar,
  Star,
  ArrowLeft,
  Sparkles,
  Award,
  Diamond,
  Gem,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { useAccountMe } from "@/features/profile/useProfile";
import {
  useCreateSubscription,
  useRenewSubscription,
  useCheckSubscriptionAccess,
} from "../useSubscription";
import {
  LandlordSubscription,
  SubscriptionPlan,
  SubscriptionHistory,
} from "../subscription.api";
import subscriptionApiRequest from "../subscription.api";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

interface SubscriptionUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSubscription?: LandlordSubscription | null;
  onSuccess?: (payload: any) => void;
}

export function SubscriptionUpgradeModal({
  open,
  onOpenChange,
  currentSubscription,
  onSuccess,
}: SubscriptionUpgradeModalProps) {
  // Hooks
  const { data: userProfile } = useAccountMe();
  const { data: accessCheck } = useCheckSubscriptionAccess();
  const createSubscriptionMutation = useCreateSubscription();
  const renewSubscriptionMutation = useRenewSubscription();
  const queryClient = useQueryClient();

  // State
  const [selectedPlan, setSelectedPlan] = useState("");
  const [autoRenew, setAutoRenew] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hideBackButton, setHideBackButton] = useState(true);
  const [hasUsedFreeTrial, setHasUsedFreeTrial] = useState(false);

  const isExistingUser =
    !!currentSubscription &&
    (currentSubscription.status === "EXPIRED" ||
      currentSubscription.status === "CANCELED" ||
      currentSubscription.status === "SUSPENDED");

  // Thêm hàm định dạng tiền tệ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Thêm useEffect để lọc các gói subscription
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        setIsLoading(true);
        const response = await subscriptionApiRequest.getPlans();

        if (response.status === 200 && response.payload) {
          // Lấy tất cả gói
          const allPlans = response.payload;
          setSubscriptionPlans(allPlans);

          // Kiểm tra xem người dùng đã từng dùng gói free trial chưa
          let hasUsedFreeTrial = false;
          if (currentSubscription) {
            hasUsedFreeTrial = true; // Nếu đã có subscription thì không thể dùng free trial
          } else {
            try {
              if (userProfile?.payload?.id) {
                const historyResponse =
                  await subscriptionApiRequest.getHistory();

                // Kiểm tra trong lịch sử có gói free trial nào không
                hasUsedFreeTrial =
                  historyResponse.payload?.some(
                    (history: SubscriptionHistory) => {
                      // Kiểm tra nếu trong ghi chú có đề cập đến free trial hoặc miễn phí
                      return (
                        history.note?.toLowerCase().includes("miễn phí") ||
                        history.note?.toLowerCase().includes("free trial") ||
                        (history.action === "CREATED" && history.amount === 0)
                      );
                    }
                  ) || false;
              }
            } catch (historyError) {
              console.error(
                "Không thể kiểm tra lịch sử subscription:",
                historyError
              );
            }
          }

          // Lưu trạng thái đã dùng free trial
          setHasUsedFreeTrial(hasUsedFreeTrial);

          // Chọn gói mặc định phù hợp
          if (allPlans.length > 0 && !selectedPlan) {
            // Nếu đã dùng free trial, chọn gói tháng làm mặc định
            if (hasUsedFreeTrial) {
              const monthlyPlan = allPlans.find(
                (plan: SubscriptionPlan) =>
                  plan.durationType === "months" &&
                  plan.duration === 1 &&
                  !plan.isFreeTrial
              );
              if (monthlyPlan) {
                setSelectedPlan(monthlyPlan.id);
              } else {
                // Nếu không có gói tháng, chọn gói đầu tiên không phải free trial
                const nonFreeTrialPlan = allPlans.find(
                  (plan: SubscriptionPlan) => !plan.isFreeTrial
                );
                if (nonFreeTrialPlan) {
                  setSelectedPlan(nonFreeTrialPlan.id);
                }
              }
            } else {
              // Nếu chưa dùng free trial, chọn gói free trial làm mặc định
              const freeTrialPlan = allPlans.find(
                (plan: SubscriptionPlan) => plan.isFreeTrial
              );
              if (freeTrialPlan) {
                setSelectedPlan(freeTrialPlan.id);
              } else {
                setSelectedPlan(allPlans[0].id);
              }
            }
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách gói subscription:", error);
        toast.error("Không thể tải danh sách gói subscription");
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchSubscriptionPlans();
    }
  }, [open, currentSubscription, userProfile, selectedPlan]);

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.error("Vui lòng chọn một gói subscription");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Đang xử lý đăng ký...");

    try {
      const response = await subscriptionApiRequest.create({
        planId: selectedPlan,
        autoRenew,
      });

      if (response.status === 200 || response.status === 201) {
        toast.dismiss();
        toast.success("Đăng ký subscription thành công");

        // Đóng modal trước
        onOpenChange(false);

        // Cập nhật query cache trực tiếp
        queryClient.setQueryData(["subscription", "access"], {
          hasAccess: true,
          subscription: response.payload,
        });

        // Force refetch tất cả các query liên quan đến subscription
        await queryClient.refetchQueries({
          queryKey: ["subscription"],
          exact: false,
        });

        // Chờ một chút để cập nhật UI trước khi chuyển hướng
        setTimeout(() => {
          onSuccess && onSuccess(response.payload);
        }, 300);
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Lỗi khi đăng ký gói subscription:", { error });
      toast.error(
        error.payload?.message || "Không thể đăng ký gói. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Nâng cấp lên Landlord Pro</DialogTitle>
          <DialogDescription>
            Nâng cấp tài khoản để đăng bài và quản lý danh sách nhà trọ của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="p-0 md:p-2 max-w-full">
          <div className="space-y-4">
            {/* Hiển thị các gói subscription với responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => {
                    if (plan.isFreeTrial && hasUsedFreeTrial) {
                      return;
                    }
                    setSelectedPlan(plan.id);
                  }}
                  className={`rounded-lg border p-4 cursor-pointer transition-all ${
                    plan.isFreeTrial && hasUsedFreeTrial
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:shadow-md hover:border-opacity-80"
                  } h-full ${
                    selectedPlan === plan.id
                      ? `border-2 border-${plan.color || "primary"}-500 bg-${plan.color || "primary"}-50/20 shadow-md`
                      : "border-border"
                  }`}
                >
                  <div className="relative h-full flex flex-col">
                    {plan.isFreeTrial && hasUsedFreeTrial && (
                      <div className="absolute -top-4 -right-4 bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                        Đã sử dụng
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-${
                            plan.color || "primary"
                          }-100`}
                        >
                          {(() => {
                            // Hiển thị icon tương ứng dựa trên tên
                            switch (plan.icon) {
                              case "gift":
                                return (
                                  <Gift
                                    className={`h-4 w-4 text-${plan.color || "primary"}-500`}
                                  />
                                );
                              case "crown":
                                return (
                                  <Crown
                                    className={`h-4 w-4 text-${plan.color || "primary"}-500`}
                                  />
                                );
                              case "star":
                                return (
                                  <Star
                                    className={`h-4 w-4 text-${plan.color || "primary"}-500`}
                                  />
                                );
                              case "calendar":
                                return (
                                  <Calendar
                                    className={`h-4 w-4 text-${plan.color || "primary"}-500`}
                                  />
                                );
                              default:
                                return (
                                  <Sparkles
                                    className={`h-4 w-4 text-${plan.color || "primary"}-500`}
                                  />
                                );
                            }
                          })()}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {plan.name}
                        </h3>
                      </div>
                      {plan.badge && (
                        <div
                          className={`bg-${plan.color || "primary"}-100 text-${
                            plan.color || "primary"
                          }-500 text-xs font-medium rounded-full px-2.5 py-1`}
                        >
                          {plan.badge}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-xl font-bold">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-muted-foreground text-xs font-medium mb-0.5">
                          {plan.isFreeTrial
                            ? ""
                            : `/${
                                plan.durationType === "months"
                                  ? plan.duration === 1
                                    ? "tháng"
                                    : `${plan.duration} tháng`
                                  : plan.duration === 1
                                    ? "năm"
                                    : `${plan.duration} năm`
                              }`}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {plan.description}
                      </p>
                    </div>

                    <div className="space-y-2 my-3 flex-1">
                      {plan.features?.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div
                            className={`text-${plan.color || "primary"}-500 mt-0.5`}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          <span className="text-sm text-gray-700">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-3">
                      <Button
                        variant={
                          selectedPlan === plan.id ? "default" : "outline"
                        }
                        className={`w-full text-xs sm:text-sm font-medium transition-all ${
                          selectedPlan === plan.id
                            ? `bg-${plan.color || "primary"}-500 hover:bg-${plan.color || "primary"}-600`
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (plan.isFreeTrial && hasUsedFreeTrial) {
                            return;
                          }
                          setSelectedPlan(plan.id);
                        }}
                        disabled={plan.isFreeTrial && hasUsedFreeTrial}
                        size="sm"
                      >
                        {selectedPlan === plan.id ? (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5" /> Đã chọn
                          </>
                        ) : plan.isFreeTrial && hasUsedFreeTrial ? (
                          "Không khả dụng"
                        ) : (
                          "Chọn gói"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cải thiện phần tính năng chung cho responsive */}
            <div className="mt-4 border rounded-lg p-3 bg-muted/30">
              <h4 className="font-medium mb-2 text-sm">
                Tất cả các gói đều bao gồm:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {subscriptionPlans.length > 0 &&
                  subscriptionPlans[0]?.features?.map(
                    (feature: string, index: number) => (
                      <div key={index} className="flex items-start gap-1">
                        <Check className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                        <span className="text-xs">{feature}</span>
                      </div>
                    )
                  )}
              </div>
            </div>

            {/* User Balance Info - compact version */}
            <div className="p-3 bg-blue-50 rounded-md mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h5 className="text-sm font-medium">Số dư tài khoản</h5>
                  <p className="text-sm">
                    {userProfile?.payload ? (
                      <span>
                        {formatPrice(userProfile.payload.balance || 0)}{" "}
                        <span className="text-xs text-muted-foreground">
                          VND
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        Đang tải...
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center">
                    <Switch
                      id="auto-renew"
                      checked={autoRenew}
                      onCheckedChange={setAutoRenew}
                      className="mr-2"
                    />
                    <Label htmlFor="auto-renew" className="text-xs">
                      Tự động gia hạn
                    </Label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto h-8 text-xs"
                    asChild
                  >
                    <Link href="/nap-tien">Nạp tiền</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            {!hideBackButton && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="text-xs sm:text-sm"
              >
                <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Quay lại
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs sm:text-sm"
            >
              Đóng
            </Button>
          </div>
          <Button
            onClick={handleSubscribe}
            disabled={!selectedPlan || isSubmitting}
            className="text-xs sm:text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />{" "}
                Đang xử lý
              </>
            ) : (
              <>
                <Crown className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Nâng cấp ngay
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
