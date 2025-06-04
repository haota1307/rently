import http from "@/lib/http";

export interface LandlordSubscription {
  id: number;
  userId: number;
  planType: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "CANCELED";
  startDate: string;
  endDate: string;
  amount: number;
  isFreeTrial: boolean;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface SubscriptionHistory {
  id: number;
  subscriptionId: number;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  amount?: number;
  paymentId?: number;
  note?: string;
  createdAt: string;
  subscription?: LandlordSubscription;
  payment?: any;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  durationType: "days" | "months" | "years";
  features: string[];
  isFreeTrial: boolean;
  isActive: boolean;
  color?: string;
  badge?: string;
  icon?: string;
}

export interface CreateSubscriptionRequest {
  planType?: string;
  planId?: string; // ID của plan từ dynamic plans
  isFreeTrial?: boolean;
  autoRenew?: boolean;
}

export interface RenewSubscriptionRequest {
  paymentId?: number;
}

export interface SubscriptionAccessCheck {
  hasAccess: boolean;
  subscription?: LandlordSubscription;
  message?: string;
  canUseFreeTrialAgain?: boolean;
  hasUsedFreeTrial?: boolean;
}

const subscriptionApiRequest = {
  // Tạo subscription mới
  create: (body: CreateSubscriptionRequest) =>
    http.post<LandlordSubscription>("landlord-subscription", body),

  // Lấy subscription hiện tại
  getMy: () =>
    http.get<LandlordSubscription>("landlord-subscription/my-subscription"),

  // Gia hạn subscription
  renew: (body: RenewSubscriptionRequest) =>
    http.post<LandlordSubscription>("landlord-subscription/renew", body),

  // Tạm dừng subscription
  suspend: (reason?: string) =>
    http.patch<LandlordSubscription>("landlord-subscription/suspend", {
      reason,
    }),

  // Hủy subscription
  cancel: (reason?: string) =>
    http.delete<LandlordSubscription>("landlord-subscription/cancel"),

  // Kiểm tra quyền truy cập
  checkAccess: () =>
    http.get<SubscriptionAccessCheck>("landlord-subscription/check-access"),

  // Kiểm tra điều kiện đăng ký subscription
  checkEligibility: () =>
    http.get<{
      canSubscribe: boolean;
      canUseFreeTrialAgain: boolean;
      hasActiveSubscription: boolean;
      message?: string;
    }>("landlord-subscription/check-eligibility"),

  // Lấy lịch sử
  getHistory: (subscriptionId?: number) => {
    const params = subscriptionId ? `?subscriptionId=${subscriptionId}` : "";
    return http.get<SubscriptionHistory[]>(
      `landlord-subscription/history${params}`
    );
  },

  // Lấy danh sách gói subscription
  getPlans: () => http.get<SubscriptionPlan[]>("landlord-subscription/plans"),

  // Lấy thông tin gói theo ID
  getPlanById: (planId: string) =>
    http.get<SubscriptionPlan>(`landlord-subscription/plans/${planId}`),
};

export default subscriptionApiRequest;
