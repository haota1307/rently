import http from "@/lib/http";
import {
  GetUserProfileResType,
  UpdateProfileResType,
} from "@/schemas/user.schema";
import { UpdateMeBodyType } from "@/schemas/profile.model";
import { Payment } from "./useProfile";

interface PaymentHistoryResponse {
  status: number;
  payload: Payment[];
}

const prefix = "/profile";

const accountApiRequest = {
  getMe: () => http.get<GetUserProfileResType>(`${prefix}`),

  updateMe: (body: UpdateMeBodyType) =>
    http.put<UpdateProfileResType>(`${prefix}`, body),

  getPaymentHistory: () =>
    http.get<PaymentHistoryResponse>(`${prefix}/payment-history`),
};

export default accountApiRequest;
