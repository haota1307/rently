import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import paymentApiRequest from "./payment.api";

export interface PaymentState {
  loading: boolean;
  paymentId?: number;
  paymentCode?: string;
  qrCodeUrl?: string;
  amount?: number;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  error?: string;
  status:
    | "idle"
    | "creating"
    | "qr-generated"
    | "checking"
    | "completed"
    | "failed";
}

export const useCreatePaymentMutation = () => {
  return useMutation({
    mutationFn: paymentApiRequest.createPaymentRequest,
  });
};

export const useGetPaymentQrCodeMutation = () => {
  return useMutation({
    mutationFn: paymentApiRequest.getPaymentQrCode,
  });
};

export const useCheckPaymentStatusMutation = () => {
  return useMutation({
    mutationFn: paymentApiRequest.checkPaymentStatus,
  });
};

export const usePayment = () => {
  const [state, setState] = useState<PaymentState>({
    loading: false,
    status: "idle",
  });

  const createPaymentMutation = useCreatePaymentMutation();
  const getQrCodeMutation = useGetPaymentQrCodeMutation();
  const checkStatusMutation = useCheckPaymentStatusMutation();

  /**
   * Tạo yêu cầu nạp tiền
   */
  const createPayment = async (
    userId: number,
    amount: number,
    description?: string
  ) => {
    setState((prev) => ({
      ...prev,
      loading: true,
      status: "creating",
      error: undefined,
    }));

    try {
      const result = await createPaymentMutation.mutateAsync({
        userId,
        amount,
        description: description || "Nạp tiền vào tài khoản",
      });

      setState((prev) => ({
        ...prev,
        loading: false,
        paymentId: result.payment.id,
        paymentCode: result.paymentCode,
        amount: result.payment.amount,
      }));

      // Lấy QR code ngay sau khi tạo payment
      await generateQrCode(result.payment.id);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error?.response?.data?.message ||
          "Có lỗi xảy ra khi tạo yêu cầu nạp tiền",
        status: "failed",
      }));
    }
  };

  /**
   * Tạo QR code cho thanh toán
   */
  const generateQrCode = async (paymentId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const result = await getQrCodeMutation.mutateAsync(paymentId);

      setState((prev) => ({
        ...prev,
        loading: false,
        qrCodeUrl: result.qrCodeUrl,
        paymentCode: result.paymentCode,
        amount: result.amount,
        bankInfo: result.bankInfo,
        status: "qr-generated",
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error?.response?.data?.message || "Có lỗi xảy ra khi tạo QR code",
        status: "failed",
      }));
    }
  };

  /**
   * Kiểm tra trạng thái thanh toán
   */
  const checkPayment = async (paymentId: number) => {
    if (!paymentId) {
      setState((prev) => ({
        ...prev,
        error: "Không có giao dịch nào đang xử lý",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      status: "checking",
      error: undefined,
    }));

    try {
      const result = await checkStatusMutation.mutateAsync(paymentId);

      if (
        result &&
        typeof result === "object" &&
        "status" in result &&
        result.status === "COMPLETED"
      ) {
        setState((prev) => ({
          ...prev,
          loading: false,
          status: "completed",
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          status: state.status === "checking" ? "qr-generated" : state.status,
        }));
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error?.response?.data?.message ||
          "Có lỗi xảy ra khi kiểm tra thanh toán",
        status: state.status === "checking" ? "qr-generated" : state.status,
      }));
    }
  };

  /**
   * Reset trạng thái
   */
  const resetPayment = () => {
    setState({
      loading: false,
      status: "idle",
    });
  };

  return {
    ...state,
    isCreating: createPaymentMutation.isPending,
    isGeneratingQr: getQrCodeMutation.isPending,
    isChecking: checkStatusMutation.isPending,
    createPayment,
    generateQrCode,
    checkPayment,
    resetPayment,
  };
};
