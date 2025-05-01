import http from "@/lib/http";

interface CreatePaymentRequestParams {
  userId: number;
  amount: number;
  description?: string;
}

interface CreatePaymentResponse {
  paymentCode: string;
  payment: {
    id: number;
    amount: number;
    status: string;
    description: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
}

interface GenerateQrCodeResponse {
  qrCodeUrl: string;
  paymentCode: string;
  amount: number;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

interface CreateWithdrawRequestParams {
  userId: number;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  description?: string;
}

interface WithdrawRequestResponse {
  status: number;
  error: null;
  messages: {
    success: boolean;
  };
  withdrawRequest: {
    id: number;
    amount: number;
    status: string;
    description: string;
    userId: number;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface ProcessWithdrawRequestParams {
  status: "COMPLETED" | "REJECTED";
  rejectionReason?: string;
}

interface ProcessWithdrawRequestResponse {
  message: string;
  paymentId: number;
}

interface TransactionResponse {
  status: number;
  error: null;
  messages: {
    success: boolean;
  };
  transactions: any[];
}

interface TransactionSummaryResponse {
  status: number;
  error: null;
  messages: {
    success: boolean;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

interface BankInfoResponse {
  status: number;
  error: null;
  messages: {
    success: boolean;
  };
  bankInfo: {
    id: string;
    bankName: string;
    bankFullName: string;
    accountNumber: string;
    accountName: string;
    accumulated: string;
    lastTransaction: string;
    label: string;
  };
}

const paymentApiRequest = {
  /**
   * Tạo yêu cầu nạp tiền mới
   */
  createPaymentRequest: async (
    params: CreatePaymentRequestParams
  ): Promise<CreatePaymentResponse> => {
    const response = await http.post<CreatePaymentResponse>(
      "/payment/create",
      params
    );
    return response.payload;
  },

  /**
   * Lấy QR code cho thanh toán
   */
  getPaymentQrCode: async (
    paymentId: number
  ): Promise<GenerateQrCodeResponse> => {
    const response = await http.get<GenerateQrCodeResponse>(
      `/payment/qrcode?paymentId=${paymentId}`
    );
    return response.payload;
  },

  /**
   * Lấy QR code cho việc rút tiền
   */
  getWithdrawQrCode: async (withdrawId: number) => {
    const response = await http.get(
      `/payment/withdraw-qrcode?withdrawId=${withdrawId}`
    );
    return response;
  },

  /**
   * Kiểm tra trạng thái thanh toán
   */
  checkPaymentStatus: async (paymentId: number) => {
    const response = await http.get(`/payment/status/${paymentId}`);
    return response.payload;
  },

  /**
   * Tạo yêu cầu rút tiền mới
   */
  createWithdrawRequest: async (
    params: CreateWithdrawRequestParams
  ): Promise<WithdrawRequestResponse> => {
    const response = await http.post<WithdrawRequestResponse>(
      "/payment/withdraw",
      params
    );
    return response.payload;
  },

  /**
   * Lấy danh sách giao dịch
   */
  getTransactions: async (
    params?: Record<string, string | number | boolean>
  ) => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
    }

    const response = await http.get<TransactionResponse>(
      `/payment/transactions?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Lấy thống kê giao dịch
   */
  getTransactionSummary: async (
    params?: Record<string, string | number | boolean>
  ) => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
    }

    const response = await http.get<TransactionSummaryResponse>(
      `/payment/transactions/summary?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Xử lý yêu cầu rút tiền (dành cho admin)
   */
  processWithdrawRequest: async (
    withdrawId: number,
    params: ProcessWithdrawRequestParams
  ) => {
    const response = await http.put(`/payment/withdraw/${withdrawId}`, params);
    return response;
  },

  /**
   * Lấy thông tin tài khoản ngân hàng
   */
  getBankInfo: async () => {
    const response = await http.get<BankInfoResponse>(`/payment/bank-info`);
    return response;
  },
};

export default paymentApiRequest;
