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
   * Kiểm tra trạng thái thanh toán
   */
  checkPaymentStatus: async (paymentId: number) => {
    const response = await http.get(`/payment/status/${paymentId}`);
    return response.payload;
  },
};

export default paymentApiRequest;
