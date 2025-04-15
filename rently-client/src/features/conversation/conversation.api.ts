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

export interface UploadedFile {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
}

export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  AUDIO = "AUDIO",
  FILE = "FILE",
}

export interface MessageData {
  conversationId: number;
  content: string;
  type?: MessageType | string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  thumbnailUrl?: string;
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
  sendMessage: (data: MessageData) => http.post<any>(`${prefix}/send`, data),

  // Sửa tin nhắn
  editMessage: (messageId: number, content: string) =>
    http.put<any>(`${prefix}/${messageId}/edit`, { content }),

  // Xóa tin nhắn
  deleteMessage: (messageId: number) =>
    http.put<any>(`${prefix}/${messageId}/delete`, {}),

  // Đánh dấu tin nhắn đã đọc
  markAsRead: (conversationId: number) =>
    http.put<any>(`${prefix}/conversations/${conversationId}/mark-as-read`, {}),

  uploadMessageFile: (formData: FormData) =>
    http.post<UploadedFile>(`${prefix}/upload`, formData),

  uploadMultipleFiles: async (
    files: File[],
    conversationId: number
  ): Promise<UploadedFile[]> => {
    const uploadPromises = files.map((file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", conversationId.toString());
      return http.post<UploadedFile>(`${prefix}/upload`, formData);
    });

    const responses = await Promise.all(uploadPromises);
    return responses.map((response) => response.payload);
  },

  sendMessageWithFiles: async (
    message: string,
    files: File[],
    conversationId: number
  ) => {
    try {
      const uploadedFiles = await conversationApiRequest.uploadMultipleFiles(
        files,
        conversationId
      );

      const imageFiles = uploadedFiles.filter((file) =>
        file.fileType.startsWith("image/")
      );

      const otherFiles = uploadedFiles.filter(
        (file) => !file.fileType.startsWith("image/")
      );

      const messagePromises = [];

      if (message.trim()) {
        messagePromises.push(
          conversationApiRequest.sendMessage({
            conversationId,
            content: message,
            type: MessageType.TEXT,
          })
        );
      }

      for (const file of otherFiles) {
        const fileType = file.fileType.startsWith("video/")
          ? MessageType.VIDEO
          : file.fileType.startsWith("audio/")
          ? MessageType.AUDIO
          : file.fileType.includes("pdf") ||
            file.fileType.includes("doc") ||
            file.fileType.includes("xls")
          ? MessageType.DOCUMENT
          : MessageType.FILE;

        messagePromises.push(
          conversationApiRequest.sendMessage({
            conversationId,
            content: `Đã gửi ${
              fileType === MessageType.DOCUMENT ? "tài liệu" : "tệp tin"
            }: ${file.fileName}`,
            type: fileType,
            fileUrl: file.url,
            fileName: file.fileName,
            fileSize: file.fileSize,
            fileType: file.fileType,
            thumbnailUrl: file.thumbnailUrl,
          })
        );
      }

      // Gửi tất cả ảnh trong một tin nhắn nếu có
      if (imageFiles.length > 0) {
        // Tạo nội dung mô tả cho ảnh
        const imageContent = message.trim()
          ? `[${
              imageFiles.length > 1
                ? `${imageFiles.length} hình ảnh`
                : "Hình ảnh"
            }] ${message}`
          : `Đã gửi ${
              imageFiles.length > 1
                ? `${imageFiles.length} hình ảnh`
                : "hình ảnh"
            }`;

        messagePromises.push(
          conversationApiRequest.sendMessage({
            conversationId,
            content: imageContent,
            type: MessageType.IMAGE,
            fileUrl: imageFiles[0].url, // Dùng URL của ảnh đầu tiên
            fileName: imageFiles[0].fileName,
            fileSize: imageFiles[0].fileSize,
            fileType: imageFiles[0].fileType,
            thumbnailUrl: imageFiles[0].thumbnailUrl,
          })
        );
      }

      // Chờ tất cả tin nhắn được gửi
      const results = await Promise.all(messagePromises);
      return {
        success: true,
        uploadedFiles,
        messages: results.map((res) => res.payload),
      };
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn kèm file:", error);
      throw error;
    }
  },
};

export default conversationApiRequest;
