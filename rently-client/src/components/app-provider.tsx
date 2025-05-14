"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useEffect, useRef, useState } from "react";
import {
  decodeAccessToken,
  getAccessTokenFromLocalStorage,
  removeTokensFromLocalStorage,
  checkAndRefreshToken,
  generateSocketInstance,
  clearAuthData,
} from "@/lib/utils";

import { create } from "zustand";
import RefreshToken from "@/components/refresh-token";
import { Role, RoleType } from "@/constants/type";
import { ConfirmProvider } from "./confirm-dialog";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { NotificationSocketProvider } from "@/features/notification/notification-socket-provider";

// Import ListenRoleUpdateSocket với chế độ client-side only
const ListenRoleUpdateSocket = dynamic(
  () => import("./listen-role-update-socket"),
  {
    ssr: false,
  }
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Thêm các type cho socket events
type SocketEventHandler = (...args: any[]) => void;
type PaymentStatusUpdate = {
  id: number;
  status: string;
  amount: number;
  description?: string;
};

type AppStoreType = {
  isAuth: boolean;
  role: RoleType | undefined;
  setRole: (role?: RoleType | undefined) => void;
  socket: Socket | undefined;
  setSocket: (socket?: Socket | undefined) => void;
  disconnectSocket: () => void;
  // Thêm các phương thức quản lý socket events
  registerSocketEvent: (eventName: string, handler: SocketEventHandler) => void;
  unregisterSocketEvent: (
    eventName: string,
    handler: SocketEventHandler
  ) => void;
  emitSocketEvent: (eventName: string, ...args: any[]) => void;
  // Thêm trạng thái và phương thức cho payment status
  paymentStatusListeners: Map<
    number,
    ((status: PaymentStatusUpdate) => void)[]
  >;
  addPaymentStatusListener: (
    paymentId: number,
    listener: (status: PaymentStatusUpdate) => void
  ) => void;
  removePaymentStatusListener: (
    paymentId: number,
    listener?: (status: PaymentStatusUpdate) => void
  ) => void;
  notifyPaymentStatusUpdate: (data: PaymentStatusUpdate) => void;
};

// Map để lưu trữ các event handlers
const socketEventHandlers = new Map<string, SocketEventHandler[]>();

export const useAppStore = create<AppStoreType>((set, get) => ({
  isAuth: false, // Mặc định false cho SSR
  role: undefined,
  setRole: (role?: RoleType) => set({ role, isAuth: !!role }),
  socket: undefined as Socket | undefined,
  setSocket: (socket?: Socket | undefined) => set({ socket }),
  disconnectSocket: () =>
    set((state) => {
      state.socket?.disconnect();
      return { socket: undefined };
    }),

  // Event management
  registerSocketEvent: (eventName: string, handler: SocketEventHandler) => {
    const { socket } = get();
    if (!socket) return;

    // Add to handler map
    const handlers = socketEventHandlers.get(eventName) || [];
    if (!handlers.includes(handler)) {
      handlers.push(handler);
      socketEventHandlers.set(eventName, handlers);

      // Register with socket if it's the first handler
      if (handlers.length === 1) {
        socket.on(eventName, (...args) => {
          const currentHandlers = socketEventHandlers.get(eventName) || [];
          currentHandlers.forEach((h) => h(...args));
        });
      }
    }
  },

  unregisterSocketEvent: (eventName: string, handler: SocketEventHandler) => {
    // Remove from handler map
    const handlers = socketEventHandlers.get(eventName) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      socketEventHandlers.set(eventName, handlers);
    }
  },

  emitSocketEvent: (eventName: string, ...args: any[]) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit(eventName, ...args);
    }
  },

  // Payment status listeners
  paymentStatusListeners: new Map(),

  addPaymentStatusListener: (
    paymentId: number,
    listener: (status: PaymentStatusUpdate) => void
  ) => {
    const { paymentStatusListeners } = get();
    const listeners = paymentStatusListeners.get(paymentId) || [];
    if (!listeners.includes(listener)) {
      listeners.push(listener);
      paymentStatusListeners.set(paymentId, listeners);
    }
    set({ paymentStatusListeners });
  },

  removePaymentStatusListener: (
    paymentId: number,
    listener?: (status: PaymentStatusUpdate) => void
  ) => {
    const { paymentStatusListeners } = get();
    if (listener) {
      const listeners = paymentStatusListeners.get(paymentId) || [];
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          paymentStatusListeners.delete(paymentId);
        } else {
          paymentStatusListeners.set(paymentId, listeners);
        }
      }
    } else {
      // Remove all listeners for this payment ID
      paymentStatusListeners.delete(paymentId);
    }
    set({ paymentStatusListeners });
  },

  notifyPaymentStatusUpdate: (data: PaymentStatusUpdate) => {
    const { paymentStatusListeners } = get();
    const listeners = paymentStatusListeners.get(data.id) || [];
    listeners.forEach((listener) => listener(data));
  },
}));

