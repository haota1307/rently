"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  AlertTriangle,
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
  id: number | string; // Cho phép id có thể là string (cho tin nhắn tạm thời) hoặc number (từ server)
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
  // Thêm các trường cho các loại tin nhắn đa phương tiện
  type?: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  thumbnailUrl?: string;
}

// Định nghĩa các loại tin nhắn
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

// Định nghĩa kiểu dữ liệu cho ảnh đính kèm
interface AttachedImage {
  file: File;
  url?: string; // URL từ Cloudinary (có thể không có khi chỉ preview)
  previewUrl: string; // URL preview local
  thumbnailUrl?: string;
  isUploaded?: boolean; // Đánh dấu xem ảnh đã được upload lên Cloudinary chưa
}

// Component hiển thị ảnh sẽ gửi kèm tin nhắn
interface MessageImagePreviewProps {
  images: Array<{ previewUrl: string; file: File }>;
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
              src={image.previewUrl}
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

// Thêm hàm kiểm tra kết nối mạng
const isOnline = () => typeof window !== "undefined" && navigator.onLine;

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

  // Thêm state cho trạng thái kết nối
  const [online, setOnline] = useState(isOnline());
  // Thêm ref để lưu tin nhắn offline
  const offlineMessagesRef = useRef<{ [key: string]: any[] }>({});

