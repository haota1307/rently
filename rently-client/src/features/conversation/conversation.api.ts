import http from "@/lib/http";
import queryString from "query-string";

// Định nghĩa các kiểu dữ liệu
export interface Conversation {
  id: number;
  createdAt: string;
  userOneId: number;
  userTwoId: number;
  userOne: {
    id: number;
    name: string;
    avatar: string | null;
  };
  userTwo: {
    id: number;
    name: string;
    avatar: string | null;
  };
  latestMessage: {
    id: number;
    content: string;
    createdAt: string;
    senderId: number;
  } | null;
  unreadCount: number;
}

export interface CreateConversationResponse {
  conversation: Conversation;
  created: boolean;
}

const prefix = "/messages";

const conversationApiRequest = {
  // Tạo cuộc trò chuyện mới
  createConversation: (data: { userTwoId: number; initialMessage?: string }) =>
    http.post<CreateConversationResponse>(`${prefix}/conversations`, data),

  // Lấy danh sách cuộc trò chuyện
  getConversations: (params?: { page?: number; limit?: number }) =>
    http.get<{
      data: Conversation[];
      totalItems: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(
      `${prefix}/conversations?` +
        queryString.stringify({
          limit: params?.limit || 10,
          page: params?.page || 1,
        })
    ),

  // Lấy tin nhắn trong cuộc trò chuyện
  getMessages: (
    conversationId: number,
    params?: { page?: number; limit?: number }
  ) =>
    http.get<{
      data: any[];
      totalItems: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(
      `${prefix}/conversations/${conversationId}?` +
        queryString.stringify({
          limit: params?.limit || 20,
          page: params?.page || 1,
        })
    ),

  // Gửi tin nhắn mới
  sendMessage: (data: { conversationId: number; content: string }) =>
    http.post<any>(`${prefix}/send`, data),
};

export default conversationApiRequest;
