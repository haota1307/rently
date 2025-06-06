import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import subscriptionPlansApiRequest from "./subscription-plans.api";
import { SubscriptionPlan } from "./subscription.api";
import { toast } from "sonner";

export const useSubscriptionPlans = () => {
  const queryClient = useQueryClient();

  // Lấy danh sách plans
  const {
    data: plans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "subscription-plans"],
    queryFn: async () => {
      const res = await subscriptionPlansApiRequest.getAllPlans();
      return res.payload;
    },
  });

  // Cập nhật toàn bộ danh sách plans
  const updatePlansMutation = useMutation({
    mutationFn: (newPlans: SubscriptionPlan[]) =>
      subscriptionPlansApiRequest.updatePlans(newPlans),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "subscription-plans"],
      });
      toast.success("Cập nhật danh sách gói subscription thành công");
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi cập nhật danh sách gói");
    },
  });

  // Thêm plan mới
  const addPlanMutation = useMutation({
    mutationFn: (newPlan: Partial<SubscriptionPlan>) =>
      subscriptionPlansApiRequest.addPlan(newPlan),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "subscription-plans"],
      });
      toast.success("Thêm gói subscription mới thành công");
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi thêm gói mới");
    },
  });

  // Cập nhật một plan
  const updatePlanMutation = useMutation({
    mutationFn: ({
      planId,
      plan,
    }: {
      planId: string;
      plan: Partial<SubscriptionPlan>;
    }) => subscriptionPlansApiRequest.updatePlan(planId, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "subscription-plans"],
      });
      toast.success("Cập nhật gói subscription thành công");
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi cập nhật gói");
    },
  });

  // Xóa plan
  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) =>
      subscriptionPlansApiRequest.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "subscription-plans"],
      });
      toast.success("Xóa gói subscription thành công");
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi xóa gói");
    },
  });

  return {
    plans,
    isLoading,
    error,
    updatePlans: updatePlansMutation.mutate,
    addPlan: addPlanMutation.mutate,
    updatePlan: updatePlanMutation.mutate,
    deletePlan: deletePlanMutation.mutate,
  };
};
