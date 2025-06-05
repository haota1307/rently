"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import adminSubscriptionApiRequest, {
  AdminSubscriptionFilters,
  SubscriptionStats,
} from "./admin-subscription.api";

const ADMIN_SUBSCRIPTION_QUERY_KEYS = {
  all: ["admin-subscription"] as const,
  subscriptions: (filters: AdminSubscriptionFilters) =>
    ["admin-subscription", "list", filters] as const,
  stats: ["admin-subscription", "stats"] as const,
  detail: (id: number) => ["admin-subscription", "detail", id] as const,
  history: (id: number, page: number) =>
    ["admin-subscription", "history", id, page] as const,
  settings: ["admin-subscription", "settings"] as const,
};

// Hook để lấy danh sách subscription
export const useAdminSubscriptions = (filters: AdminSubscriptionFilters) => {
  return useQuery({
    queryKey: ADMIN_SUBSCRIPTION_QUERY_KEYS.subscriptions(filters),
    queryFn: async () => {
      const response =
        await adminSubscriptionApiRequest.getSubscriptions(filters);
      return response.payload;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook để lấy thống kê
export const useAdminSubscriptionStats = () => {
  return useQuery({
    queryKey: ADMIN_SUBSCRIPTION_QUERY_KEYS.stats,
    queryFn: async () => {
      const response = await adminSubscriptionApiRequest.getStats();
      return response.payload;
    },
    staleTime: 60 * 1000, // 1 minute
  });
};

// Hook để lấy chi tiết subscription
export const useAdminSubscriptionDetail = (subscriptionId: number) => {
  return useQuery({
    queryKey: ADMIN_SUBSCRIPTION_QUERY_KEYS.detail(subscriptionId),
    queryFn: async () => {
      const response =
        await adminSubscriptionApiRequest.getSubscriptionDetail(subscriptionId);
      return response.payload;
    },
    enabled: !!subscriptionId,
  });
};

// Hook để tạm dừng subscription
export const useAdminSuspendSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      reason,
    }: {
      subscriptionId: number;
      reason?: string;
    }) => {
      const response = await adminSubscriptionApiRequest.suspendSubscription(
        subscriptionId,
        reason
      );
      return response.payload;
    },
    onSuccess: () => {
      toast.success("Đã tạm dừng subscription thành công");

      // Invalidate tất cả queries liên quan
      queryClient.invalidateQueries({
        queryKey: ADMIN_SUBSCRIPTION_QUERY_KEYS.all,
      });
    },
    onError: (error: any) => {
      const message =
        error?.payload?.message || "Có lỗi xảy ra khi tạm dừng subscription";
      toast.error(message);
    },
  });
};

// Hook để kích hoạt lại subscription
export const useAdminReactivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionId: number) => {
      const response =
        await adminSubscriptionApiRequest.reactivateSubscription(
          subscriptionId
        );
      return response.payload;
    },
    onSuccess: () => {
      toast.success("Đã kích hoạt lại subscription thành công");

      queryClient.invalidateQueries({
        queryKey: ADMIN_SUBSCRIPTION_QUERY_KEYS.all,
      });
    },
    onError: (error: any) => {
      const message =
        error?.payload?.message ||
        "Có lỗi xảy ra khi kích hoạt lại subscription";
      toast.error(message);
    },
  });
};

// Hook để hủy subscription
export const useAdminCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      reason,
    }: {
      subscriptionId: number;
      reason?: string;
    }) => {
      const response = await adminSubscriptionApiRequest.cancelSubscription(
        subscriptionId,
        reason
      );
      return response.payload;
    },
    onSuccess: () => {
      toast.success("Đã hủy subscription thành công");

      queryClient.invalidateQueries({
        queryKey: ADMIN_SUBSCRIPTION_QUERY_KEYS.all,
      });
    },
    onError: (error: any) => {
      const message =
        error?.payload?.message || "Có lỗi xảy ra khi hủy subscription";
      toast.error(message);
    },
  });
};

// Hook để gia hạn subscription (admin override)
export const useAdminRenewSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      months,
    }: {
      subscriptionId: number;
      months?: number;
    }) => {
      const response = await adminSubscriptionApiRequest.renewSubscription(
        subscriptionId,
        months
      );
      return response.payload;
    },
    onSuccess: () => {
      toast.success("Đã gia hạn subscription thành công");

      queryClient.invalidateQueries({
        queryKey: ADMIN_SUBSCRIPTION_QUERY_KEYS.all,
      });
    },
    onError: (error: any) => {
      const message =
        error?.payload?.message || "Có lỗi xảy ra khi gia hạn subscription";
      toast.error(message);
    },
  });
};

// Hook để lấy lịch sử subscription
export const useAdminSubscriptionHistory = (
  subscriptionId: number,
  page: number = 1
) => {
  return useQuery({
    queryKey: ADMIN_SUBSCRIPTION_QUERY_KEYS.history(subscriptionId, page),
    queryFn: async () => {
      const response = await adminSubscriptionApiRequest.getSubscriptionHistory(
        subscriptionId,
        page
      );
      return response.payload;
    },
    enabled: !!subscriptionId,
  });
};

// Hook để lấy settings
export const useAdminSubscriptionSettings = () => {
  return useQuery({
    queryKey: ADMIN_SUBSCRIPTION_QUERY_KEYS.settings,
    queryFn: async () => {
      const response =
        await adminSubscriptionApiRequest.getSubscriptionSettings();
      return response.payload;
    },
  });
};

// Hook để cập nhật settings
export const useAdminUpdateSubscriptionSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: {
      landlord_subscription_enabled?: boolean;
      landlord_subscription_monthly_fee?: number;
      landlord_subscription_free_trial_days?: number;
      landlord_subscription_grace_period_days?: number;
      post_payment_enabled?: boolean;
    }) => {
      const response =
        await adminSubscriptionApiRequest.updateSubscriptionSettings(settings);
      return response.payload;
    },
    onSuccess: () => {
      toast.success("Cài đặt đã được lưu thành công!");

      queryClient.invalidateQueries({
        queryKey: ADMIN_SUBSCRIPTION_QUERY_KEYS.settings,
      });
    },
    onError: (error: any) => {
      const message =
        error?.payload?.message || "Có lỗi xảy ra khi lưu cài đặt";
      toast.error(message);
    },
  });
};
