import http from "@/lib/http";
import { getAccessTokenFromLocalStorage, decodeAccessToken } from "@/lib/utils";

interface ChatbotResponse {
  criteria?: {
    price: {
      min?: number;
      max?: number;
    } | null;
    amenities: string[];
    area: {
      min?: number;
      max?: number;
    } | null;
    address: string | null;
    userType: string | null;
    roomType: string | null;
  };
  summary: string;
  content: string;
  results: Array<{
    postId: number;
    roomId: number;
    rentalId: number;
    title: string;
    price: number;
    area: number;
    description: string;
    address: string;
    amenities: string[];
    imageUrls: string[];
    createdAt: string;
  }>;
  totalFound: number;
  error?: string;
}

interface ChatHistoryResponse {
  messages: Array<{
    id: number;
    message: string;
    response: string;
    createdAt: string;
    results?: any[];
    criteria?: any;
  }>;
  hasMore: boolean;
  total: number;
}

const chatbotApiRequest = {
  search: (message: string) => {
    // Lấy userId từ token nếu người dùng đã đăng nhập
    let userId: number | undefined = undefined;
    const accessToken = getAccessTokenFromLocalStorage();

    if (accessToken) {
      try {
        const decoded = decodeAccessToken(accessToken);
        userId = decoded?.userId;
      } catch (error) {
        console.error("Lỗi khi giải mã token:", error);
      }
    }

    // Gửi userId cùng với message nếu có
    return http.post<ChatbotResponse>("/chatbot", {
      message,
      userId,
    });
  },

  // Phương thức để lấy lịch sử chat
  getHistory: (limit: number = 10, offset: number = 0) => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const accessToken = getAccessTokenFromLocalStorage();
    let isLoggedIn = false;
    let userId: number | undefined = undefined;

    if (accessToken) {
      try {
        const decoded = decodeAccessToken(accessToken);
        userId = decoded?.userId;
        isLoggedIn = !!userId;
      } catch (error) {
        console.error("Lỗi khi giải mã token:", error);
      }
    }

    // Nếu người dùng chưa đăng nhập, trả về kết quả trống
    if (!isLoggedIn) {
      console.log("Người dùng chưa đăng nhập, không lấy lịch sử chat");
      return Promise.resolve({
        payload: { messages: [], hasMore: false, total: 0 },
      });
    }

    // Chỉ gọi API khi người dùng đã đăng nhập
    return http.get<ChatHistoryResponse>(
      `/chatbot/history?limit=${limit}&offset=${offset}`
    );
  },
};

export default chatbotApiRequest;
