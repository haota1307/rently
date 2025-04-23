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

type AppStoreType = {
  isAuth: boolean;
  role: RoleType | undefined;
  setRole: (role?: RoleType | undefined) => void;
  socket: Socket | undefined;
  setSocket: (socket?: Socket | undefined) => void;
  disconnectSocket: () => void;
};

export const useAppStore = create<AppStoreType>((set) => ({
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
}));

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setRole = useAppStore((state) => state.setRole);
  const setSocket = useAppStore((state) => state.setSocket);
  const count = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [socket, setSocketState] = useState<Socket | null>(null);

  // Đánh dấu component đã được mount trên client
  useEffect(() => {
    setMounted(true);
  }, []);

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
      }

      // Lắng nghe sự kiện cập nhật vai trò
      if (socketInstance) {
        socketInstance.on(
          "roleUpdate",
          (data: { status: string; note?: string }) => {
            // Làm mới token để cập nhật vai trò
            checkAndRefreshToken({
              force: true,
              onSuccess: () => {
                if (data.status === "APPROVED") {
                  toast.success(
                    "Yêu cầu nâng cấp tài khoản của bạn đã được chấp thuận!"
                  );
                } else {
                  toast.error(
                    `Yêu cầu nâng cấp tài khoản của bạn đã bị từ chối! ${
                      data.note ? `Lý do: ${data.note}` : ""
                    }`
                  );
                }
              },
            });
          }
        );

        // Lắng nghe sự kiện khóa tài khoản
        socketInstance.on(
          "accountBlocked",
          async (data: { message: string; reason?: string }) => {
            // Hiển thị thông báo rõ ràng cho người dùng
            toast.error(data.message || "Tài khoản của bạn đã bị khóa", {
              duration: 10000,
              position: "top-center",
              description: data.reason
                ? `Lý do: ${data.reason}`
                : "Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.",
            });

            // Hiển thị thông báo và tự động đăng xuất sau 3 giây
            setTimeout(async () => {
              try {
                // Đăng xuất người dùng với đầy đủ xóa token và cookie
                await clearAuthData();

                // Ngắt kết nối socket
                socketInstance.disconnect();

                // Cập nhật state
                setRole(undefined);
                setSocket(undefined);

                // Chuyển hướng người dùng đến trang đăng nhập
                window.location.href = "/dang-nhap?blocked=true";
              } catch (error) {
                console.error("Lỗi khi đăng xuất:", error);
                // Fallback nếu có lỗi
                removeTokensFromLocalStorage();
                window.location.href = "/dang-nhap?blocked=true";
              }
            }, 3000);
          }
        );
      }
    }

    // Cleanup khi component unmount
    return () => {
      if (socket) {
        socket.off("roleUpdate");
        socket.off("accountBlocked");
        socket.disconnect();
      }
    };
  }, [setRole, setSocket]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        {children}
        <RefreshToken />
        {mounted && <ListenRoleUpdateSocket />}
      </ConfirmProvider>
    </QueryClientProvider>
  );
}
