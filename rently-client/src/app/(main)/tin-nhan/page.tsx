"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send,
  UserCircle,
  Loader2,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  Paperclip,
  X,
  Mic,
  Music,
  Trash2,
  Pencil,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import conversationApiRequest from "@/features/conversation/conversation.api";
import { Conversation } from "@/features/conversation/conversation.api";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/components/app-provider";
import { Badge } from "@/components/ui/badge";

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
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
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  thumbnailUrl?: string;
  isDeleted?: boolean;
  isEdited?: boolean;

  // Thêm trạng thái cho tin nhắn
  status?: MessageStatus;
}

enum MessageStatus {
  SENDING = "SENDING", // Đang gửi
  SENT = "SENT", // Đã gửi (đến server)
  DELIVERED = "DELIVERED", // Đã nhận (đến người nhận)
  READ = "READ", // Đã đọc
}

enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  AUDIO = "AUDIO",
  FILE = "FILE",
}

// Định nghĩa interface cho đối tượng tệp tin đã tải lên
interface UploadedFile {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
}

interface MessageImagePreviewProps {
  images: Array<{ url: string; file: File }>;
  removeImage: (index: number) => void;
}

function MessageImagePreview({
  images,
  removeImage,
}: MessageImagePreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="p-2 border rounded-md mb-2 bg-background">
      <div className="text-xs text-muted-foreground mb-1 flex justify-between items-center">
        <span>Ảnh đính kèm ({images.length})</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => images.forEach((_, index) => removeImage(index))}
        >
          Xóa tất cả
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <div key={index} className="relative min-w-[80px] h-[80px]">
            <img
              src={image.url}
              alt={`Ảnh đính kèm ${index + 1}`}
              className="w-[80px] h-[80px] object-cover rounded-md"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-0.5 right-0.5 bg-black bg-opacity-50 text-white rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Định nghĩa kiểu dữ liệu cho ảnh đính kèm
