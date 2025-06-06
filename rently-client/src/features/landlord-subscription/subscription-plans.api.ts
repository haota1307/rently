import http from "@/lib/http";
import { SubscriptionPlan } from "./subscription.api";

const subscriptionPlansApiRequest = {
  // Lấy tất cả plan, kể cả inactive
  getAllPlans: () =>
    http.get<SubscriptionPlan[]>("landlord-subscription/admin/plans"),

  // Cập nhật danh sách plan
  updatePlans: (plans: SubscriptionPlan[]) =>
    http.put<SubscriptionPlan[]>("landlord-subscription/admin/plans", {
      plans,
    }),

  // Thêm plan mới
  addPlan: (plan: Partial<SubscriptionPlan>) =>
    http.post<SubscriptionPlan[]>("landlord-subscription/admin/plans", plan),

  // Cập nhật plan cụ thể
  updatePlan: (planId: string, plan: Partial<SubscriptionPlan>) =>
    http.patch<SubscriptionPlan[]>(
      `landlord-subscription/admin/plans/${planId}`,
      plan
    ),

  // Xóa plan
  deletePlan: (planId: string) =>
    http.delete<SubscriptionPlan[]>(
      `landlord-subscription/admin/plans/${planId}`
    ),
};

export default subscriptionPlansApiRequest;
