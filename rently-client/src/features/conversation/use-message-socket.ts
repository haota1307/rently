"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { Message, Conversation } from "./message.types";
import conversationApiRequest from "@/features/conversation/conversation.api";

interface UseMessageSocketProps {
  socket: Socket | undefined;
  activeConversation: Conversation | null;
  userId: number | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  hasScrolledToBottom: boolean;
  scrollToBottom: () => void;
}

// Hàm chuẩn hóa ngày tháng
const normalizeDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error("Lỗi khi chuyển đổi ngày:", error);
    return null;
  }
};

export function useMessageSocket({
  socket,
  activeConversation,
  userId,
  messages,
  setMessages,
  setConversations,
  hasScrolledToBottom,
  scrollToBottom,
}: UseMessageSocketProps) {
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketEvents, setSocketEvents] = useState<string[]>([]);

  // Thiết lập một tham chiếu để lưu tin nhắn đang xử lý
  const sentMessages = useRef(new Set<string>());
  // Thêm biến để theo dõi tin nhắn đã xử lý
  const processedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    // Xử lý kết nối socket
    const handleConnect = () => {
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    // Xử lý khi nhận tin nhắn mới
    const handleNewMessage = (newMessage: Message) => {
      // Kiểm tra userId hợp lệ
      if (!userId || isNaN(userId)) {
        console.error("userId không hợp lệ:", userId);
        return;
      }

      // Tạo ID duy nhất cho tin nhắn
      const msgId = `${newMessage.id}-${newMessage.senderId}`;

      // Kiểm tra xem tin nhắn đã được xử lý trước đó chưa
      if (processedMessageIds.current.has(msgId)) {
        return;
      }

      // Đánh dấu đã xử lý ngay lập tức
      processedMessageIds.current.add(msgId);

      // Nếu tin nhắn này là tin nhắn do chính người dùng hiện tại gửi
      // và có khả năng mới được gửi (trong vòng 5 giây)
      const isSelfMessageRecent =
        newMessage.senderId === userId &&
        Math.abs(
          new Date().getTime() - new Date(newMessage.createdAt).getTime()
        ) < 5000;

      // Kiểm tra xem tin nhắn đã tồn tại trong danh sách
      setMessages((prev) => {
        // Kiểm tra xem tin nhắn đã tồn tại chưa - cách so sánh cải tiến
        const existingMsgIndex = prev.findIndex(
          (msg) =>
            // So sánh theo ID chính xác
            (typeof msg.id === "number" &&
              typeof newMessage.id === "number" &&
              msg.id === newMessage.id) ||
            (typeof msg.id === "string" &&
              typeof newMessage.id === "string" &&
              msg.id === newMessage.id) ||
            // Hoặc nếu đó là tin nhắn tạm thời (temp-) với cùng người gửi và nội dung, được gửi gần đây
            (typeof msg.id === "string" &&
              msg.id.includes("temp-") &&
              msg.senderId === newMessage.senderId &&
              msg.content === newMessage.content &&
              isSelfMessageRecent)
        );

        // Nếu tin nhắn đã tồn tại, có thể cần cập nhật nó
        if (existingMsgIndex !== -1) {
          // Nếu đây là tin nhắn tạm thời cần được cập nhật với ID thực từ server
          if (
            typeof prev[existingMsgIndex].id === "string" &&
            prev[existingMsgIndex].id.includes("temp-") &&
            typeof newMessage.id === "number"
          ) {
            // Tạo bản sao mới của mảng tin nhắn
            const updatedMessages = [...prev];
            // Cập nhật tin nhắn tạm thời với ID thực và trạng thái "SENT"
            updatedMessages[existingMsgIndex] = {
              ...updatedMessages[existingMsgIndex],
              id: newMessage.id,
              status: "SENT",
              isRead: newMessage.isRead,
            };

            return updatedMessages;
          }

          return prev;
        }

        // Thêm tin nhắn mới
        let updatedMessages = [...prev];

        // Trước khi thêm, kiểm tra lại một lần nữa để đảm bảo không trùng lặp
        const isDuplicate = updatedMessages.some(
          (msg) =>
            (typeof msg.id === "number" &&
              typeof newMessage.id === "number" &&
              msg.id === newMessage.id) ||
            (typeof msg.id === "string" &&
              typeof newMessage.id === "string" &&
              msg.id === newMessage.id)
        );

        if (!isDuplicate) {
          updatedMessages.push(newMessage);
        } else {
          return prev;
        }

        // Sắp xếp lại tin nhắn theo thời gian tạo chính xác
        updatedMessages = updatedMessages.sort((a, b) => {
          // Sử dụng getTime() trực tiếp trên Date objects với xử lý giá trị null/undefined
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

          // Sắp xếp từ cũ đến mới
          return dateA - dateB;
        });

        return updatedMessages;
      });

      // Cập nhật danh sách cuộc trò chuyện
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.id === newMessage.conversationId) {
            // Cập nhật tin nhắn mới nhất và số tin chưa đọc
            const unreadCount =
              newMessage.senderId !== userId &&
              conv.id !== activeConversation?.id
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount || 0;

            // Chuyển đổi ID từ string sang number nếu cần
            const messageId =
              typeof newMessage.id === "string"
                ? parseInt(newMessage.id, 10)
                : newMessage.id;

            return {
              ...conv,
              latestMessage: {
                id: messageId,
                content: newMessage.content,
                createdAt: newMessage.createdAt,
                senderId: newMessage.senderId,
              },
              unreadCount,
            };
          }
          return conv;
        });
      });

      // Kiểm tra nếu tin nhắn thuộc cuộc trò chuyện hiện tại
      if (activeConversation?.id === newMessage.conversationId) {
        // Đánh dấu đã đọc nếu tin nhắn từ người khác
        if (newMessage.senderId !== userId) {
          // Kiểm tra lại userId trước khi đánh dấu đã đọc
          if (userId && !isNaN(userId)) {
            socket.emit("markMessageAsRead", {
              messageId: newMessage.id,
              conversationId: newMessage.conversationId,
              readerId: userId,
            });
          }

          // Gọi API để cập nhật trạng thái đã đọc
          try {
            conversationApiRequest.markAsRead(newMessage.conversationId);
          } catch (error) {
            console.error("Lỗi khi đánh dấu đã đọc:", error);
          }
        }

        // Cuộn xuống dưới nếu người dùng đang ở dưới cùng
        if (hasScrolledToBottom) {
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      }
    };

    // Xử lý khi tin nhắn được đánh dấu đã đọc
    const handleMessageRead = (data: {
      conversationId: number;
      readerId: number;
    }) => {
      // Cập nhật trạng thái đã đọc trong giao diện
      if (data.readerId !== userId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.conversationId === data.conversationId &&
            msg.senderId === userId
              ? { ...msg, isRead: true }
              : msg
          )
        );
      }
    };

    // Đặt trạng thái socket ban đầu
    setSocketConnected(socket.connected);

    // Đăng ký các sự kiện
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageRead", handleMessageRead);

    // Cleanup khi component unmount
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageRead", handleMessageRead);
    };
  }, [
    socket,
    userId,
    activeConversation?.id,
    hasScrolledToBottom,
    scrollToBottom,
  ]);

  // Hàm đánh dấu tin nhắn là đang được gửi (để tránh xử lý duplicate)
  const markMessageAsSending = (messageKey: string) => {
    sentMessages.current.add(messageKey);

    // Xóa khỏi danh sách đang xử lý sau 30 giây
    setTimeout(() => {
      sentMessages.current.delete(messageKey);
    }, 30000);
  };

  return {
    socketConnected,
    socketEvents,
    markMessageAsSending,
    sentMessages,
    processedMessageIds,
  };
}