interface AttachedImage {
  file: File;
  url: string; // URL tạm thời cho preview (từ URL.createObjectURL)
  isUploaded?: boolean; // Đánh dấu ảnh đã được upload hay chưa
  thumbnailUrl?: string;
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get("id");
  const { isAuthenticated, userId } = useAuth();
  const socket = useAppStore((state) => state.socket);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketEvents, setSocketEvents] = useState<string[]>([]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // State và refs cho chức năng tải lên tệp tin
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // State cho ảnh đính kèm
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [sendingImages, setSendingImages] = useState(false);

  // State cho infinite scroll
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  // Tham chiếu cho việc phát hiện cuộn lên đầu
  const lastScrollPositionRef = useRef<number>(0);
  const scrollingUpRef = useRef<boolean>(false);

  // Ref để theo dõi thời gian cuối cùng tải thêm tin nhắn (phòng bounce)
  const lastLoadTime = useRef<number>(0);

  // Thiết lập một tham chiếu để lưu tin nhắn đang xử lý
  const sentMessages = useRef(new Set<string>());

  // Thêm ref mới cho ScrollArea
  const scrollAreaComponentRef = useRef<HTMLDivElement>(null);

  // Tạo thêm ref cho phần tử kích hoạt tải thêm
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Thêm biến để theo dõi tin nhắn đã xử lý
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Thêm state cho sửa tin nhắn
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageContent, setEditMessageContent] = useState("");

  // Thiết lập lắng nghe sự kiện socket
  useEffect(() => {
    if (!socket || !userId) return;

    // Lắng nghe sự kiện nhận tin nhắn mới
    const onNewMessage = (newMessage: Message) => {
      console.log("Nhận tin nhắn mới từ socket:", newMessage);

      // Tạo ID duy nhất cho tin nhắn để kiểm tra trùng lặp - tạo nhiều dạng ID khác nhau để so sánh
      const msgUniqueId1 = `${newMessage.id}-${newMessage.senderId}-${newMessage.content}`;
      const msgUniqueId2 = `${newMessage.senderId}-${
        newMessage.content
      }-${new Date(newMessage.createdAt).getTime()}`;

      // Nếu tin nhắn đã được xử lý trước đó, bỏ qua
      if (
        processedMessageIds.current.has(msgUniqueId1) ||
        processedMessageIds.current.has(msgUniqueId2)
      ) {
        console.log("Bỏ qua tin nhắn đã xử lý:", msgUniqueId1);
        return;
      }

      // Đánh dấu tin nhắn đã được xử lý (cả hai ID)
      processedMessageIds.current.add(msgUniqueId1);
      processedMessageIds.current.add(msgUniqueId2);

      // Kiểm tra xem tin nhắn đã tồn tại trong danh sách hiển thị chưa
      setMessages((prev) => {
        // Kiểm tra xem tin nhắn có bị trùng không
        const isDuplicate = prev.some((existingMsg) => {
          // So sánh ID (nếu ID là số)
          if (
            typeof existingMsg.id === "number" &&
            typeof newMessage.id === "number" &&
            existingMsg.id === newMessage.id
          ) {
            return true;
          }

          // So sánh nội dung, người gửi và thời gian gần giống nhau
          if (
            existingMsg.content === newMessage.content &&
            existingMsg.senderId === newMessage.senderId &&
            Math.abs(
              new Date(existingMsg.createdAt).getTime() -
                new Date(newMessage.createdAt).getTime()
            ) < 10000
          ) {
            return true;
          }

          // So sánh ID tạm thời với ID thực từ server (trường hợp đã thêm tin nhắn tạm)
          if (
            typeof existingMsg.id === "string" &&
            existingMsg.id.startsWith("temp-") &&
            existingMsg.content === newMessage.content &&
            existingMsg.senderId === newMessage.senderId
          ) {
            return true;
          }

          return false;
        });

        // Nếu đã có tin nhắn này, cập nhật ID nếu cần và trả về mảng không đổi
        if (isDuplicate) {
          // Cập nhật ID từ temp sang ID thực nếu cần
          if (typeof newMessage.id === "number") {
            return prev.map((msg) =>
              typeof msg.id === "string" &&
              msg.id.startsWith("temp-") &&
              msg.content === newMessage.content &&
              msg.senderId === newMessage.senderId
                ? { ...msg, id: newMessage.id, status: MessageStatus.DELIVERED }
                : msg
            );
          }
          return prev;
        }

        // Thêm tin nhắn mới vào đầu mảng (tin nhắn mới nhất lên trên)
        return [newMessage, ...prev];
      });

      // Cập nhật danh sách cuộc trò chuyện với tin nhắn mới nhất
      setConversations((prevConversations) => {
        const typedConversations: Conversation[] = prevConversations;

        return typedConversations.map((conv) => {
          if (conv.id === newMessage.conversationId) {
            // Đảm bảo id luôn là số
            const messageId =
              typeof newMessage.id === "string"
                ? parseInt(newMessage.id.replace(/\D/g, "")) || Date.now()
                : newMessage.id;

            // Kiểm tra nếu đây là tin nhắn của người khác và người dùng đang ở trong cuộc trò chuyện này
            // thì không tăng unreadCount
            const shouldIncrementUnread =
              userId !== newMessage.senderId &&
              (!activeConversation ||
                activeConversation.id !== newMessage.conversationId);

            return {
              ...conv,
              latestMessage: {
                id: messageId,
                content: newMessage.content,
                createdAt: newMessage.createdAt,
                senderId: newMessage.senderId,
              },
              unreadCount: shouldIncrementUnread
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount,
            };
          }
          return conv;
        }) as Conversation[];
      });

      // Nếu tin nhắn mới thuộc cuộc trò chuyện đang active, đánh dấu đã đọc ngay
      if (
        newMessage.senderId !== userId &&
        activeConversation &&
        newMessage.conversationId === activeConversation.id
      ) {
        // Tự động đánh dấu đã đọc khi đang trong cuộc trò chuyện
        try {
          socket?.emit("markMessageAsRead", {
            messageId: newMessage.id,
            conversationId: newMessage.conversationId,
            readerId: userId,
          });

          // Cập nhật local để hiển thị đã đọc
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newMessage.id && msg.senderId !== userId
                ? { ...msg, isRead: true }
                : msg
            )
          );

          // Đồng thời gọi API để cập nhật trạng thái đã đọc
          conversationApiRequest
            .markAsRead(newMessage.conversationId)
            .catch((error) => {
              console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
            });
        } catch (error) {
          console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
        }
      }

      // Cuộn xuống dưới cùng khi nhận tin nhắn mới từ người khác
      if (
        newMessage.senderId !== userId &&
        activeConversation &&
        activeConversation.id === newMessage.conversationId
      ) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }

      // Cập nhật danh sách sự kiện socket (chỉ dùng cho debug, không hiển thị cho người dùng)
      setSocketEvents((prev) => [
        ...prev,
        `Tin nhắn mới: ${newMessage.content} (ID: ${newMessage.id})`,
      ]);
    };

    // Lắng nghe sự kiện tin nhắn đã nhận
    const onMessageDelivered = (data: {
      messageId: number;
      conversationId: number;
    }) => {
      console.log("Tin nhắn đã được nhận:", data);

      setMessages((prev) =>
        prev.map((msg) =>
          (typeof msg.id === "number" && msg.id === data.messageId) ||
          (typeof msg.id === "string" &&
            msg.content &&
            msg.conversationId === data.conversationId)
            ? { ...msg, status: MessageStatus.DELIVERED }
            : msg
        )
      );
    };

    // Lắng nghe sự kiện tin nhắn đã đọc
    const onMessageRead = (data: {
      messageId: number;
      conversationId: number;
      senderId?: number;
    }) => {
      console.log("Tin nhắn đã được đọc:", data);

      setMessages((prev) =>
        prev.map((msg) => {
          // Cập nhật tin nhắn dựa trên ID nếu có
          if (typeof msg.id === "number" && msg.id === data.messageId) {
            return { ...msg, status: MessageStatus.READ, isRead: true };
          }

          // Nếu không có ID cụ thể, cập nhật theo cuộc trò chuyện và người gửi
          if (
            data.senderId &&
            msg.conversationId === data.conversationId &&
            msg.senderId === data.senderId
          ) {
            return { ...msg, status: MessageStatus.READ, isRead: true };
          }

          // Nếu tin nhắn trong cuộc trò chuyện và là tin nhắn tạm thời
          if (
            typeof msg.id === "string" &&
            msg.id.startsWith("temp-") &&
            msg.conversationId === data.conversationId &&
            msg.senderId === userId
          ) {
            return { ...msg, status: MessageStatus.READ, isRead: true };
          }

          return msg;
        })
      );
    };

    // Lắng nghe sự kiện đánh dấu đã đọc tất cả tin nhắn trong cuộc trò chuyện
    const onConversationRead = (data: {
      conversationId: number;
      readerId: number;
    }) => {
      console.log("Cuộc trò chuyện đã được đọc:", data);

      // Chỉ cập nhật trạng thái nếu người đọc không phải là người dùng hiện tại
      if (data.readerId !== userId) {
        setMessages((prev) =>
          prev.map((msg) =>
            // Chỉ cập nhật tin nhắn của người dùng hiện tại trong cuộc trò chuyện này
            msg.conversationId === data.conversationId &&
            msg.senderId === userId
              ? { ...msg, status: MessageStatus.READ, isRead: true }
              : msg
          )
        );

        // Cập nhật số tin nhắn chưa đọc về 0 cho cuộc trò chuyện này
        setConversations((prevConversations) => {
          return prevConversations.map((conv) =>
            conv.id === data.conversationId ? { ...conv, unreadCount: 0 } : conv
          );
        });
      }
    };

    // Lắng nghe sự kiện cuộc trò chuyện mới
    const onNewConversation = (conversation: Conversation) => {
      setSocketEvents((prev) => [
        ...prev,
        `Cuộc trò chuyện mới: ${conversation.id}`,
      ]);
      setConversations((prev) => [conversation, ...prev]);
    };

    // Lắng nghe sự kiện tin nhắn đã bị sửa
    const onMessageEdited = (
      data:
        | {
            messageId: number;
            content: string;
            conversationId: number;
            isEdited?: boolean;
          }
        | any
    ) => {
      console.log("DEBUG: Nhận sự kiện messageUpdated từ socket:", data);

      // Nếu data là một đối tượng tin nhắn đầy đủ (từ server)
      const messageId = data.id || data.messageId;
      const content = data.content;
      const isEdited = data.isEdited === undefined ? true : data.isEdited;
      const conversationId = data.conversationId;

      if (!messageId || !content) {
        console.error("Dữ liệu tin nhắn đã sửa không hợp lệ:", data);
        return;
      }

      console.log(
        `DEBUG: Cập nhật tin nhắn ${messageId} thành: ${content} (isEdited: ${isEdited})`
      );

      // Cập nhật tin nhắn trong danh sách tin nhắn hiển thị
      setMessages((prev) =>
        prev.map((msg) => {
          if (typeof msg.id === "number" && msg.id === messageId) {
            console.log(
              `DEBUG: Tìm thấy tin nhắn cần cập nhật trong UI, ID: ${msg.id}`
            );
            return { ...msg, content: content, isEdited: isEdited };
          }
          return msg;
        })
      );

      // Cập nhật nội dung của tin nhắn gần nhất trong danh sách cuộc trò chuyện nếu cần
      setConversations((prev) =>
        prev.map((conv) => {
          if (
            conv.id === conversationId &&
            conv.latestMessage &&
            typeof conv.latestMessage.id === "number" &&
            conv.latestMessage.id === messageId
          ) {
            console.log(
              `DEBUG: Cập nhật tin nhắn trong danh sách hội thoại, ID: ${messageId}`
            );
            return {
              ...conv,
              latestMessage: {
                ...conv.latestMessage,
                content: content,
                isEdited: isEdited,
              },
            };
          }
          return conv;
        })
      );
    };

    // Lắng nghe sự kiện tin nhắn đã bị xóa
    const onMessageDeleted = (data: {
      messageId: number;
      conversationId: number;
    }) => {
      console.log("Tin nhắn đã bị xóa:", data);

      setMessages((prev) =>
        prev.map((msg) =>
          typeof msg.id === "number" && msg.id === data.messageId
            ? { ...msg, content: "Tin nhắn đã bị xóa", isDeleted: true }
            : msg
        )
      );
    };

    socket.on("newMessage", onNewMessage);
    socket.on("newConversation", onNewConversation);
    socket.on("messageDelivered", onMessageDelivered);
    socket.on("messageRead", onMessageRead);
    socket.on("conversationRead", onConversationRead);
    socket.on("messageEdited", onMessageEdited);
    socket.on("messageUpdated", onMessageEdited);
    socket.on("messageDeleted", onMessageDeleted);

    // Debugging: Thử đăng ký một sự kiện test để xem socket có hoạt động không
    socket.on("test", (data: any) => {
      setSocketEvents((prev) => [
        ...prev,
        `Sự kiện test: ${JSON.stringify(data)}`,
      ]);
    });

    // Ngay sau khi thiết lập sự kiện, gửi một sự kiện echo
    socket.emit("echo", { message: "Kiểm tra socket echo", userId });

    // Lắng nghe sự kiện echo phản hồi
    socket.on("echoResponse", (data: any) => {
      setSocketEvents((prev) => [...prev, `Echo: ${JSON.stringify(data)}`]);
    });

    // Tạo thêm sự kiện để lắng nghe khi có thay đổi trong active conversation
    const handleVisibilityChange = () => {
      // Khi tab đang hiển thị và đang trong cuộc trò chuyện
      if (!document.hidden && activeConversation) {
        // Đánh dấu đã đọc tất cả tin nhắn trong cuộc trò chuyện
        socket.emit("markConversationAsRead", {
          conversationId: activeConversation.id,
          readerId: userId,
        });

        // Gọi API để cập nhật trạng thái đã đọc
        try {
          conversationApiRequest.markAsRead(activeConversation.id).then(() => {
            // Cập nhật UI - giảm số lượng tin nhắn chưa đọc về 0
            setConversations((prevConversations) => {
              return prevConversations.map((conv) =>
                conv.id === activeConversation.id
                  ? { ...conv, unreadCount: 0 }
                  : conv
              );
            });
          });
        } catch (error) {
          console.error("Lỗi khi đánh dấu đã đọc:", error);
        }
      }
    };

    // Đăng ký sự kiện khi tab được focus lại
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup khi component unmount
    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("newConversation", onNewConversation);
      socket.off("messageDelivered", onMessageDelivered);
      socket.off("messageRead", onMessageRead);
      socket.off("conversationRead", onConversationRead);
      socket.off("messageEdited", onMessageEdited);
      socket.off("messageUpdated", onMessageEdited);
      socket.off("messageDeleted", onMessageDeleted);
      socket.off("test");
      socket.off("echoResponse");

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket, activeConversation, userId]);

  // Tải danh sách cuộc trò chuyện
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await conversationApiRequest.getConversations();
        setConversations(response.payload.data);

        // Nếu có id trong URL thì chọn cuộc trò chuyện đó
        if (conversationId) {
          const selectedConversation = response.payload.data.find(
            (conv) => conv.id === Number(conversationId)
          );
          if (selectedConversation) {
            setActiveConversation(selectedConversation);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách trò chuyện");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, conversationId]);

  // Tải tin nhắn khi chọn cuộc trò chuyện
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation) return;

      try {
        setLoadingMessages(true);
        setCurrentPage(1); // Reset về trang đầu tiên
        setHasScrolledToBottom(false);
        setInitialScrollDone(false);

        // Tham gia vào phòng chat qua socket
        if (socket && socket.connected && activeConversation.id) {
          socket.emit("joinChat", activeConversation.id);
          setSocketEvents((prev) => [
            ...prev,
            `Tham gia phòng: chat:${activeConversation.id}`,
          ]);

          // Đánh dấu đã đọc khi tham gia phòng chat
          socket.emit("markConversationAsRead", {
            conversationId: activeConversation.id,
            readerId: userId,
          });

          // Gọi API để cập nhật trạng thái đã đọc
          try {
            await conversationApiRequest.markAsRead(activeConversation.id);

            // Cập nhật UI - giảm số lượng tin nhắn chưa đọc về 0
            setConversations((prevConversations) => {
              return prevConversations.map((conv) =>
                conv.id === activeConversation.id
                  ? { ...conv, unreadCount: 0 }
                  : conv
              );
            });
          } catch (error) {
            console.error("Lỗi khi đánh dấu đã đọc:", error);
          }
        }

        // Tải tin nhắn mới nhất (trang đầu tiên)
        const response = await conversationApiRequest.getMessages(
          activeConversation.id,
          { page: 1, limit: 15 }
        );

        // Lưu tổng số trang
        setTotalPages(response.payload.totalPages || 1);

        console.log("Đã tải tin nhắn từ API cho hội thoại mới: ", {
          count: response.payload.data.length,
          totalPages: response.payload.totalPages,
          thứTự: "Tin nhắn mới nhất ở trên đầu (DESC)",
        });

        // Đặt tin nhắn (tin nhắn mới nhất ở trên đầu mảng)
        setMessages(response.payload.data);

        // Đánh dấu là chưa cuộn xuống dưới cùng
        setHasScrolledToBottom(false);

        // Đảm bảo rằng sau khi tải tin nhắn sẽ cuộn xuống dưới cùng (tin nhắn mới nhất)
        setTimeout(() => {
          scrollToBottom();
          setInitialScrollDone(true);
          setHasScrolledToBottom(true);
        }, 300);
      } catch (error) {
        toast.error("Không thể tải tin nhắn");
      } finally {
        setLoadingMessages(false);
      }
    };

    if (activeConversation) {
      fetchMessages();
    }

    // Cleanup: Rời phòng chat khi thay đổi cuộc trò chuyện
    return () => {
      if (socket && socket.connected && activeConversation?.id) {
        socket.emit("leaveChat", activeConversation.id);
        setSocketEvents((prev) => [
          ...prev,
          `Rời phòng: chat:${activeConversation.id}`,
        ]);
      }
    };
  }, [activeConversation, socket]);

  // Xử lý cuộn xuống dưới cùng khi tin nhắn thay đổi
  useEffect(() => {
    // Chỉ tự động cuộn xuống dưới trong các trường hợp:
    // 1. Khi mới tải trang và chưa cuộn lần nào
    // 2. Khi tin nhắn mới được thêm vào (do chính mình gửi hoặc nhận từ người khác)
    if (!initialScrollDone || !hasScrolledToBottom) {
      scrollToBottom();
      setInitialScrollDone(true);
      setHasScrolledToBottom(true);
    }
  }, [messages, initialScrollDone, hasScrolledToBottom]);

  // Thay đổi phương pháp phát hiện cuộn để sử dụng cách tiếp cận truyền thống
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollElement = e.currentTarget;

    // Tìm viewport của ScrollArea
    const viewport = scrollElement.querySelector(
      "[data-radix-scroll-area-viewport]"
    );

    if (!viewport) {
      console.log("Không tìm thấy viewport của ScrollArea");
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = viewport as HTMLElement;
    const now = Date.now();

    // Chỉ log chi tiết khi cần debug
    // console.log("Thông tin cuộn:", { scrollTop, scrollHeight, clientHeight });

    // Xác định hướng cuộn
    const isScrollingUp = scrollTop < lastScrollPositionRef.current;
    lastScrollPositionRef.current = scrollTop;
    scrollingUpRef.current = isScrollingUp;

    // Tin nhắn đầu tiên hiển thị (top = 0) khi cuộn lên đầu trang
    // Giảm ngưỡng xuống 30px để phát hiện sớm hơn
    const isNearTop = scrollTop < 30;

    // Kích hoạt tải thêm tin nhắn khi:
    // 1. Cuộn lên trên đến gần đầu
    // 2. Không đang tải
    // 3. Còn trang để tải
    // 4. Đủ thời gian giữa các lần tải
    if (
      isScrollingUp &&
      isNearTop &&
      !isLoadingMore &&
      currentPage < totalPages
    ) {
      if (now - lastLoadTime.current > 1000) {
        console.log(">> KÍCH HOẠT TẢI TIN NHẮN CŨ QUA CUỘN...", {
          scrollTop,
          currentPage,
          totalPages,
        });
        lastLoadTime.current = now;
        loadMoreMessages();
      }
    }

    // Đánh dấm nếu đã cuộn xuống dưới cùng
    const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 50;
    setHasScrolledToBottom(isAtBottom);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  };

  // Hàm tải thêm tin nhắn cũ khi cuộn lên trên (infinite scroll)
  const loadMoreMessages = async () => {
    if (!activeConversation || isLoadingMore || currentPage >= totalPages) {
      console.log("Không thể tải tin nhắn:", {
        hasActiveConversation: !!activeConversation,
        isLoadingMore,
        currentPage,
        totalPages,
      });
      return;
    }

    try {
      setIsLoadingMore(true);
      console.log(
        `===== ĐANG TẢI TRANG ${currentPage + 1}/${totalPages} =====`
      );

      // Lấy danh sách tin nhắn hiện tại để so sánh sau này
      const currentMessageIds = new Set(
        messages.map((msg) =>
          typeof msg.id === "string" ? msg.id : msg.id.toString()
        )
      );

      const response = await conversationApiRequest.getMessages(
        activeConversation.id,
        { page: currentPage + 1, limit: 15 }
      );

      if (response.payload.data && response.payload.data.length > 0) {
        // Lưu vị trí cuộn hiện tại trước khi thêm tin nhắn mới
        const scrollElement = document.getElementById("messages-container");
        const viewport = scrollElement?.querySelector(
          "[data-radix-scroll-area-viewport]"
        );

        if (!viewport) return;

        const prevHeight = viewport.scrollHeight;
        const prevScrollTop = viewport.scrollTop;

        // Lọc ra những tin nhắn mới (chưa có trong danh sách hiện tại)
        const newMessages = response.payload.data.filter(
          (msg) => !currentMessageIds.has(msg.id.toString())
        );

        console.log(
          `Đã nhận ${response.payload.data.length} tin nhắn, ${newMessages.length} tin nhắn mới`
        );

        if (newMessages.length > 0) {
          setMessages((prevMessages) => [...prevMessages, ...newMessages]);

          // Cập nhật trang hiện tại
          setCurrentPage((prev) => prev + 1);

          // Sử dụng setTimeout để đợi DOM cập nhật
          setTimeout(() => {
            try {
              if (viewport) {
                const newHeight = viewport.scrollHeight;
                const heightDiff = newHeight - prevHeight;

                // Điều chỉnh vị trí cuộn để giữ người dùng ở cùng vị trí tương đối
                viewport.scrollTop = prevScrollTop + heightDiff;

                console.log("Đã điều chỉnh vị trí cuộn:", {
                  prevHeight,
                  newHeight,
                  heightDiff,
                  newScrollTop: viewport.scrollTop,
                });
              }
            } catch (error) {
              console.error("Lỗi khi điều chỉnh vị trí cuộn:", error);
            }
          }, 100);
        } else {
          console.log("Không có tin nhắn mới (tất cả đã tồn tại)");
          // Nếu không có tin nhắn mới nhưng vẫn còn trang, tiếp tục tăng trang
          if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
          }
        }
      } else {
        console.log("Không còn tin nhắn cũ để tải");
      }
    } catch (error) {
      console.error("Lỗi khi tải thêm tin nhắn:", error);
      toast.error("Không thể tải thêm tin nhắn");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (): Promise<void> => {
    if (!message.trim() || !activeConversation) return;

    try {
      setIsSendingMessage(true);
      // Lưu lại nội dung tin nhắn trước khi xóa khỏi input
      const messageContent = message.trim();

      // Tạo khóa duy nhất cho tin nhắn này
      const messageKey = `${userId}-${messageContent}-${Date.now()}`;

      // Đánh dấu tin nhắn này đang được xử lý
      sentMessages.current.add(messageKey);

      // Xóa tin nhắn khỏi input trước
      setMessage("");

      // Tạo một ID tạm thời cho tin nhắn
      const tempId = `temp-${Date.now()}`;

      const newMessage: Message = {
        id: tempId,
        content: messageContent,
        createdAt: new Date().toISOString(),
        senderId: userId || 0,
        isRead: false,
        conversationId: activeConversation.id,
        sender: {
          id: userId || 0,
          name: "Bạn",
          avatar: null,
        },
        type: MessageType.TEXT,
        status: MessageStatus.SENDING, // Đánh dấu trạng thái đang gửi
      };

      // Thêm tin nhắn vào UI trước
      setMessages((prev) => [newMessage, ...prev]);

      // Đánh dấu tin nhắn để không xử lý lại (khi nhận từ socket)
      const msgUniqueId = `${tempId}-${userId}-${messageContent}`;
      processedMessageIds.current.add(msgUniqueId);

      // Đảm bảo cuộn xuống dưới cùng ngay lập tức
      scrollToBottom();

      // Đặt timeout để cuộn lại sau khi DOM đã cập nhật
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // Gửi tin nhắn lên server
      const response = await conversationApiRequest.sendMessage({
        conversationId: activeConversation.id,
        content: messageContent,
        type: MessageType.TEXT,
      });

      // Cập nhật tin nhắn với ID thực từ server (nếu có)
      if (response.payload && response.payload.id) {
        const serverId = response.payload.id;

        // Cập nhật trong messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...msg, id: serverId, status: MessageStatus.SENT }
              : msg
          )
        );

        // Cập nhật trong conversations nếu đây là tin nhắn mới nhất
        setConversations((prevConversations) => {
          const typedConversations: Conversation[] = prevConversations;

          return typedConversations.map((conv) => {
            if (conv.id === activeConversation.id) {
              return {
                ...conv,
                latestMessage: {
                  id: serverId,
                  content: messageContent,
                  createdAt: newMessage.createdAt,
                  senderId: userId || 0,
                },
              };
            }
            return conv;
          }) as Conversation[];
        });

        // Cuộn xuống dưới cùng một lần nữa sau khi cập nhật từ server
        setTimeout(() => {
          scrollToBottom();
        }, 300);
      }

      // Xóa khỏi danh sách đang xử lý sau 30 giây
      setTimeout(() => {
        sentMessages.current.delete(messageKey);
      }, 30000);

      return Promise.resolve();
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      toast.error("Không thể gửi tin nhắn");
      return Promise.reject(error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Khi nhấp vào cuộc trò chuyện trong sidebar
  const handleConversationClick = (
    conversation: Conversation,
    e: React.MouseEvent
  ) => {
    // Ngăn sự kiện mặc định để tránh cuộn trang
    e.preventDefault();

    // Nếu đang chọn cuộc trò chuyện đang active, không làm gì cả
    if (activeConversation?.id === conversation.id) {
      return;
    }

    // Đặt cuộc trò chuyện đã chọn
    setActiveConversation(conversation);

    // Cập nhật URL mà không làm cuộn trang
    router.push(`/tin-nhan?id=${conversation.id}`, {
      scroll: false,
    });

    // Tải tin nhắn mới sẽ được xử lý bởi useEffect
  };

  // Khi tham chiếu this để dễ hiểu
  const onSelectConversation = handleConversationClick;

  // Kiểm tra xem cần hiển thị thông tin của người dùng nào
  const getDisplayUser = (conversation: Conversation) => {
    return userId === conversation.userOneId
      ? conversation.userTwo
      : conversation.userOne;
  };

  // Xử lý khi người dùng chọn tệp tin
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);

    // Tự động upload file khi người dùng chọn
    handleFileUpload(file);
  };

  // Xử lý upload file
  const handleFileUpload = async (file: File) => {
    if (!activeConversation) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Tạo FormData để upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", activeConversation.id.toString());

      // Thiết lập progress update
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          // Tăng tiến trình lên đến 90% trước khi hoàn thành thực sự
          if (prev < 90) {
            return prev + 5;
          }
          return prev;
        });
      }, 200);

      // Gọi API upload file
      let uploadedFile: UploadedFile;

      try {
        // Sử dụng API thực tế để upload file
        const response = await conversationApiRequest.uploadMessageFile(
          formData
        );
        uploadedFile = {
          url: response.payload.url,
          fileName: response.payload.fileName,
          fileSize: response.payload.fileSize,
          fileType: response.payload.fileType,
          thumbnailUrl: response.payload.thumbnailUrl,
        };
      } finally {
        // Dừng interval progress update
        clearInterval(progressInterval);
      }

      // Đánh dấu tiến trình 100% khi hoàn thành
      setUploadProgress(100);

      // Xác định loại tệp tin
      const fileType = getFileType(file);

      // Gửi tin nhắn với tệp tin đã tải lên
      await sendFileMessage(uploadedFile, fileType);
    } catch (error) {
      toast.error("Không thể tải lên tệp tin");
      console.error("Lỗi khi tải lên tệp tin:", error);
    } finally {
      setUploading(false);
      setSelectedFile(null);
      setUploadProgress(0);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Xác định loại tin nhắn dựa trên tệp tin
  const getFileType = (file: File): MessageType => {
    const mimeType = file.type.toLowerCase();

    if (mimeType.startsWith("image/")) {
      return MessageType.IMAGE;
    } else if (mimeType.startsWith("video/")) {
      return MessageType.VIDEO;
    } else if (mimeType.startsWith("audio/")) {
      return MessageType.AUDIO;
    } else if (
      mimeType === "application/pdf" ||
      mimeType.includes("word") ||
      mimeType.includes("excel") ||
      mimeType.includes("powerpoint") ||
      mimeType.includes("openxmlformats")
    ) {
      return MessageType.DOCUMENT;
    } else {
      return MessageType.FILE;
    }
  };

  // Gửi tin nhắn chứa tệp tin
  const sendFileMessage = async (
    file: UploadedFile,
    messageType: MessageType
  ) => {
    if (!activeConversation) return;

    try {
      setIsSendingMessage(true);

      // Tạo ID tạm thời
      const tempId = `temp-${Date.now()}`;

      // Tạo nội dung tin nhắn dựa trên loại tệp
      let content = "";
      switch (messageType) {
        case MessageType.IMAGE:
          content = "Đã gửi một hình ảnh";
          break;
        case MessageType.VIDEO:
          content = "Đã gửi một video";
          break;
        case MessageType.AUDIO:
          content = "Đã gửi một file âm thanh";
          break;
        case MessageType.DOCUMENT:
          content = `Đã gửi tài liệu: ${file.fileName}`;
          break;
        default:
          content = `Đã gửi tệp tin: ${file.fileName}`;
      }

      // Tạo tin nhắn mới
      const newMessage: Message = {
        id: tempId,
        content: content,
        createdAt: new Date().toISOString(),
        senderId: userId || 0,
        isRead: false,
        conversationId: activeConversation.id,
        sender: {
          id: userId || 0,
          name: "Bạn",
          avatar: null,
        },
        type: messageType,
        fileUrl: file.url,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        thumbnailUrl: file.thumbnailUrl,
        status: MessageStatus.SENDING, // Đánh dấu trạng thái đang gửi
      };

      // Thêm tin nhắn vào UI
      setMessages((prev) => [newMessage, ...prev]);
      scrollToBottom();

      // Trong thực tế, bạn cần gửi dữ liệu file lên server
      // Sử dụng API mới đã tạo để gửi tin nhắn có tệp tin
      const response = await conversationApiRequest.sendMessage({
        conversationId: activeConversation.id,
        content: content,
        type: messageType,
        fileUrl: file.url,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        thumbnailUrl: file.thumbnailUrl,
      });

      // Xử lý phản hồi từ server
      if (response.payload && response.payload.id) {
        const serverId = response.payload.id;

        // Cập nhật ID trong messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...msg, id: serverId, status: MessageStatus.SENT }
              : msg
          )
        );
      }

      // Cập nhật trong conversations
      setConversations((prevConversations) => {
        const typedConversations: Conversation[] = prevConversations;

        return typedConversations.map((conv) => {
          if (conv.id === activeConversation.id) {
            return {
              ...conv,
              latestMessage: {
                id: Date.now(),
                content: content,
                createdAt: newMessage.createdAt,
                senderId: userId || 0,
              },
            };
          }
          return conv;
        }) as Conversation[];
      });

      toast.success("Đã gửi tệp tin thành công");
    } catch (error) {
      console.error("Lỗi khi gửi tệp tin:", error);
      toast.error("Không thể gửi tệp tin");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Hiển thị tin nhắn dựa trên loại
  const renderMessageContent = (msg: Message) => {
    // Nếu tin nhắn đã bị xóa
    if (msg.isDeleted) {
      return (
        <p className="text-sm italic text-muted-foreground">
          Tin nhắn đã bị xóa
        </p>
      );
    }

    // Nếu đang chỉnh sửa tin nhắn này
    if (editingMessageId === msg.id) {
      return (
        <div className="flex flex-col gap-2 w-full">
          <Input
            value={editMessageContent}
            onChange={(e) => setEditMessageContent(e.target.value)}
            className="w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleEditMessage(msg.id as number, editMessageContent);
              } else if (e.key === "Escape") {
                cancelEditMessage();
              }
            }}
          />
          <div className="flex gap-2 text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleEditMessage(msg.id as number, editMessageContent)
              }
              disabled={!editMessageContent.trim()}
            >
              Lưu
            </Button>
            <Button variant="ghost" size="sm" onClick={cancelEditMessage}>
              Hủy
            </Button>
          </div>
        </div>
      );
    }

    // Nếu là tin nhắn văn bản
    if (!msg.type || msg.type === MessageType.TEXT) {
      return (
        <div className="relative group">
          <p className="text-sm break-words">
            {msg.content}
            {msg.isEdited && !msg.isDeleted && (
              <span className="text-[10px] ml-1 opacity-70">
                (đã chỉnh sửa)
              </span>
            )}
          </p>

          {/* Menu sửa/xóa tin nhắn (chỉ hiển thị cho tin nhắn của người dùng hiện tại) */}
          {msg.senderId === userId && !msg.isDeleted && (
            <div className="absolute top-0 right-0 hidden group-hover:flex gap-1 -mt-1 -mr-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full bg-background/80 hover:bg-background"
                onClick={() => startEditMessage(msg)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full bg-background/80 hover:bg-background"
                onClick={() => handleDeleteMessage(msg.id as number)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Hiển thị tệp tin dựa trên loại
    switch (msg.type) {
      case MessageType.IMAGE:
        return (
          <div className="flex flex-col gap-2 relative group">
            <div className="relative rounded-md overflow-hidden">
              <img
                src={msg.fileUrl}
                alt={msg.fileName || "Hình ảnh"}
                className="max-w-[150px] max-h-[150px] rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(msg.fileUrl, "_blank")}
              />
            </div>
            <p className="text-xs opacity-80">
              {msg.fileName}
              {msg.isEdited && !msg.isDeleted && (
                <span className="text-[10px] ml-1 opacity-70">
                  (đã chỉnh sửa)
                </span>
              )}
            </p>

            {/* Menu xóa ảnh (chỉ hiển thị cho tin nhắn của người dùng hiện tại) */}
            {msg.senderId === userId && !msg.isDeleted && (
              <div className="absolute top-0 right-0 hidden group-hover:flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-background/80 hover:bg-background"
                  onClick={() => handleDeleteMessage(msg.id as number)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        );

      case MessageType.VIDEO:
        return (
          <div className="flex flex-col gap-2">
            <div className="relative rounded-md overflow-hidden">
              <video
                src={msg.fileUrl}
                controls
                className="max-w-full max-h-[300px] rounded-md"
              />
            </div>
            <p className="text-xs opacity-80">{msg.fileName}</p>
          </div>
        );

      case MessageType.AUDIO:
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Music className="h-8 w-8" />
              <audio src={msg.fileUrl} controls className="max-w-full" />
            </div>
            <p className="text-xs opacity-80">{msg.fileName}</p>
          </div>
        );

      case MessageType.DOCUMENT:
        return (
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-opacity-80 transition-opacity"
            onClick={() => window.open(msg.fileUrl, "_blank")}
          >
            <FileText className="h-10 w-10" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{msg.fileName}</p>
              <p className="text-xs opacity-70">
                {formatFileSize(msg.fileSize)}
              </p>
            </div>
          </div>
        );

      default: // MessageType.FILE và các loại khác
        return (
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-opacity-80 transition-opacity"
            onClick={() => window.open(msg.fileUrl, "_blank")}
          >
            <File className="h-10 w-10" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{msg.fileName}</p>
              <p className="text-xs opacity-70">
                {formatFileSize(msg.fileSize)}
              </p>
            </div>
          </div>
        );
    }
  };

  // Định dạng kích thước file
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "0 B";

    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Xử lý khi người dùng chọn ảnh đính kèm
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeConversation) return;

    try {
      const filesToAdd = Array.from(files).slice(0, 5); // Giới hạn 5 ảnh

      // Tạo URL preview cục bộ cho mỗi ảnh
      const newImages = filesToAdd.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isUploaded: false,
      }));

      // Thêm ảnh mới vào danh sách (giới hạn tối đa 5 ảnh)
      if (newImages.length > 0) {
        setAttachedImages((prevImages) => {
          const updatedImages = [...prevImages, ...newImages];
          // Nếu có quá nhiều ảnh, chỉ giữ lại 5 ảnh mới nhất
          return updatedImages.slice(0, 5);
        });
      }
    } catch (error) {
      console.error("Lỗi khi xử lý ảnh:", error);
      toast.error("Không thể xử lý ảnh đính kèm");
    } finally {
      // Reset input để có thể chọn lại cùng một file
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  // Xóa ảnh đính kèm
  const removeAttachedImage = (index: number) => {
    setAttachedImages((prevImages) => {
      const newImages = [...prevImages];
      // Xóa ảnh khỏi mảng
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Xóa tất cả ảnh đính kèm
  const clearAttachedImages = () => {
    // Xóa tất cả ảnh
    setAttachedImages([]);
  };

  // Hàm gửi tin nhắn kèm ảnh
  const sendImagesWithMessage = async () => {
    if (!activeConversation || isSendingMessage || sendingImages) return;

    if (attachedImages.length === 0) {
      return handleSendMessage();
    }

    try {
      setSendingImages(true);
      setUploadProgress(0);
      setIsSendingMessage(true);

      // Lưu lại content trước khi xóa
      const messageContent = message.trim();
      // Xóa tin nhắn khỏi input trước
      setMessage("");

      // Thiết lập progress update
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 200);

      try {
        // Hiển thị tin nhắn tạm thời trên giao diện trước khi gửi
        const tempMessages: Message[] = [];

        // Tạo ID tạm thời cho nhóm tin nhắn này
        const tempGroupId = `temp-group-${Date.now()}`;

        // Nếu có nội dung tin nhắn, thêm tin nhắn văn bản
        if (messageContent) {
          const tempTextId = `temp-text-${Date.now()}`;
          const tempTextMessage: Message = {
            id: tempTextId,
            content: messageContent,
            createdAt: new Date().toISOString(),
            senderId: userId || 0,
            isRead: false,
            conversationId: activeConversation.id,
            sender: {
              id: userId || 0,
              name: "Bạn",
              avatar: null,
            },
            type: MessageType.TEXT,
            status: MessageStatus.SENDING, // Đánh dấu trạng thái đang gửi
          };
          tempMessages.push(tempTextMessage);

          // Đánh dấu tin nhắn này để không xử lý lại
          processedMessageIds.current.add(
            `${tempTextId}-${userId}-${messageContent}`
          );
        }

        // Thêm tin nhắn tạm thời cho mỗi ảnh
        attachedImages.forEach((img, index) => {
          const tempImageId = `temp-image-${Date.now()}-${index}`;
          const tempImageContent = `Đã gửi một hình ảnh (${img.file.name})`;

          const tempImageMessage: Message = {
            id: tempImageId,
            content: tempImageContent,
            createdAt: new Date(Date.now() + index).toISOString(),
            senderId: userId || 0,
            isRead: false,
            conversationId: activeConversation.id,
            sender: {
              id: userId || 0,
              name: "Bạn",
              avatar: null,
            },
            type: MessageType.IMAGE,
            fileUrl: img.url,
            fileName: img.file.name,
            fileSize: img.file.size,
            fileType: img.file.type,
            status: MessageStatus.SENDING, // Đánh dấu trạng thái đang gửi
          };
          tempMessages.push(tempImageMessage);

          // Đánh dấu tin nhắn này để không xử lý lại
          processedMessageIds.current.add(
            `${tempImageId}-${userId}-${tempImageContent}`
          );
        });

        // Thêm tin nhắn tạm thời vào UI
        setMessages((prev) => [...tempMessages, ...prev]);
        scrollToBottom();

        // Đặt timeout để cuộn lại sau khi DOM đã cập nhật
        setTimeout(() => {
          scrollToBottom();
        }, 100);

        // Bước 1: Upload tất cả các ảnh chưa được upload
        const imagesToUpload = attachedImages.filter((img) => !img.isUploaded);

        // Bước 2: Chuẩn bị danh sách file để gửi kèm tin nhắn
        const files: File[] = attachedImages.map((img) => img.file);

        // Bước 3: Gửi tin nhắn kèm ảnh đã upload
        const result = await conversationApiRequest.sendMessageWithFiles(
          messageContent,
          files,
          activeConversation.id
        );

        // Đánh dấu tất cả tin nhắn từ server để không xử lý duplicate
        // KHI nhận lại từ socket
        if (result.messages && result.messages.length > 0) {
          for (const serverMsg of result.messages) {
            // Tạo nhiều ID khác nhau để đảm bảo không bỏ sót
            const msgIdWithContent = `${serverMsg.id}-${serverMsg.senderId}-${serverMsg.content}`;
            const msgIdWithTime = `${serverMsg.senderId}-${
              serverMsg.content
            }-${new Date(serverMsg.createdAt).getTime()}`;

            processedMessageIds.current.add(msgIdWithContent);
            processedMessageIds.current.add(msgIdWithTime);
          }

          // Xóa bỏ tin nhắn tạm thời khỏi UI và để socket thêm tin nhắn thực
          setMessages((prev) =>
            prev.filter(
              (msg) =>
                !(
                  typeof msg.id === "string" &&
                  (msg.id.startsWith("temp-text-") ||
                    msg.id.startsWith("temp-image-")) &&
                  tempMessages.some((tempMsg) => tempMsg.id === msg.id)
                )
            )
          );
        }
      } finally {
        // Dừng interval progress update
        clearInterval(progressInterval);
      }

      // Đánh dấu tiến trình 100% khi hoàn thành
      setUploadProgress(100);

      // Xóa bỏ các URL Object đã tạo để tránh memory leak
      attachedImages.forEach((img) => {
        if (!img.isUploaded && img.url.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });

      // Xóa tất cả ảnh đã đính kèm
      clearAttachedImages();
      scrollToBottom();

      // Cuộn xuống dưới cùng lần nữa sau khi xóa ảnh
      setTimeout(() => {
        scrollToBottom();
      }, 200);

      toast.success("Đã gửi tin nhắn và ảnh thành công!");

      // Đợi thêm chút thời gian để hiển thị 100%
      setTimeout(() => {
        setSendingImages(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn kèm ảnh:", error);
      toast.error("Không thể gửi tin nhắn kèm ảnh");
    } finally {
      setSendingImages(false);
      setIsSendingMessage(false);
      setUploadProgress(0);
    }
  };

  // Cần clean up các URL preview khi component unmount
  useEffect(() => {
    return () => {
      // Xóa bỏ các URL Object đã tạo để tránh memory leak
      attachedImages.forEach((img) => {
        if (!img.isUploaded && img.url.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [attachedImages]);

  // Thêm useEffect để thiết lập IntersectionObserver
  useEffect(() => {
    // Khởi tạo giá trị lastLoadTime khi component mount
    lastLoadTime.current = Date.now();

    // Thiết lập IntersectionObserver để phát hiện khi cuộn đến phần tử kích hoạt
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // Khi phần tử trigger vào viewport
        if (entry.isIntersecting) {
          console.log("Đã phát hiện phần tử kích hoạt trong viewport", {
            ratio: entry.intersectionRatio,
            currentPage,
            totalPages,
          });

          // Kiểm tra các điều kiện để tải thêm tin nhắn
          if (!isLoadingMore && currentPage < totalPages) {
            const now = Date.now();
            if (now - lastLoadTime.current > 1000) {
              console.log(">> KÍCH HOẠT TẢI TIN NHẮN CŨ QUA OBSERVER...");
              lastLoadTime.current = now;
              loadMoreMessages();
            }
          }
        }
      },
      {
        // Giảm ngưỡng xuống 0.1 để phát hiện sớm hơn (chỉ cần hiển thị 10%)
        threshold: 0.1,
        // Thêm rootMargin để kích hoạt sớm hơn khi cuộn lên
        rootMargin: "50px 0px 0px 0px",
      }
    );

    // Đăng ký phần tử kích hoạt với observer
    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
      console.log("Đã đăng ký phần tử kích hoạt với IntersectionObserver");
    }

    // Cleanup khi component unmount hoặc dependencies thay đổi
    return () => {
      observer.disconnect();
    };
  }, [isLoadingMore, currentPage, totalPages, activeConversation]);

  // Hàm xử lý sửa tin nhắn
  const handleEditMessage = async (messageId: number, content: string) => {
    try {
      console.log(
        `DEBUG handleEditMessage: Bắt đầu sửa tin nhắn ${messageId} thành "${content}"`
      );

      // Cập nhật UI ngay lập tức
      setMessages((prev) =>
        prev.map((msg) =>
          typeof msg.id === "number" && msg.id === messageId
            ? { ...msg, content, isEdited: true }
            : msg
        )
      );

      // Gọi API sửa tin nhắn
      const response = await conversationApiRequest.editMessage(
        messageId,
        content
      );
      console.log(`DEBUG handleEditMessage: API đã trả về:`, response);

      // Báo thành công
      toast.success("Đã sửa tin nhắn");

      // Reset trạng thái chỉnh sửa
      setEditingMessageId(null);
      setEditMessageContent("");
    } catch (error) {
      console.error("Lỗi khi sửa tin nhắn:", error);
      toast.error("Không thể sửa tin nhắn");
    }
  };

  // Hàm xử lý xóa tin nhắn
  const handleDeleteMessage = async (messageId: number) => {
    try {
      // Xác nhận xóa
      if (!window.confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) {
        return;
      }

      // Cập nhật UI ngay lập tức
      setMessages((prev) =>
        prev.map((msg) =>
          typeof msg.id === "number" && msg.id === messageId
            ? { ...msg, content: "Tin nhắn đã bị xóa", isDeleted: true }
            : msg
        )
      );

      // Gọi API xóa tin nhắn
      await conversationApiRequest.deleteMessage(messageId);

      // Báo thành công
      toast.success("Đã xóa tin nhắn");
    } catch (error) {
      console.error("Lỗi khi xóa tin nhắn:", error);
      toast.error("Không thể xóa tin nhắn");
    }
  };

  // Hàm bắt đầu chỉnh sửa tin nhắn
  const startEditMessage = (message: Message) => {
    if (typeof message.id !== "number" || message.isDeleted) return;

    setEditingMessageId(message.id);
    setEditMessageContent(message.content);
  };

  // Hàm hủy chỉnh sửa tin nhắn
  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditMessageContent("");
  };

  return (
    <div className="max-w-full w-full py-4 mx-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
        {/* Danh sách cuộc trò chuyện */}
        <div className="md:col-span-1 h-full overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardContent className="p-3 pb-0 flex-1 overflow-hidden flex flex-col">
              <h2 className="font-medium mb-3">Cuộc trò chuyện</h2>

              {loading ? (
                <div className="space-y-3 flex-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex-1">
                  <p>Bạn chưa có cuộc trò chuyện nào</p>
                </div>
              ) : (
                <ScrollArea className="flex-1 h-0">
                  <div className="space-y-2 pr-4">
                    {conversations.map((conversation) => {
                      const displayUser = getDisplayUser(conversation);
                      const isUnread =
                        conversation.unreadCount > 0 &&
                        userId !== conversation.latestMessage?.senderId;
                      return (
                        <div
                          key={conversation.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                            activeConversation?.id === conversation.id
                              ? "bg-muted"
                              : ""
                          } ${isUnread ? "bg-primary/5" : ""}`}
                          onClick={(e) => onSelectConversation(conversation, e)}
                        >
                          <Avatar>
                            <AvatarImage
                              src={displayUser.avatar || undefined}
                            />
                            <AvatarFallback>
                              <UserCircle className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden">
                            <div className="font-medium truncate flex items-center gap-2">
                              {displayUser.name}
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-primary inline-block"></span>
                              )}
                            </div>
                            <div
                              className={`text-xs truncate ${
                                isUnread
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {conversation.latestMessage
                                ? conversation.latestMessage.content
                                : "Bắt đầu trò chuyện..."}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Khung chat */}
        <div className="md:col-span-2 h-full overflow-hidden">
          <Card className="h-full flex flex-col">
            {activeConversation ? (
              <>
                {/* Header của chat */}
                <div className="border-b py-3 px-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage
                        src={
                          getDisplayUser(activeConversation).avatar || undefined
                        }
                      />
                      <AvatarFallback>
                        <UserCircle className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {getDisplayUser(activeConversation).name}
                      </div>
                    </div>
                  </div>

                  {!socketConnected && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Loader2 className="animate-spin h-3 w-3 mr-1" />
                      Đang kết nối...
                    </div>
                  )}
                </div>

                {/* Tin nhắn */}
                <ScrollArea
                  className="flex-1 px-6 py-4 h-0 w-full"
                  id="messages-container"
                  onScroll={handleScroll}
                  ref={scrollAreaComponentRef}
                >
                  <div ref={scrollAreaRef}>
                    {/* Phần tử kích hoạt tải thêm tin nhắn - đặt ở đầu để kích hoạt khi cuộn lên */}
                    <div
                      ref={loadMoreTriggerRef}
                      className="h-10 w-full my-2 flex items-center justify-center -mt-2"
                      id="load-more-trigger"
                    >
                      {isLoadingMore ? (
                        <div className="flex flex-col items-center gap-1 py-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">
                            Đang tải tin nhắn cũ...
                          </span>
                        </div>
                      ) : currentPage < totalPages ? (
                        <div className="py-2 px-4 text-xs opacity-50">
                          Cuộn lên để xem thêm tin nhắn cũ
                        </div>
                      ) : (
                        <div className="py-2 px-4 text-xs opacity-50">
                          Đã hiển thị tất cả tin nhắn
                        </div>
                      )}
                    </div>

                    {/* Khu vực thông tin debug - để người dùng biết trạng thái hiện tại */}
                    <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted/30 rounded-md">
                      Đã tải: {messages.length} tin nhắn | Trang: {currentPage}/
                      {totalPages}
                      {currentPage >= totalPages && " | Đã tải hết"}
                    </div>

                    {loadingMessages ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              index % 2 === 0 ? "justify-end" : ""
                            }`}
                          >
                            <Skeleton
                              className={`h-12 w-52 rounded-lg ${
                                index % 2 === 0 ? "bg-primary/20" : "bg-muted"
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <p>Hãy bắt đầu cuộc trò chuyện...</p>
                      </div>
                    ) : (
                      <div className="space-y-3 w-full pb-1">
                        {messages.length > 0 &&
                          /* Messages được lưu theo thứ tự DESC (mới ở đầu) dựa trên API trả về 
                             Để hiển thị theo thứ tự đúng (cũ ở trên, mới ở dưới), chúng ta đảo ngược mảng */
                          [...messages].reverse().map((msg, index) => (
                            <div
                              key={`msg-${msg.id}-${index}`}
                              className={`flex ${
                                msg.senderId === userId
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              {msg.senderId !== userId && (
                                <Avatar className="h-8 w-8 mr-2 mt-1 hidden sm:block">
                                  <AvatarImage
                                    src={msg.sender.avatar || undefined}
                                  />
                                  <AvatarFallback>
                                    <UserCircle className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-3 ${
                                  msg.senderId === userId
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-muted rounded-tl-none"
                                }`}
                              >
                                {renderMessageContent(msg)}
                              </div>
                            </div>
                          ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Khung nhập tin nhắn */}
                <div className="border-t py-3 px-4 flex flex-col gap-2 mt-auto">
                  {/* Hiển thị ảnh đính kèm */}
                  {attachedImages.length > 0 && (
                    <MessageImagePreview
                      images={attachedImages.map((img) => ({
                        url: img.url,
                        file: img.file,
                      }))}
                      removeImage={removeAttachedImage}
                    />
                  )}

                  {/* Thanh nhập tin nhắn chính */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 relative">
                      <Input
                        placeholder="Nhập tin nhắn..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1"
                        autoComplete="off"
                        disabled={
                          isSendingMessage || uploading || sendingImages
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (attachedImages.length > 0) {
                              sendImagesWithMessage();
                            } else {
                              handleSendMessage();
                            }
                          }
                        }}
                      />
                      {/* Nút đính kèm file */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={uploading || sendingImages}
                      />

                      {/* Nút đính kèm ảnh */}
                      <input
                        type="file"
                        ref={imageInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        disabled={uploading || sendingImages}
                      />

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          type="button"
                          disabled={uploading || sendingImages}
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <ImageIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          type="button"
                          disabled={uploading || sendingImages}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      className="rounded-full h-10 w-10 flex-shrink-0"
                      disabled={
                        (!message.trim() && attachedImages.length === 0) ||
                        isSendingMessage ||
                        uploading ||
                        sendingImages
                      }
                      onClick={() => {
                        if (attachedImages.length > 0) {
                          sendImagesWithMessage();
                        } else {
                          handleSendMessage();
                        }
                      }}
                    >
                      {isSendingMessage || sendingImages ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>

                  {/* Hiển thị trạng thái tải lên/gửi */}
                  {(uploading || sendingImages) && (
                    <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-md border bg-background">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">
                        {uploading
                          ? `Đang tải lên ${selectedFile?.name}`
                          : `Đang gửi tin nhắn kèm ảnh...`}
                      </span>
                    </div>
                  )}

                  {/* Hiển thị thông tin ảnh đã đính kèm nhưng không kèm nút gửi riêng */}
                  {attachedImages.length > 0 &&
                    !uploading &&
                    !sendingImages && (
                      <div className="flex items-center gap-2 mt-1 p-2 rounded-md bg-muted/30">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {attachedImages.length} ảnh đã sẵn sàng
                        </span>
                      </div>
                    )}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Hãy chọn một cuộc trò chuyện để bắt đầu trò chuyện...</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
