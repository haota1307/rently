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
      console.log("Socket đã kết nối");
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Socket đã ngắt kết nối");
      setSocketConnected(false);
    };

    // Xử lý khi nhận tin nhắn mới
    const handleNewMessage = (newMessage: Message) => {
      console.log("Nhận tin nhắn mới từ socket:", newMessage);

      // Kiểm tra userId hợp lệ
      if (!userId || isNaN(userId)) {
        console.error("userId không hợp lệ:", userId);
        return;
      }

      // Nếu tin nhắn đang được xử lý (từ api gửi đi), bỏ qua
      if (
        sentMessages.current.has(
          `${userId}-${newMessage.content}-${new Date(
            newMessage.createdAt
          ).getTime()}`
        )
      ) {
        console.log("Bỏ qua tin nhắn (đã xử lý từ API)");
        return;
      }

      // Tạo ID duy nhất cho tin nhắn
      const msgId = `${newMessage.id}-${newMessage.senderId}-${newMessage.content}`;
      const msgUniqueId = `${msgId}-${new Date(
        newMessage.createdAt
      ).getTime()}`;

      // Kiểm tra xem tin nhắn đã được xử lý trước đó chưa
      if (
        processedMessageIds.current.has(msgId) ||
        processedMessageIds.current.has(msgUniqueId)
      ) {
        console.log("Bỏ qua tin nhắn (đã xử lý từ socket)");
        return;
      }

      // Đánh dấu đã xử lý với cả hai ID
      processedMessageIds.current.add(msgId);
      processedMessageIds.current.add(msgUniqueId);

      // Kiểm tra xem tin nhắn đã tồn tại trong danh sách
      setMessages((prev) => {
        // Kiểm tra xem tin nhắn đã tồn tại chưa
        const messageExists = prev.some(
          (msg) =>
            (typeof msg.id === "number" &&
              typeof newMessage.id === "number" &&
              msg.id === newMessage.id) ||
            (typeof msg.id === "string" &&
              typeof newMessage.id === "string" &&
              msg.id === newMessage.id) ||
            (msg.senderId === newMessage.senderId &&
              msg.content === newMessage.content &&
              Math.abs(
                new Date(msg.createdAt).getTime() -
                  new Date(newMessage.createdAt).getTime()
              ) < 1000)
        );

        if (messageExists) {
          console.log("Tin nhắn đã tồn tại trong danh sách, không thêm vào");
          return prev;
        }

        // Thêm tin nhắn vào đầu danh sách
        return [newMessage, ...prev];
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
      console.log("Tin nhắn đã được đọc:", data);

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
  }, [socket, userId, activeConversation?.id, hasScrolledToBottom]);

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
