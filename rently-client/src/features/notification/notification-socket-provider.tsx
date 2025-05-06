"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/use-auth";
import { getAccessTokenFromLocalStorage } from "@/lib/utils";
import { toast } from "sonner";
import { Notification } from "@/schemas/notification.schema";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationSocketContextType {
  notifications: Notification[];
  unreadCount: number;
  connected: boolean;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
}

const NotificationSocketContext = createContext<
  NotificationSocketContextType | undefined
>(undefined);

export const useNotificationSocket = () => {
  const context = useContext(NotificationSocketContext);
  if (!context) {
    throw new Error(
      "useNotificationSocket must be used within a NotificationSocketProvider"
    );
  }
  return context;
};

interface NotificationSocketProviderProps {
  children: React.ReactNode;
}

export const NotificationSocketProvider: React.FC<
  NotificationSocketProviderProps
> = ({ children }) => {
  const { isAuthenticated, userId } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Khởi tạo kết nối socket khi user đã đăng nhập
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    const socketInstance = io(
      `${process.env.NEXT_PUBLIC_API_ENDPOINT}/notifications`,
      {
        autoConnect: true,
      }
    );

    setSocket(socketInstance);

    // Xử lý sự kiện kết nối, ngắt kết nối
    socketInstance.on("connect", () => {
      console.log("Connected to notification socket");
      setConnected(true);

      // Sau khi kết nối thành công, tham gia vào room của user
      socketInstance.emit("joinNotificationRoom", { userId });
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from notification socket");
      setConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnected(false);
    });

    // Cleanup khi component unmount
    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated, userId]);

  // Đăng ký các sự kiện từ server
  useEffect(() => {
    if (!socket) return;

    // Nhận thông báo mới
    socket.on("newNotification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Invalidate query cache để cập nhật danh sách thông báo từ API
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });

      // Hiển thị toast từ sonner
      toast(notification.title, {
        description: notification.message,
        action: notification.deepLink
          ? {
              label: "Xem",
              onClick: () => {
                router.push(notification.deepLink!);
                markAsRead(notification.id);
              },
            }
          : undefined,
      });
    });

    // Nhận số lượng thông báo chưa đọc
    socket.on("unreadCount", ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    // Cleanup
    return () => {
      socket.off("newNotification");
      socket.off("unreadCount");
    };
  }, [socket, router, queryClient]);

  // Đánh dấu thông báo đã đọc
  const markAsRead = (notificationId: number) => {
    // Cập nhật trạng thái UI ngay lập tức
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Gửi yêu cầu đến server
    socket?.emit("readNotification", notificationId);
  };

  // Đánh dấu tất cả thông báo đã đọc
  const markAllAsRead = () => {
    // Cập nhật trạng thái UI ngay lập tức
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationSocketContext.Provider
      value={{
        notifications,
        unreadCount,
        connected,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationSocketContext.Provider>
  );
};
