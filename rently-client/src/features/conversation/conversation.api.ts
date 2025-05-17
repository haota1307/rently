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

export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  AUDIO = "AUDIO",
  FILE = "FILE",
}

interface UploadedFile {
  url: string;
  downloadUrl?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
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
  sendMessage: (data: MessageData) => {
    // Đảm bảo không gửi trường downloadUrl
    const { downloadUrl, ...validData } = data as any;
    return http.post<any>(`${prefix}/send`, validData);
  },

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
    http.post<UploadedFile>(`/upload/message-file`, formData),

  uploadMultipleFiles: async (
    files: File[],
    conversationId: number
  ): Promise<UploadedFile[]> => {
    // Kiểm tra kích thước file
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const invalidFiles = files.filter((file) => file.size > MAX_FILE_SIZE);

    if (invalidFiles.length > 0) {
      throw new Error(
        `Các file sau vượt quá kích thước tối đa (10MB): ${invalidFiles
          .map((f) => f.name)
          .join(", ")}`
      );
    }

    // Hạn chế số lượng file gửi cùng lúc
    if (files.length > 5) {
      throw new Error("Chỉ có thể tải lên tối đa 5 file cùng lúc");
    }

    try {
      // Tạo mảng promises cho việc upload song song
      const uploadPromises = files.map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("conversationId", conversationId.toString());

        return http.post<UploadedFile>(`/upload/message-file`, formData);
      });

      const responses = await Promise.all(uploadPromises);

      return responses.map((response) => response.payload);
    } catch (error) {
      console.error("Lỗi khi tải nhiều file:", error);
      throw error;
    }
  },

  sendMessageWithFiles: async (
    message: string,
    files: File[],
    conversationId: number
  ) => {
    try {
      // Kiểm tra xem có file nào không
      if (files.length === 0) {
        if (message.trim()) {
          const result = await conversationApiRequest.sendMessage({
            conversationId,
            content: message,
            type: MessageType.TEXT,
          });
          return {
            success: true,
            uploadedFiles: [],
            messages: [result.payload],
          };
        }
        throw new Error("Không có tin nhắn hoặc file để gửi");
      }
      // Upload từng file một thay vì đồng thời
      const uploadedFiles: UploadedFile[] = [];
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("conversationId", conversationId.toString());
          const response = await http.post<UploadedFile>(
            `/upload/message-file`,
            formData
          );
          uploadedFiles.push(response.payload);
        } catch (error) {
          console.error(`Lỗi khi upload file ${file.name}:`, error);
          throw error;
        }
      }

      const imageFiles = uploadedFiles.filter((file) =>
        file.fileType.startsWith("image/")
      );

      const otherFiles = uploadedFiles.filter(
        (file) => !file.fileType.startsWith("image/")
      );

      // Gửi tin nhắn văn bản trước nếu có
      let messageResults = [];
      if (message.trim()) {
        try {
          const textResult = await conversationApiRequest.sendMessage({
            conversationId,
            content: message,
            type: MessageType.TEXT,
          });
          messageResults.push(textResult.payload);
        } catch (error) {
          console.error("Lỗi khi gửi tin nhắn văn bản:", error);
        }
      }

      // Gửi từng file không phải ảnh
      for (const file of otherFiles) {
        try {
          const fileType = file.fileType.startsWith("video/")
            ? MessageType.VIDEO
            : file.fileType.startsWith("audio/")
              ? MessageType.AUDIO
              : file.fileType.includes("pdf") ||
                  file.fileType.includes("doc") ||
                  file.fileType.includes("xls")
                ? MessageType.DOCUMENT
                : MessageType.FILE;

          // Lưu downloadUrl để hiển thị trong client, nhưng không gửi lên server
          const downloadUrl = file.downloadUrl;

          // Tạo đối tượng tin nhắn không có trường downloadUrl
          const messageData = {
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
          };

          const result = await conversationApiRequest.sendMessage(messageData);

          // Thêm lại downloadUrl cho phía client sử dụng
          const messageWithDownloadUrl = {
            ...result.payload,
            downloadUrl: downloadUrl || file.url,
          };

          messageResults.push(messageWithDownloadUrl);
        } catch (error) {
          console.error(
            `Lỗi khi gửi tin nhắn cho file ${file.fileName}:`,
            error
          );
        }
      }

      // Gửi tất cả ảnh trong một tin nhắn nếu có
      if (imageFiles.length > 0) {
        try {
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

          const result = await conversationApiRequest.sendMessage({
            conversationId,
            content: imageContent,
            type: MessageType.IMAGE,
            fileUrl: imageFiles[0].url, // Dùng URL của ảnh đầu tiên
            fileName: imageFiles[0].fileName,
            fileSize: imageFiles[0].fileSize,
            fileType: imageFiles[0].fileType,
            thumbnailUrl: imageFiles[0].thumbnailUrl,
          });

          messageResults.push(result.payload);
        } catch (error) {
          console.error("Lỗi khi gửi tin nhắn ảnh:", error);
        }
      }

      return {
        success: true,
        uploadedFiles,
        messages: messageResults,
      };
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn kèm file:", error);
      throw error;
    }
  },
};

export default conversationApiRequest;