  // Thêm useEffect để theo dõi trạng thái kết nối mạng
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // Gửi các tin nhắn đã lưu trong localStorage khi có kết nối trở lại
      sendOfflineMessages();
    };

    const handleOffline = () => {
      setOnline(false);
    };

    // Theo dõi sự kiện kết nối
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Khởi tạo trạng thái kết nối ban đầu
    setOnline(isOnline());

    // Kiểm tra xem có tin nhắn đang chờ gửi không
    sendOfflineMessages();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Hàm để gửi tin nhắn đã lưu trong localStorage
  const sendOfflineMessages = useCallback(async () => {
    if (!isOnline() || !socket?.connected) return;

    try {
      // Lấy tin nhắn từ localStorage
      const storedMessages = localStorage.getItem("offlineMessages");
      if (!storedMessages) return;

      const messages = JSON.parse(storedMessages);
      const conversationIds = Object.keys(messages);

      // Không có tin nhắn để gửi
      if (conversationIds.length === 0) return;

      for (const conversationId of conversationIds) {
        const convMessages = messages[conversationId];

        if (convMessages && convMessages.length > 0) {
          // Tạo một bản sao để không ảnh hưởng đến mảng gốc khi xử lý
          const pendingMessages = [...convMessages];

          // Cập nhật lại localStorage tạm thời với mảng rỗng
          const updatedMessages = { ...messages };
          updatedMessages[conversationId] = [];
          localStorage.setItem(
            "offlineMessages",
            JSON.stringify(updatedMessages)
          );

          // Gửi từng tin nhắn một
          for (const messageData of pendingMessages) {
            try {
              const response = await conversationApiRequest.sendMessage(
                messageData
              );

              // Nếu là conversation đang active, cập nhật UI
              if (activeConversation?.id === Number(conversationId)) {
                if (response.payload && response.payload.id) {
                  const serverId = response.payload.id;

                  // Cập nhật tin nhắn trong UI nếu còn tồn tại
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === messageData.tempId
                        ? { ...msg, id: serverId }
                        : msg
                    )
                  );
                }
              }
            } catch (error) {
              console.error("Lỗi gửi tin nhắn offline:", error);

              // Lưu lại tin nhắn không gửi được
              const currentMessages = JSON.parse(
                localStorage.getItem("offlineMessages") || "{}"
              );

              if (!currentMessages[conversationId]) {
                currentMessages[conversationId] = [];
              }

              currentMessages[conversationId].push(messageData);
              localStorage.setItem(
                "offlineMessages",
                JSON.stringify(currentMessages)
              );
            }
          }

          // Hiển thị thông báo nếu đã gửi tin nhắn thành công
          toast.success("Đã gửi tin nhắn khi bạn offline", {
            id: "offline-message-sent",
          });
        }
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn offline:", error);
    }
  }, [activeConversation, socket]);

  // Theo dõi kết nối socket
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log("Socket đã kết nối lại");
      sendOfflineMessages();
    };

    const handleDisconnect = () => {
      console.log("Socket đã ngắt kết nối");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, sendOfflineMessages]);

  // Tham chiếu cho việc phát hiện cuộn lên đầu
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

    // Đánh dấu nếu đã cuộn xuống dưới cùng
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
      };

      // Thêm tin nhắn vào UI trước
      setMessages((prev) => [newMessage, ...prev]);
      scrollToBottom();

      if (!isOnline() || !socket?.connected) {
        // Lưu tin nhắn vào localStorage nếu đang offline
        const messageData = {
          content: message,
          conversationId: activeConversation.id,
          tempId: tempId,
          createdAt: new Date().toISOString(),
        };

        // Lấy các tin nhắn hiện có từ localStorage
        const storedMessages = localStorage.getItem("offlineMessages");
        const messages = storedMessages ? JSON.parse(storedMessages) : {};

        // Thêm tin nhắn mới vào danh sách
        if (!messages[activeConversation.id]) {
          messages[activeConversation.id] = [];
        }

        messages[activeConversation.id].push(messageData);

        // Lưu lại vào localStorage
        localStorage.setItem("offlineMessages", JSON.stringify(messages));

        // Hiển thị thông báo
        toast.warning("Tin nhắn sẽ được gửi khi bạn online", {
          id: "offline-message",
        });

        return;
      }

      // Gửi tin nhắn lên server nếu có kết nối
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
            msg.id === tempId ? { ...msg, id: serverId } : msg
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
      }

      // Xóa khỏi danh sách đang xử lý sau 30 giây
      setTimeout(() => {
        sentMessages.current.delete(messageKey);
      }, 30000);

      return Promise.resolve();
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      toast.error("Không thể gửi tin nhắn");

      // Lưu tin nhắn vào localStorage nếu có lỗi (có thể do mạng không ổn định)
      if (activeConversation) {
        const messageToSave = {
          conversationId: activeConversation.id,
          content: message.trim(),
          type: MessageType.TEXT,
          tempId: `temp-retry-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        // Lấy dữ liệu hiện tại từ localStorage
        const storedMessages = localStorage.getItem("offlineMessages");
        const offlineData = storedMessages ? JSON.parse(storedMessages) : {};

        // Thêm tin nhắn mới vào mảng tương ứng với cuộc trò chuyện
        if (!offlineData[activeConversation.id]) {
          offlineData[activeConversation.id] = [];
        }

        offlineData[activeConversation.id].push(messageToSave);

        // Lưu lại vào localStorage
        localStorage.setItem("offlineMessages", JSON.stringify(offlineData));

        toast.info("Tin nhắn sẽ được gửi lại khi có kết nối mạng", {
          id: "failed-message-saved",
        });
      }

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
            msg.id === tempId ? { ...msg, id: serverId } : msg
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
    // Nếu là tin nhắn văn bản
    if (!msg.type || msg.type === MessageType.TEXT) {
      return <p className="text-sm break-words">{msg.content}</p>;
    }

    // Hiển thị tệp tin dựa trên loại
    switch (msg.type) {
      case MessageType.IMAGE:
        return (
          <div className="flex flex-col gap-2 w-full">
            {/* Tên người gửi (chỉ hiển thị nếu không phải người dùng hiện tại) */}
            {msg.senderId !== userId && (
              <p className="text-xs font-medium">{msg.sender.name}</p>
            )}

            {/* Hình ảnh */}
            <div className="relative rounded-md overflow-hidden">
              <img
                src={msg.fileUrl}
                alt={msg.fileName || "Hình ảnh"}
                className="max-w-full max-h-[300px] rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(msg.fileUrl, "_blank")}
              />
            </div>

            {/* Chi tiết tin nhắn */}
            <div className="mt-1 flex flex-col">
              {/* Tin nhắn không phải "Đã gửi một hình ảnh" mặc định */}
              {msg.content !== "Đã gửi một hình ảnh" && (
                <p className="text-sm break-words">{msg.content}</p>
              )}

              <p className="text-xs opacity-70 mt-1">{msg.fileName}</p>
            </div>
          </div>
        );

      case MessageType.VIDEO:
        return (
          <div className="flex flex-col gap-2 w-full">
            {/* Tên người gửi (chỉ hiển thị nếu không phải người dùng hiện tại) */}
            {msg.senderId !== userId && (
              <p className="text-xs font-medium">{msg.sender.name}</p>
            )}

            {/* Video */}
            <div className="relative rounded-md overflow-hidden">
              <video
                src={msg.fileUrl}
                controls
                className="max-w-full max-h-[300px] rounded-md"
              />
            </div>

            {/* Chi tiết tin nhắn */}
            <div className="mt-1 flex flex-col">
              {/* Tin nhắn không phải "Đã gửi một video" mặc định */}
              {msg.content !== "Đã gửi một video" && (
                <p className="text-sm break-words">{msg.content}</p>
              )}

              <p className="text-xs opacity-70 mt-1">{msg.fileName}</p>
            </div>
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
      const filesToPreview = Array.from(files).slice(0, 5); // Giới hạn 5 ảnh

      // Tạo preview URL cho mỗi ảnh được chọn
      const imageAttachments = filesToPreview.map((file) => {
        // Tạo local preview URL
        const previewUrl = URL.createObjectURL(file);

        return {
          file,
          previewUrl,
          isUploaded: false,
        } as AttachedImage;
      });

      // Thêm ảnh mới vào danh sách preview
      setAttachedImages((prevImages) => {
        const updatedImages = [...prevImages, ...imageAttachments];
        // Nếu có quá nhiều ảnh, chỉ giữ lại 5 ảnh mới nhất
        return updatedImages.slice(0, 5);
      });

      // Reset input để có thể chọn lại cùng một file
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Lỗi khi tạo preview ảnh:", error);
      toast.error("Không thể hiển thị ảnh đính kèm");

      // Reset input nếu có lỗi
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  // Xóa ảnh đính kèm
  const removeAttachedImage = (index: number) => {
    setAttachedImages((prevImages) => {
      const newImages = [...prevImages];

      // Giải phóng object URL trước khi xóa
      if (newImages[index]?.previewUrl) {
        URL.revokeObjectURL(newImages[index].previewUrl);
      }

      // Xóa ảnh khỏi mảng
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Xóa tất cả ảnh đính kèm và giải phóng object URL
  const clearAttachedImages = () => {
    // Giải phóng tất cả object URLs
    attachedImages.forEach((img) => {
      if (img.previewUrl) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });

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

      // Lưu lại nội dung tin nhắn trước khi xóa khỏi input
      const messageContent = message.trim();

      // Thiết lập progress update
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 200);

      try {
        // Bắt đầu upload ảnh lên Cloudinary
        const uploadPromises = attachedImages.map(async (image) => {
          const formData = new FormData();
          formData.append("file", image.file);
          formData.append("conversationId", activeConversation.id.toString());

          // Upload ảnh lên server
          const response = await conversationApiRequest.uploadMessageFile(
            formData
          );

          return {
            file: image.file,
            url: response.payload.url,
            fileSize: response.payload.fileSize,
            fileType: response.payload.fileType,
            fileName: response.payload.fileName,
          };
        });

        // Chờ tất cả các ảnh được upload xong
        const uploadedFiles = await Promise.all(uploadPromises);

        // Gửi tin nhắn với các ảnh đã upload
        const result = await conversationApiRequest.sendMessageWithFiles(
          messageContent,
          uploadedFiles.map((file) => file.file),
          activeConversation.id
        );

        // Cập nhật UI dựa trên kết quả trả về
        if (result.messages && result.messages.length > 0) {
          // Hiển thị tin nhắn từ server
          for (const newMsg of result.messages) {
            // Đảm bảo giữ nguyên nội dung tin nhắn người dùng nhập
            let msgContent = newMsg.content;

            // Nếu là ảnh và có nội dung tin nhắn, sửa lại nội dung để giữ nguyên tin nhắn
            if (newMsg.type === MessageType.IMAGE && messageContent) {
              // Nếu nội dung bắt đầu với "[Hình ảnh]" hoặc "Đã gửi", thay đổi nội dung thành tin nhắn thực tế
              if (
                msgContent.startsWith("[Hình ảnh]") ||
                msgContent.startsWith("Đã gửi")
              ) {
                msgContent = messageContent;
              }
            }

            const serverMessage = {
              ...newMsg,
              content: msgContent,
              sender: {
                id: userId || 0,
                name: "Bạn",
                avatar: null,
              },
            };
            setMessages((prev) => [serverMessage, ...prev]);
          }

          // Cập nhật conversation với tin nhắn mới nhất
          const lastMessage = result.messages[result.messages.length - 1];
          setConversations((prevConversations) => {
            const typedConversations: Conversation[] = prevConversations;

            return typedConversations.map((conv) => {
              if (conv.id === activeConversation.id) {
                return {
                  ...conv,
                  latestMessage: {
                    id: lastMessage.id,
                    content: messageContent || lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    senderId: userId || 0,
                  },
                };
              }
              return conv;
            }) as Conversation[];
          });
        }

        // Giải phóng tất cả object URL
        attachedImages.forEach((img) => {
          if (img.previewUrl) {
            URL.revokeObjectURL(img.previewUrl);
          }
        });
      } finally {
        // Dừng interval progress update
        clearInterval(progressInterval);
      }

      // Đánh dấu tiến trình 100% khi hoàn thành
      setUploadProgress(100);

      // Xóa tất cả ảnh đã đính kèm
      clearAttachedImages();
      setMessage("");
      scrollToBottom();

      toast.success("Đã gửi tin nhắn và ảnh thành công!");

      // Đợi thêm chút thời gian để hiển thị 100%
      setTimeout(() => {
        setSendingImages(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn kèm ảnh:", error);
      toast.error("Không thể gửi tin nhắn kèm ảnh");

      // Giải phóng object URL nếu có lỗi
      attachedImages.forEach((img) => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    } finally {
      setSendingImages(false);
      setIsSendingMessage(false);
      setUploadProgress(0);
    }
  };

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

  // Thêm hiển thị trạng thái kết nối cho người dùng
  const ConnectionStatus = () => {
    if (online && socket?.connected) return null;

    return (
      <div className="flex items-center justify-center py-2 px-4 bg-yellow-100 text-yellow-800 rounded-md mb-2">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <span className="text-sm">
          {!online
            ? "Bạn đang offline. Tin nhắn sẽ được gửi khi có kết nối."
            : "Đang kết nối lại..."}
        </span>
      </div>
    );
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
                    {/* Phần tử kích hoạt tải thêm */}
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

                    {/* Thông tin debug */}
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
                      <div className="space-y-4 w-full pb-1">
                        {messages.length > 0 &&
                          [...messages].reverse().map((msg, index) => {
                            // Kiểm tra nếu là tin nhắn kiểu ảnh và có văn bản
                            const isTikTokStyleMessage =
                              (msg.type === MessageType.IMAGE ||
                                msg.type === MessageType.VIDEO) &&
                              msg.content !== "Đã gửi một hình ảnh" &&
                              msg.content !== "Đã gửi một video";

                            // Nếu là tin nhắn kiểu TikTok, hiển thị theo kiểu TikTok
                            if (isTikTokStyleMessage) {
                              return (
                                <div
                                  key={`msg-${msg.id}-${index}`}
                                  className={`flex ${
                                    msg.senderId === userId
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`max-w-[85%] sm:max-w-[75%] rounded-lg overflow-hidden ${
                                      msg.senderId === userId
                                        ? "bg-primary/5 rounded-tr-none"
                                        : "bg-muted rounded-tl-none"
                                    }`}
                                  >
                                    {/* Header với tên người gửi */}
                                    <div className="p-2 flex items-center gap-2 border-b">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage
                                          src={msg.sender.avatar || undefined}
                                        />
                                        <AvatarFallback>
                                          <UserCircle className="h-4 w-4" />
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-medium">
                                        {msg.sender.name}
                                      </span>
                                    </div>

                                    {/* Nội dung media */}
                                    <div className="relative">
                                      {msg.type === MessageType.IMAGE ? (
                                        <img
                                          src={msg.fileUrl}
                                          alt={msg.fileName || "Hình ảnh"}
                                          className="w-full max-h-[300px] object-cover"
                                        />
                                      ) : (
                                        <video
                                          src={msg.fileUrl}
                                          controls
                                          className="w-full max-h-[300px]"
                                        />
                                      )}
                                    </div>

                                    {/* Caption và nút tương tác */}
                                    <div className="p-3">
                                      <p className="text-sm break-words mb-2">
                                        {msg.content}
                                      </p>
                                      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                        <span>
                                          {new Date(
                                            msg.createdAt
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>

                                        {/* Nút tương tác */}
                                        <div className="flex gap-3 items-center">
                                          <button className="flex items-center gap-1">
                                            <span className="text-xs">❤️</span>
                                          </button>
                                          <button className="flex items-center gap-1">
                                            <span className="text-xs">💬</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            // Nếu không, sử dụng kiểu hiển thị tin nhắn thông thường
                            return (
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
                            );
                          })}
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
                        previewUrl: img.previewUrl,
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
                      {isSendingMessage ? (
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
      <div className="p-4 flex-1 overflow-hidden flex flex-col">
        <ConnectionStatus />
        {/* ... existing code ... */}
      </div>
    </div>
  );
}
