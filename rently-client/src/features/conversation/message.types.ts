// Định nghĩa kiểu dữ liệu cho tin nhắn
export interface Message {
  id: number | string;
  content: string;
  createdAt: string;
  senderId: number;
  isRead: boolean;
  conversationId: number;
  sender: {
    id: number;
    name: string;
    avatar: string | null;
  };

  type?: MessageType;
  fileUrl?: string;
  downloadUrl?: string; // URL đặc biệt dùng để tải xuống file
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  thumbnailUrl?: string;
  isDeleted?: boolean;
  isEdited?: boolean;

  // Thêm trạng thái cho tin nhắn
  status?: MessageStatus;
}

// Sửa lỗi TypeScript: chuyển từ enum sang union type cho MessageStatus
export type MessageStatus = "SENDING" | "SENT" | "DELIVERED" | "READ";

// Sử dụng namespace tương tự để duy trì tính tương thích
export namespace MessageStatus {
  export const SENDING: MessageStatus = "SENDING";
  export const SENT: MessageStatus = "SENT";
  export const DELIVERED: MessageStatus = "DELIVERED";
  export const READ: MessageStatus = "READ";
}

// Sửa lỗi TypeScript: chuyển từ enum sang union type cho MessageType
export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "DOCUMENT"
  | "AUDIO"
  | "FILE";

// Sử dụng namespace tương tự để duy trì tính tương thích
export namespace MessageType {
  export const TEXT: MessageType = "TEXT";
  export const IMAGE: MessageType = "IMAGE";
  export const VIDEO: MessageType = "VIDEO";
  export const DOCUMENT: MessageType = "DOCUMENT";
  export const AUDIO: MessageType = "AUDIO";
  export const FILE: MessageType = "FILE";
}

// Định nghĩa interface cho đối tượng tệp tin đã tải lên
export interface UploadedFile {
  url: string;
  downloadUrl?: string; // URL đặc biệt dùng để tải xuống file
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
}

// Định nghĩa interface cho ảnh đính kèm
export interface AttachedImage {
  file: File;
  url: string; // URL tạm thời cho preview (từ URL.createObjectURL)
  isUploaded?: boolean; // Đánh dấu ảnh đã được upload hay chưa
  thumbnailUrl?: string;
}

// Định nghĩa kiểu dữ liệu cho cuộc trò chuyện
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
  latestMessage?: {
    id: number;
    content: string;
    createdAt: string;
    senderId: number;
  } | null; // Thêm null để phù hợp với API response
  unreadCount?: number;
}
