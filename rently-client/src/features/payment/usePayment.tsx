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
  withdrawalInfo?: {
    id: number;
    amount: number;
    status: string;
    description: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
  status:
    | "idle"
    | "creating"
    | "qr-generated"
    | "checking"
    | "completed"
    | "failed"
    | "withdraw-requested"
    | "withdraw-completed";
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

export const useCreateWithdrawMutation = () => {
  return useMutation({
    mutationFn: paymentApiRequest.createWithdrawRequest,
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
  const createWithdrawMutation = useCreateWithdrawMutation();

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
        (result.status === "COMPLETED" || result.status === "completed")
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
   * Tạo yêu cầu rút tiền
   */
  const createWithdraw = async (
    userId: number,
    amount: number,
    bankName: string,
    bankAccountNumber: string,
    bankAccountName: string,
    description?: string
  ) => {
    setState((prev) => ({
      ...prev,
      loading: true,
      status: "creating",
      error: undefined,
    }));

    try {
      const result = await createWithdrawMutation.mutateAsync({
        userId,
        amount,
        bankName,
        bankAccountNumber,
        bankAccountName,
        description: description || "Rút tiền từ tài khoản",
      });

      setState((prev) => ({
        ...prev,
        loading: false,
        amount: result.withdrawRequest.amount,
        withdrawalInfo: result.withdrawRequest,
        status: "withdraw-requested",
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error?.response?.data?.message ||
          "Có lỗi xảy ra khi tạo yêu cầu rút tiền",
        status: "failed",
      }));
    }
  };

  /**
   * Kiểm tra trạng thái rút tiền
   */
  const checkWithdrawStatus = async (withdrawId: number) => {
    if (!withdrawId) {
      setState((prev) => ({
        ...prev,
        error: "Không có yêu cầu rút tiền nào đang xử lý",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
    }));

    try {
      // Sử dụng API getTransactions để lấy thông tin giao dịch
      const result = await paymentApiRequest.getTransactions({
        id: withdrawId,
      });

      if (
        result &&
        result.status === 200 &&
        result.payload?.transactions?.length > 0
      ) {
        const transaction = result.payload.transactions[0];
        // Xác định trạng thái UI từ trạng thái giao dịch
        const uiStatus =
          transaction.status === "COMPLETED"
            ? "withdraw-completed"
            : "withdraw-requested";

        // Cập nhật thông tin rút tiền và trạng thái
        setState((prev) => ({
          ...prev,
          loading: false,
          withdrawalInfo: {
            id: parseInt(transaction.id),
            userId: transaction.user?.id ? parseInt(transaction.user.id) : 0,
            amount: parseFloat(transaction.amount_out),
            status: transaction.status,
            description: transaction.transaction_content || "",
            bankName: transaction.metadata?.bankName || "",
            bankAccountNumber: transaction.metadata?.bankAccountNumber || "",
            bankAccountName: transaction.metadata?.bankAccountName || "",
            createdAt: transaction.transaction_date,
            updatedAt: transaction.transaction_date,
          },
          status: uiStatus,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    } catch (error: any) {
      console.error("Lỗi khi kiểm tra trạng thái rút tiền:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error?.response?.data?.message ||
          "Có lỗi xảy ra khi kiểm tra trạng thái rút tiền",
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
    isWithdrawing: createWithdrawMutation.isPending,
    createPayment,
    generateQrCode,
    checkPayment,
    createWithdraw,
    checkWithdrawStatus,
    resetPayment,
  };
};
