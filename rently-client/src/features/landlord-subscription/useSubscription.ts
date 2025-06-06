"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import subscriptionApiRequest, {
  CreateSubscriptionRequest,
  RenewSubscriptionRequest,
  LandlordSubscription,
  SubscriptionAccessCheck,
} from "./subscription.api";

const SUBSCRIPTION_QUERY_KEYS = {
  all: ["subscription"] as const,
  mySubscription: ["subscription", "my"] as const,
  accessCheck: ["subscription", "access"] as const,
  history: (subscriptionId?: number) =>
    ["subscription", "history", subscriptionId] as const,
};

// Hook để lấy subscription hiện tại
export const useMySubscription = () => {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.mySubscription,
    queryFn: async () => {
      const response = await subscriptionApiRequest.getMy();
      return response.payload;
    },
    retry: false,
  });
};

// Hook để kiểm tra quyền truy cập
export const useCheckSubscriptionAccess = () => {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.accessCheck,
    queryFn: async () => {
      const response = await subscriptionApiRequest.checkAccess();
      return response.payload;
    },
    staleTime: 1000 * 30, // Giảm xuống 30 giây (trước đó là 5 phút)
    refetchOnWindowFocus: true, // Refresh khi focus lại tab
    refetchOnMount: true, // Luôn refresh khi mount component
    retry: 1,
  });
};

// Hook để kiểm tra điều kiện đăng ký subscription
// Note: Thông tin này đã được bao gồm trong useCheckSubscriptionAccess()
// Sử dụng accessCheck.canUseFreeTrialAgain và accessCheck.hasUsedFreeTrial
export const useSubscriptionEligibility = () => {
  const { data: accessCheck, ...rest } = useCheckSubscriptionAccess();

  return {
    data: accessCheck
      ? {
          canSubscribe: true,
          canUseFreeTrialAgain: accessCheck.canUseFreeTrialAgain || false,
          hasActiveSubscription: accessCheck.hasAccess || false,
          message: accessCheck.hasUsedFreeTrial
            ? "Bạn đã sử dụng gói dùng thử miễn phí. Chỉ có thể đăng ký gói trả phí."
            : "Bạn có thể đăng ký gói miễn phí hoặc trả phí.",
        }
      : undefined,
    ...rest,
  };
};

// Hook để tạo subscription mới
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubscriptionRequest) => {
      const response = await subscriptionApiRequest.create(data);
      return response.payload;
    },
    onSuccess: (data) => {
      toast.success(
        data.isFreeTrial
          ? "Đăng ký dùng thử thành công! Bạn có 30 ngày miễn phí."
          : "Đăng ký subscription thành công!"
      );

      // Invalidate và refetch các queries liên quan ngay lập tức
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: SUBSCRIPTION_QUERY_KEYS.mySubscription,
        }),
        queryClient.invalidateQueries({
          queryKey: SUBSCRIPTION_QUERY_KEYS.accessCheck,
        }),
        // Invalidate eligibility check để cập nhật trạng thái free trial
        queryClient.invalidateQueries({
          queryKey: [...SUBSCRIPTION_QUERY_KEYS.accessCheck, "eligibility"],
        }),
      ]).then(() => {
        // Cập nhật lại cache với dữ liệu mới
        queryClient.setQueryData(SUBSCRIPTION_QUERY_KEYS.mySubscription, data);
        queryClient.setQueryData(SUBSCRIPTION_QUERY_KEYS.accessCheck, {
          hasAccess: true,
          subscription: data,
        });
      });
    },
    onError: (error: any) => {
      const message =
        error?.payload?.message || "Có lỗi xảy ra khi đăng ký subscription";
      toast.error(message);
    },
  });
};

// Hook để gia hạn subscription
export const useRenewSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RenewSubscriptionRequest) => {
      const response = await subscriptionApiRequest.renew(data);
      return response.payload;
    },
    onSuccess: () => {
      toast.success("Gia hạn subscription thành công!");

      queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.mySubscription,
      });
      queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.accessCheck,
      });
    },
    onError: (error: any) => {
      const message =
        error?.payload?.message || "Có lỗi xảy ra khi gia hạn subscription";
      toast.error(message);
    },
  });
};

// Hook để tạm dừng subscription
export const useSuspendSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason?: string) => {
      const response = await subscriptionApiRequest.suspend(reason);
      return response.payload;
    },
    onSuccess: () => {
      toast.success("Tạm dừng subscription thành công!");

      queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.mySubscription,
      });
      queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.accessCheck,
      });
    },
    onError: (error: any) => {
      const message =
        error?.payload?.message || "Có lỗi xảy ra khi tạm dừng subscription";
      toast.error(message);
    },
  });
};

// Hook để hủy subscription
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason?: string) => {
      const response = await subscriptionApiRequest.cancel(reason);
      return response.payload;
    },
    onSuccess: () => {
      toast.success("Hủy subscription thành công!");

      queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.mySubscription,
      });
      queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.accessCheck,
      });
    },
    onError: (error: any) => {
      const message =
        error?.payload?.message || "Có lỗi xảy ra khi hủy subscription";
      toast.error(message);
    },
  });
};

// Hook để lấy lịch sử subscription
export const useSubscriptionHistory = (subscriptionId?: number) => {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.history(subscriptionId),
    queryFn: async () => {
      const response = await subscriptionApiRequest.getHistory(subscriptionId);
      return response.payload;
    },
    enabled: !!subscriptionId || subscriptionId === undefined, // Enable khi có subscriptionId hoặc lấy tất cả
  });
};

// Utility function để format subscription status
export const getSubscriptionStatusText = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "EXPIRED":
      return "Đã hết hạn";
    case "SUSPENDED":
      return "Tạm dừng";
    case "CANCELED":
      return "Đã hủy";
    default:
      return status;
  }
};

// Utility function để format subscription status color
export const getSubscriptionStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "text-green-600 bg-green-50 border-green-200";
    case "EXPIRED":
      return "text-red-600 bg-red-50 border-red-200";
    case "SUSPENDED":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "CANCELED":
      return "text-gray-600 bg-gray-50 border-gray-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};
