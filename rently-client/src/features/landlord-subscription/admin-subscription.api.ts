import http from "@/lib/http";
import { LandlordSubscription, SubscriptionHistory } from "./subscription.api";

export interface AdminSubscriptionFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  planType?: string;
}

export interface AdminSubscriptionResponse {
  data: LandlordSubscription[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  suspendedSubscriptions: number;
  canceledSubscriptions: number;
  monthlyRevenue: number;
  freeTrialUsers: number;
  revenueGrowth: number;
  subscriptionGrowth: number;
}

export interface AdminSubscriptionHistoryResponse {
  data: SubscriptionHistory[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

const adminSubscriptionApiRequest = {
  // Lấy danh sách subscription với filters
  getSubscriptions: (filters: AdminSubscriptionFilters) => {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.planType) params.append("planType", filters.planType);

    const queryString = params.toString();
    const url = queryString
      ? `landlord-subscription/admin/subscriptions?${queryString}`
      : "landlord-subscription/admin/subscriptions";

    return http.get<AdminSubscriptionResponse>(url);
  },

  // Lấy thống kê subscription
  getStats: () =>
    http.get<SubscriptionStats>(
      "landlord-subscription/admin/subscriptions/stats"
    ),

  // Lấy chi tiết subscription
  getSubscriptionDetail: (subscriptionId: number) =>
    http.get<LandlordSubscription>(
      `landlord-subscription/admin/subscriptions/${subscriptionId}`
    ),

  // Tạm dừng subscription
  suspendSubscription: (subscriptionId: number, reason?: string) =>
    http.patch<LandlordSubscription>(
      `landlord-subscription/admin/subscriptions/${subscriptionId}/suspend`,
      { reason }
    ),

  // Kích hoạt lại subscription
  reactivateSubscription: (subscriptionId: number) =>
    http.patch<LandlordSubscription>(
      `landlord-subscription/admin/subscriptions/${subscriptionId}/reactivate`,
      {}
    ),

  // Hủy subscription
  cancelSubscription: (subscriptionId: number, reason?: string) =>
    http.patch<LandlordSubscription>(
      `landlord-subscription/admin/subscriptions/${subscriptionId}/cancel`,
      { reason }
    ),

  // Gia hạn subscription (admin override)
  renewSubscription: (subscriptionId: number, months: number = 1) =>
    http.post<LandlordSubscription>(
      `landlord-subscription/admin/subscriptions/${subscriptionId}/renew`,
      { months }
    ),

  // Lấy lịch sử subscription
  getSubscriptionHistory: (
    subscriptionId: number,
    page: number = 1,
    limit: number = 10
  ) =>
    http.get<AdminSubscriptionHistoryResponse>(
      `landlord-subscription/admin/subscriptions/${subscriptionId}/history?page=${page}&limit=${limit}`
    ),

  // Cập nhật subscription settings
  updateSubscriptionSettings: (settings: {
    landlord_subscription_enabled?: boolean;
    landlord_subscription_monthly_fee?: number;
    landlord_subscription_free_trial_days?: number;
    landlord_subscription_grace_period_days?: number;
    post_payment_enabled?: boolean;
  }) => http.put("admin/subscription-settings", settings),

  // Lấy subscription settings
  getSubscriptionSettings: () =>
    http.get<{
      landlord_subscription_enabled: boolean;
      landlord_subscription_monthly_fee: number;
      landlord_subscription_free_trial_days: number;
      landlord_subscription_grace_period_days: number;
      post_payment_enabled: boolean;
    }>("admin/subscription-settings"),
};

export default adminSubscriptionApiRequest;
