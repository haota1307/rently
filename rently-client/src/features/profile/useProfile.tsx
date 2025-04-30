import accountApiRequest from "@/features/profile/profile.api";

import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";
import { UpdateMeBodyType } from "@/schemas/profile.model";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Định nghĩa interface cho Payment
export interface Payment {
  id: number;
  amount: number;
  status: string;
  description: string | null;
  createdAt: string;
  userId: number;
}

export interface PaymentHistoryResponse {
  status: number;
  payload: Payment[];
}

export const useAccountMe = () => {
  return useQuery({
    queryKey: ["account-me"],
    queryFn: accountApiRequest.getMe,
  });
};

export const useUpdateMeMutation = () => {
  const queryClient = useQueryClient();
  const accessToken = getAccessTokenFromLocalStorage();
  const userId = accessToken ? decodeAccessToken(accessToken).userId : null;

  return useMutation({
    mutationFn: async (body: UpdateMeBodyType) => {
      if (!userId) {
        return;
      }
      return accountApiRequest.updateMe(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["account-me"],
        exact: true,
      });
    },
  });
};

export const usePaymentHistory = () => {
  return useQuery({
    queryKey: ["payment-history"],
    queryFn: accountApiRequest.getPaymentHistory,
  });
};