// Hook hỗ trợ đăng ký sự kiện socket
export function useSocketEvent(
  eventName: string,
  handler: SocketEventHandler,
  dependencies: any[] = []
) {
  const { socket, registerSocketEvent, unregisterSocketEvent } = useAppStore();

  useEffect(() => {
    if (socket && socket.connected) {
      registerSocketEvent(eventName, handler);

      return () => {
        unregisterSocketEvent(eventName, handler);
      };
    }
  }, [
    socket,
    eventName,
    registerSocketEvent,
    unregisterSocketEvent,
    ...dependencies,
  ]);
}

// Hook hỗ trợ theo dõi trạng thái payment
export function usePaymentStatusListener(
  paymentId: number | undefined,
  callback: (status: PaymentStatusUpdate) => void
) {
  const { addPaymentStatusListener, removePaymentStatusListener } =
    useAppStore();

  useEffect(() => {
    if (paymentId) {
      addPaymentStatusListener(paymentId, callback);

      return () => {
        removePaymentStatusListener(paymentId, callback);
      };
    }
  }, [
    paymentId,
    callback,
    addPaymentStatusListener,
    removePaymentStatusListener,
  ]);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const setRole = useAppStore((state) => state.setRole);
  const setSocket = useAppStore((state) => state.setSocket);
  const registerSocketEvent = useAppStore((state) => state.registerSocketEvent);
  const notifyPaymentStatusUpdate = useAppStore(
    (state) => state.notifyPaymentStatusUpdate
  );
  const count = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [socket, setSocketState] = useState<Socket | null>(null);

  // Đánh dấu component đã được mount trên client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hàm xử lý dữ liệu paymentStatusUpdated
  const processPaymentUpdateData = (updateData: any) => {
    let paymentId: number | null = null;

    // Trường hợp 1: Dữ liệu có id trực tiếp
    if (updateData.id) {
      paymentId = updateData.id;
    }
    // Trường hợp 2: Lấy id từ description (mẫu #RUTxx)
    else if (
      updateData.description &&
      typeof updateData.description === "string" &&
      updateData.description.includes("#RUT")
    ) {
      const match = updateData.description.match(/#RUT(\d+)/);
      if (match && match[1]) {
        paymentId = parseInt(match[1], 10);
      }
    }

    if (paymentId) {
      notifyPaymentStatusUpdate({
        id: paymentId,
        status: updateData.status || "COMPLETED",
        amount: updateData.amount || 0,
        description: updateData.description || "",
      });
    }
  };

  // Cập nhật socket khi component mount
  useEffect(() => {
    // Tránh chạy trên server
    if (typeof window === "undefined") return;

    // Kiểm tra token và tạo socket instance
    const accessToken = getAccessTokenFromLocalStorage();
    if (accessToken) {
      const decodedToken = decodeAccessToken(accessToken);
      const userId = decodedToken?.sub;
      const role = decodedToken?.roleName;

      // Cập nhật role vào store
      setRole(role as RoleType);

      const socketInstance = generateSocketInstance(accessToken);
      setSocketState(socketInstance);
      setSocket(socketInstance || undefined);

      // Đăng ký socket với userId từ token
      if (socketInstance && userId) {
        socketInstance.emit("registerUser", userId);

        // Tham gia room riêng cho user
        socketInstance.emit("join-user-room", { userId });

        // Tham gia room riêng cho admin nếu là admin
        if (role === Role.Admin) {
          socketInstance.emit("join-admin-room", { role: "admin" });
        }
      }

      // Thiết lập ping để giữ kết nối socket
      const pingInterval = setInterval(() => {
        if (socketInstance && socketInstance.connected) {
          socketInstance.emit("ping", { timestamp: new Date().toISOString() });
        } else if (socketInstance) {
          // Thử kết nối lại nếu mất kết nối
          socketInstance.connect();
        }
      }, 30000);

      // Đăng ký sự kiện payment status update
      if (socketInstance) {
        // Đảm bảo xóa lắng nghe cũ trước khi đăng ký mới
        socketInstance.off("paymentStatusUpdated");
        socketInstance.on("paymentStatusUpdated", processPaymentUpdateData);
      }

      return () => {
        clearInterval(pingInterval);
        if (socketInstance) {
          socketInstance.off("paymentStatusUpdated");
          socketInstance.disconnect();
        }
      };
    }

    return () => {
      // Nếu không có token, chỉ cần đảm bảo socket không còn
      setSocket(undefined);
    };
  }, [
    mounted,
    registerSocketEvent,
    setRole,
    setSocket,
    notifyPaymentStatusUpdate,
  ]);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <NotificationSocketProvider>{children}</NotificationSocketProvider>
          {mounted && (
            <>
              <RefreshToken />
              <ListenRoleUpdateSocket />
            </>
          )}
        </ConfirmProvider>
      </QueryClientProvider>
    </>
  );
}
