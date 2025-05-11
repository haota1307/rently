"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import conversationApiRequest from "@/features/conversation/conversation.api";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/components/app-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { ConversationList } from "@/features/conversation/components/conversation-list";
import { ChatHeader } from "@/features/conversation/components/chat-header";
import { MessageItem } from "@/features/conversation/components/message-item";
import { MessageInput } from "@/features/conversation/components/message-input";
import { Conversation, Message } from "@/features/conversation/message.types";

import { useMessageSocket } from "@/features/conversation/use-message-socket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

// Component chính của trang tin nhắn
function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get("id");
  const { isAuthenticated, userId } = useAuth();
  const socket = useAppStore((state) => state.socket);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // State cho mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State và refs cho chức năng tải lên tệp tin
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // State cho ảnh đính kèm
  const [attachedImages, setAttachedImages] = useState<any[]>([]);
  const [sendingImages, setSendingImages] = useState(false);

  // State cho file đính kèm
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [sendingFiles, setSendingFiles] = useState(false);

  // State cho infinite scroll
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  // State cho sửa tin nhắn
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageContent, setEditMessageContent] = useState("");

  // State quản lý dialog xác nhận xóa
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);

  // Tham chiếu refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastScrollPositionRef = useRef<number>(0);
  const scrollingUpRef = useRef<boolean>(false);
  const lastLoadTime = useRef<number>(0);
  const sentMessages = useRef<Set<string>>(new Set<string>());
  const processedMessageIds = useRef<Set<string>>(new Set<string>());

  // Sử dụng custom hook cho Socket
  const { socketConnected, markMessageAsSending } = useMessageSocket({
    socket,
    activeConversation,
    userId: userId || null,
    messages,
    setMessages,
    setConversations,
    hasScrolledToBottom,
    scrollToBottom: () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      }
    },
  });

  // Xử lý cuộn
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    try {
      const scrollElement = e.currentTarget;
      const viewport = scrollElement.querySelector(
        "[data-radix-scroll-area-viewport]"
      );

      if (!viewport) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = viewport as HTMLElement;
      const now = Date.now();

      // Xác định hướng cuộn
      const isScrollingUp = scrollTop < lastScrollPositionRef.current;
      lastScrollPositionRef.current = scrollTop;
      scrollingUpRef.current = isScrollingUp;

      // Tính toán phần trăm đã cuộn từ trên xuống
      const scrollPercentage =
        (scrollTop / (scrollHeight - clientHeight)) * 100;
      const isNearTop = scrollPercentage < 25 || scrollTop < 100;

      // Kích hoạt tải thêm tin nhắn khi: gần đầu trang và không đang tải
      if (
        isScrollingUp &&
        isNearTop &&
        !isLoadingMore &&
        currentPage < totalPages &&
        now - lastLoadTime.current > 1000
      ) {
        lastLoadTime.current = now;
        loadMoreMessages();
      }

      // Đánh dấu nếu đã cuộn xuống dưới cùng
      const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 50;
      setHasScrolledToBottom(isAtBottom);
    } catch (error) {
      console.error("Lỗi khi xử lý sự kiện cuộn:", error);
    }
  };

  // Thêm useEffect để thiết lập sự kiện scroll trực tiếp
  useEffect(() => {
    const scrollContainer = document.getElementById("messages-container");
    const viewport = scrollContainer?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;

    if (!viewport) {
      return;
    }

    const directScrollHandler = (e: Event) => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const now = Date.now();

      // Xác định hướng cuộn
      const isScrollingUp = scrollTop < lastScrollPositionRef.current;
      lastScrollPositionRef.current = scrollTop;
      scrollingUpRef.current = isScrollingUp;

      // Tính toán phần trăm đã cuộn từ trên xuống
      const scrollPercentage =
        (scrollTop / (scrollHeight - clientHeight)) * 100;
      const isNearTop = scrollPercentage < 25 || scrollTop < 100;

      // Kích hoạt tải thêm tin nhắn khi: gần đầu trang và không đang tải
      if (
        isScrollingUp &&
        isNearTop &&
        !isLoadingMore &&
        currentPage < totalPages &&
        now - lastLoadTime.current > 1000
      ) {
        lastLoadTime.current = now;
        loadMoreMessages();
      }

      // Đánh dấu nếu đã cuộn xuống dưới cùng
      const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 50;
      setHasScrolledToBottom(isAtBottom);
    };

    viewport.addEventListener("scroll", directScrollHandler);

    return () => {
      viewport.removeEventListener("scroll", directScrollHandler);
    };
  }, [currentPage, isLoadingMore, totalPages]);

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
      return;
    }

    try {
      setIsLoadingMore(true);

      // Lấy viewport để đo kích thước ban đầu
      const scrollContainer = document.getElementById("messages-container");
      const viewport = scrollContainer?.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement | null;

      // Lưu chiều cao trước khi thêm tin nhắn mới
      const initialHeight = viewport?.scrollHeight || 0;

      // Gọi API để lấy tin nhắn cũ hơn
      const response = await conversationApiRequest.getMessages(
        activeConversation.id,
        { page: currentPage + 1, limit: 15 }
      );

      if (!response?.payload?.data?.length) {
        setTotalPages(currentPage);
        setIsLoadingMore(false);
        return;
      }

      // Lấy danh sách ID tin nhắn hiện tại
      const existingMsgIds = new Set(
        messages.map((msg) =>
          typeof msg.id === "string" ? msg.id : String(msg.id)
        )
      );

      // Lọc ra những tin nhắn chưa có trong danh sách hiện tại
      const newMessages = response.payload.data.filter(
        (msg) => !existingMsgIds.has(String(msg.id))
      );

      if (newMessages.length === 0) {
        // Vẫn tăng trang vì chúng ta đã kiểm tra trang này
        setCurrentPage((prev) => prev + 1);
        setIsLoadingMore(false);
        return;
      }

      // Tăng số trang đã tải
      setCurrentPage((prev) => prev + 1);

      // Thêm tin nhắn mới vào TRƯỚC những tin nhắn hiện tại
      setMessages((prevMsgs) => [...newMessages, ...prevMsgs]);

      // Đợi DOM cập nhật
      setTimeout(() => {
        const updatedViewport = document
          .getElementById("messages-container")
          ?.querySelector(
            "[data-radix-scroll-area-viewport]"
          ) as HTMLElement | null;

        if (updatedViewport) {
          // Tính toán sự khác biệt về chiều cao
          const newHeight = updatedViewport.scrollHeight;
          const heightDiff = newHeight - initialHeight;

          // Đặt vị trí cuộn để người dùng vẫn ở vị trí tương đối như trước
          updatedViewport.scrollTop = heightDiff + 50; // +50px để có một chút không gian
        }
      }, 100);
    } catch (error) {
      console.error("Lỗi khi tải thêm tin nhắn:", error);
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
      markMessageAsSending(messageKey);

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
        type: "TEXT",
        status: "SENDING",
      };

      // Thêm tin nhắn vào UI trước
      setMessages((prev) => [...prev, newMessage]);

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
        type: "TEXT",
      });

      // Cập nhật tin nhắn với ID thực từ server (nếu có)
      if (response.payload && response.payload.id) {
        const serverId = response.payload.id;

        // Cập nhật trong messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, id: serverId, status: "SENT" } : msg
          )
        );
      }

      return Promise.resolve();
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
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
  };

  // Tải danh sách cuộc trò chuyện
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await conversationApiRequest.getConversations();
        // Thêm kiểu casting để bảo đảm kiểu dữ liệu đúng
        setConversations(response.payload.data as Conversation[]);

        // Nếu có id trong URL thì chọn cuộc trò chuyện đó
        if (conversationId) {
          const selectedConversation = response.payload.data.find(
            (conv) => conv.id === Number(conversationId)
          );
          if (selectedConversation) {
            setActiveConversation(selectedConversation as Conversation);
          }
        }
      } catch (error) {
        console.error(error);
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
        const totalPages = response.payload.totalPages || 1;
        setTotalPages(totalPages);

        // Kiểm tra dữ liệu tin nhắn trả về
        if (response && response.payload && response.payload.data) {
          // Đặt tin nhắn
          setMessages(response.payload.data);
        }

        // Đảm bảo rằng sau khi tải tin nhắn sẽ cuộn xuống dưới cùng (tin nhắn mới nhất)
        setTimeout(() => {
          scrollToBottom();
          setInitialScrollDone(true);
          setHasScrolledToBottom(true);
        }, 300);
      } catch (error) {
        console.error("Lỗi khi tải tin nhắn:", error);
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
        console.log(`Rời phòng chat: ${activeConversation.id}`);
        socket.emit("leaveChat", activeConversation.id);
      }
    };
  }, [activeConversation, socket]);

  // Xử lý cuộn xuống dưới cùng khi tin nhắn thay đổi
  useEffect(() => {
    // Chỉ tự động cuộn xuống dưới trong các trường hợp:
    // 1. Khi mới tải trang và chưa cuộn lần nào
    // 2. Khi tin nhắn mới được thêm vào (do chính mình gửi hoặc nhận từ người khác)
    if (!initialScrollDone || hasScrolledToBottom) {
      scrollToBottom();
      setInitialScrollDone(true);
      setHasScrolledToBottom(true);
    }
  }, [messages, initialScrollDone, hasScrolledToBottom]);

  // Hàm xử lý xóa tin nhắn
  const handleDeleteMessage = async (messageId: number) => {
    try {
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
    } catch (error) {
      console.error("Lỗi khi xóa tin nhắn:", error);
    }
  };

  // Hàm xác nhận xóa tin nhắn
  const confirmDelete = (messageId: number) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  // Hàm xử lý xóa tin nhắn sau khi xác nhận
  const onConfirmDelete = () => {
    if (messageToDelete !== null) {
      handleDeleteMessage(messageToDelete);
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  // Hàm xử lý chỉnh sửa tin nhắn
  const handleEditMessage = async (messageId: number, content: string) => {
    try {
      // Cập nhật UI ngay lập tức
      setMessages((prev) =>
        prev.map((msg) =>
          typeof msg.id === "number" && msg.id === messageId
            ? { ...msg, content, isEdited: true }
            : msg
        )
      );

      // Gọi API sửa tin nhắn
      await conversationApiRequest.editMessage(messageId, content);

      // Reset trạng thái chỉnh sửa
      setEditingMessageId(null);
      setEditMessageContent("");
    } catch (error) {
      console.error("Lỗi khi sửa tin nhắn:", error);
    }
  };

  // Xử lý chọn hình ảnh
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const MAX_IMAGES = 10;

      // Kiểm tra số lượng ảnh
      if (e.target.files.length > MAX_IMAGES) {
        alert(`Chỉ có thể chọn tối đa ${MAX_IMAGES} ảnh cùng lúc`);
        e.target.value = "";
        return;
      }

      // Kiểm tra kích thước ảnh
      const invalidFiles: string[] = [];
      const validFiles: File[] = [];

      Array.from(e.target.files).forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${file.name} (vượt quá 10MB)`);
        } else {
          validFiles.push(file);
        }
      });

      // Thông báo các ảnh không hợp lệ
      if (invalidFiles.length > 0) {
        alert(`Các ảnh sau không hợp lệ:\n${invalidFiles.join("\n")}`);
      }

      // Nếu không có ảnh hợp lệ nào, dừng xử lý
      if (validFiles.length === 0) {
        e.target.value = "";
        return;
      }

      // Giới hạn số lượng ảnh hiện tại + ảnh mới
      if (attachedImages.length + validFiles.length > MAX_IMAGES) {
        alert(`Chỉ có thể đính kèm tối đa ${MAX_IMAGES} ảnh cùng lúc`);
        e.target.value = "";
        return;
      }

      const newImages = validFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isUploaded: false,
      }));

      setAttachedImages([...attachedImages, ...newImages]);

      // Reset input để có thể chọn lại file đã chọn
      e.target.value = "";
    }
  };

  // Xử lý chọn file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const MAX_FILES = 5;

      // Kiểm tra số lượng file
      if (e.target.files.length > MAX_FILES) {
        alert(`Chỉ có thể chọn tối đa ${MAX_FILES} file cùng lúc`);
        e.target.value = "";
        return;
      }

      // Danh sách các loại file được phép
      const allowedFileTypes = [
        // Document
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        // Excel
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        // PowerPoint
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        // Text
        "text/plain",
        "text/csv",
        // Cho phép thêm các định dạng ảnh và video phổ biến
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/ogg",
      ];

      // Kiểm tra kích thước file và loại file
      const invalidFiles: string[] = [];
      const invalidTypeFiles: string[] = [];
      const validFiles: File[] = [];

      Array.from(e.target.files).forEach((file) => {
        // Kiểm tra kích thước
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${file.name} (vượt quá 10MB)`);
        }
        // Kiểm tra loại file
        else if (!allowedFileTypes.includes(file.type)) {
          invalidTypeFiles.push(`${file.name} (loại file không được hỗ trợ)`);
        } else {
          validFiles.push(file);
        }
      });

      // Thông báo các file không hợp lệ về kích thước
      if (invalidFiles.length > 0) {
        alert(
          `Các file sau có kích thước quá lớn:\n${invalidFiles.join("\n")}`
        );
      }

      // Thông báo các file không hợp lệ về loại
      if (invalidTypeFiles.length > 0) {
        alert(
          `Các file sau không được hỗ trợ:\n${invalidTypeFiles.join(
            "\n"
          )}\n\nChỉ chấp nhận các tệp PDF, Word, Excel, PowerPoint, CSV, TXT, ảnh và video phổ biến.`
        );
      }

      // Nếu không có file hợp lệ nào, dừng xử lý
      if (validFiles.length === 0) {
        e.target.value = "";
        return;
      }

      // Giới hạn số lượng file hiện tại + file mới
      if (attachedFiles.length + validFiles.length > MAX_FILES) {
        alert(`Chỉ có thể đính kèm tối đa ${MAX_FILES} file cùng lúc`);
        e.target.value = "";
        return;
      }

      // Tạo preview cho các file hợp lệ
      const newFiles = validFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isUploaded: false,
      }));

      setAttachedFiles([...attachedFiles, ...newFiles]);

      // Reset input để có thể chọn lại file đã chọn
      e.target.value = "";
    }
  };

  // Gửi tin nhắn kèm file
  const sendFilesWithMessage = async () => {
    if (!activeConversation) return;

    try {
      setSendingFiles(true);
      // Lấy tất cả các file
      const files = attachedFiles.map((f) => f.file);

      console.log(
        "Chuẩn bị gửi files:",
        files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      );

      // Kiểm tra kích thước file trước khi gửi
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);

      if (oversizedFiles.length > 0) {
        alert(
          `Các file sau vượt quá kích thước cho phép (10MB): ${oversizedFiles
            .map((f) => f.name)
            .join(", ")}`
        );
        setSendingFiles(false);
        return;
      }

      // Chỉ gửi tối đa 5 file cùng lúc
      if (files.length > 5) {
        alert("Chỉ có thể gửi tối đa 5 file cùng một lúc");
        setSendingFiles(false);
        return;
      }

      // Gửi tin nhắn kèm file với phương thức cải tiến
      const result = await conversationApiRequest.sendMessageWithFiles(
        message,
        files,
        activeConversation.id
      );

      console.log("Kết quả gửi tin nhắn:", result);

      // Xóa message khỏi input và xóa các file đã đính kèm
      setMessage("");

      // Xóa các URL tạm thời để tránh rò rỉ bộ nhớ
      attachedFiles.forEach((file) => {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
      });

      setAttachedFiles([]);

      // Cuộn xuống dưới cùng
      scrollToBottom();
    } catch (error: any) {
      console.error("Lỗi khi gửi tin nhắn kèm file:", error);

      // Chi tiết về lỗi để debug
      if (error.response) {
        console.error("Response error:", error.response);
      }

      // Hiển thị thông báo lỗi cụ thể cho người dùng
      if (error.name === "EntityError") {
        alert(
          `Lỗi gửi file: ${error.payload?.message || "Không thể gửi file"}`
        );
      } else if (error.message) {
        alert(`Không thể gửi file: ${error.message}`);
      } else {
        alert("Không thể gửi file, vui lòng thử lại sau");
      }
    } finally {
      setSendingFiles(false);
    }
  };

  // Gửi tin nhắn kèm ảnh
  const sendImagesWithMessage = async () => {
    if (!activeConversation) return;

    try {
      setSendingImages(true);
      // Lấy tất cả các file ảnh
      const imageFiles = attachedImages.map((img) => img.file);

      console.log(
        "Chuẩn bị gửi ảnh:",
        imageFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      );

      // Kiểm tra kích thước file trước khi gửi
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = imageFiles.filter(
        (file) => file.size > MAX_FILE_SIZE
      );

      if (oversizedFiles.length > 0) {
        alert(
          `Các file sau vượt quá kích thước cho phép (10MB): ${oversizedFiles
            .map((f) => f.name)
            .join(", ")}`
        );
        setSendingImages(false);
        return;
      }

      // Gửi tin nhắn kèm ảnh
      const result = await conversationApiRequest.sendMessageWithFiles(
        message,
        imageFiles,
        activeConversation.id
      );

      console.log("Kết quả gửi tin nhắn ảnh:", result);

      // Xóa message khỏi input và xóa các ảnh đã đính kèm
      setMessage("");

      // Xóa các URL tạm thời để tránh rò rỉ bộ nhớ
      attachedImages.forEach((img) => {
        if (img.url) {
          URL.revokeObjectURL(img.url);
        }
      });

      setAttachedImages([]);

      // Cuộn xuống dưới cùng
      scrollToBottom();
    } catch (error: any) {
      console.error("Lỗi khi gửi tin nhắn kèm ảnh:", error);

      // Chi tiết về lỗi để debug
      if (error.response) {
        console.error("Response error:", error.response);
      }

      // Hiển thị thông báo lỗi cụ thể cho người dùng
      if (error.name === "EntityError") {
        alert(`Lỗi gửi ảnh: ${error.payload?.message || "Không thể gửi ảnh"}`);
      } else if (error.message) {
        alert(`Không thể gửi ảnh: ${error.message}`);
      } else {
        alert("Không thể gửi ảnh, vui lòng thử lại sau");
      }
    } finally {
      setSendingImages(false);
    }
  };

  // Render các nhóm tin nhắn theo ngày
  const renderMessages = () => {
    if (loadingMessages) {
      return null;
    }

    if (messages.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <p>Hãy bắt đầu cuộc trò chuyện...</p>
        </div>
      );
    }

    // Nhóm tin nhắn theo ngày
    const groupedMessages = messages.reduce(
      (groups: Record<string, Message[]>, message: Message) => {
        const date = new Date(message.createdAt);
        const dateKey = format(date, "yyyy-MM-dd");

        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }

        groups[dateKey].push(message);
        return groups;
      },
      {} as Record<string, Message[]>
    );

    // Format hiển thị ngày
    const formatDateLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      if (isToday(date)) return "Hôm nay";
      if (isYesterday(date)) return "Hôm qua";
      return format(date, "EEEE, d MMMM, yyyy", { locale: vi });
    };

    // Hiển thị tin nhắn theo nhóm ngày
    return (
      <div className="space-y-4 w-full pb-1">
        {Object.entries(groupedMessages)
          .sort(
            ([dateA], [dateB]) =>
              new Date(dateA).getTime() - new Date(dateB).getTime()
          )
          .map(([dateKey, messagesInDay]) => (
            <div key={dateKey}>
              {/* Hiển thị nhãn ngày */}
              <div className="text-center my-4 relative">
                <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
                <span className="relative inline-block bg-white dark:bg-slate-700 px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                  {formatDateLabel(dateKey)}
                </span>
              </div>

              {/* Hiển thị tin nhắn trong ngày - sắp xếp từ cũ đến mới */}
              <div className="space-y-1">
                {messagesInDay
                  .sort(
                    (a: Message, b: Message) =>
                      new Date(a.createdAt).getTime() -
                      new Date(b.createdAt).getTime()
                  )
                  .map((msg: Message) => (
                    <MessageItem
                      key={`msg-${msg.id}-${new Date(msg.createdAt).getTime()}`}
                      msg={msg}
                      userId={userId || 0}
                      setEditingMessageId={setEditingMessageId}
                      setEditMessageContent={setEditMessageContent}
                      confirmDelete={confirmDelete}
                      handleEditMessage={handleEditMessage}
                      editingMessageId={editingMessageId}
                      editMessageContent={editMessageContent}
                    />
                  ))}
              </div>
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  // Chỉnh sửa ChatHeader component để thêm nút hiện/ẩn sidebar
  const ChatHeaderWithSidebar = ({
    activeConversation,
    socketConnected,
    userId,
  }: {
    activeConversation: Conversation | null;
    socketConnected: boolean;
    userId: number | null;
  }) => {
    // Kiểm tra xem cần hiển thị thông tin của người dùng nào
    const getDisplayUser = (conversation: Conversation) => {
      return userId === conversation.userOneId
        ? conversation.userTwo
        : conversation.userOne;
    };

    if (!activeConversation) return null;

    const displayUser = getDisplayUser(activeConversation);

    return (
      <div className="border-b py-3 px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Nút toggle sidebar trên mobile */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle conversation list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <Avatar>
            <AvatarImage src={displayUser.avatar || undefined} />
            <AvatarFallback>
              <UserCircle className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{displayUser.name}</div>
          </div>
        </div>

        {!socketConnected && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Loader2 className="animate-spin h-3 w-3 mr-1" />
            Đang kết nối...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-full w-full p-0 sm:p-4 mx-auto">
      {/* Dialog xác nhận xóa tin nhắn */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa tin nhắn</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa tin nhắn này không? Hành động này không
              thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={onConfirmDelete}>
              Xóa tin nhắn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4 h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] relative">
        {/* Overlay để đóng sidebar khi nhấp bên ngoài trên mobile */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Danh sách cuộc trò chuyện */}
        <div
          className={`
            md:col-span-1 h-full overflow-hidden 
            fixed md:relative inset-y-0 left-0 
            w-[85%] sm:w-3/4 md:w-auto 
            z-50 md:z-auto
            bg-background
            shadow-lg md:shadow-none
            transition-all duration-300 ease-in-out
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-3 border-b md:hidden flex items-center justify-between">
              <h2 className="font-semibold text-lg">Tin nhắn</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-full hover:bg-muted"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <ConversationList
              loading={loading}
              conversations={conversations}
              activeConversation={activeConversation}
              userId={userId}
              onSelectConversation={(conversation, e) => {
                handleConversationClick(conversation, e);
                // Đóng sidebar sau khi chọn cuộc trò chuyện trên mobile
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            />
          </div>
        </div>

        {/* Khung chat */}
        <div className="md:col-span-2 h-full overflow-hidden">
          <Card className="h-full flex flex-col rounded-none md:rounded-md border-0 md:border">
            {activeConversation ? (
              <>
                {/* Header của chat */}
                <ChatHeaderWithSidebar
                  activeConversation={activeConversation}
                  socketConnected={socketConnected}
                  userId={userId || null}
                />

                {/* Tin nhắn */}
                <ScrollArea
                  className="flex-1 px-3 sm:px-6 py-4 h-0 w-full"
                  id="messages-container"
                  onScroll={handleScroll}
                >
                  <div>
                    {/* Phần tử kích hoạt tải thêm tin nhắn - đặt ở đầu để kích hoạt khi cuộn lên */}
                    <div
                      className="h-10 w-full my-2 flex items-center justify-center -mt-2"
                      id="load-more-trigger"
                    >
                      {isLoadingMore ? (
                        <div className="flex flex-col items-center gap-1 py-2">
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

                    {/* Hiển thị tin nhắn theo nhóm */}
                    {renderMessages()}
                  </div>
                </ScrollArea>

                {/* Khung nhập tin nhắn - Sẽ truyền các function và state cần thiết */}
                <MessageInput
                  message={message}
                  setMessage={setMessage}
                  handleSendMessage={handleSendMessage}
                  isSendingMessage={isSendingMessage}
                  uploading={uploading}
                  selectedFile={selectedFile}
                  uploadProgress={uploadProgress}
                  sendingImages={sendingImages || sendingFiles}
                  attachedImages={attachedImages}
                  attachedFiles={attachedFiles}
                  removeAttachedImage={(index) => {
                    setAttachedImages((prevImages) => {
                      const newImages = [...prevImages];
                      // Hủy URL.createObjectURL để tránh rò rỉ bộ nhớ
                      URL.revokeObjectURL(newImages[index].url);
                      newImages.splice(index, 1);
                      return newImages;
                    });
                  }}
                  removeAttachedFile={(index) => {
                    setAttachedFiles((prevFiles) => {
                      const newFiles = [...prevFiles];
                      // Hủy URL.createObjectURL để tránh rò rỉ bộ nhớ
                      URL.revokeObjectURL(newFiles[index].url);
                      newFiles.splice(index, 1);
                      return newFiles;
                    });
                  }}
                  handleImageSelect={handleImageSelect}
                  handleFileSelect={handleFileSelect}
                  sendImagesWithMessage={sendImagesWithMessage}
                  sendFilesWithMessage={sendFilesWithMessage}
                />
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center h-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-muted-foreground/50 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="mb-2">Hãy chọn một cuộc trò chuyện để bắt đầu</p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                >
                  Mở danh sách tin nhắn
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">Đang tải ứng dụng tin nhắn...</div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
