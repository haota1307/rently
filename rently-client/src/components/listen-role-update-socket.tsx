"use client";

import {
  decodeAccessToken,
  getAccessTokenFromLocalStorage,
  removeTokensFromLocalStorage,
  setAccessTokenToLocalStorage,
  checkAndRefreshToken,
  generateSocketInstance,
} from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "./app-provider";
import { Role, RoleType } from "@/constants/type";
import { io, Socket } from "socket.io-client";

export default function ListenRoleUpdateSocket() {
  const socket = useAppStore((state) => state.socket);
  const setRole = useAppStore((state) => state.setRole);
  const handledEvents = useRef(new Set<string>());
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [localSocket, setLocalSocket] = useState<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = useRef<NodeJS.Timeout | null>(null);

  // Hàm thiết lập kết nối socket độc lập
  const setupLocalSocket = () => {
    const accessToken = getAccessTokenFromLocalStorage();
    if (!accessToken) return;

    try {
      // Tạo một kết nối socket riêng chỉ để lắng nghe sự kiện roleUpdate
      const socketInstance = io(process.env.NEXT_PUBLIC_API_ENDPOINT || "", {
        auth: { token: accessToken },
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      socketInstance.on("connect", () => {
        console.log(
          "RoleUpdate socket kết nối thành công. ID:",
          socketInstance.id
        );
        setIsSocketReady(true);
        reconnectAttempts.current = 0;

        // Đăng ký userId với socket
        const decoded = decodeAccessToken(accessToken);
        const userId = decoded?.sub;
        if (userId) {
          console.log("RoleUpdate socket: đăng ký userId:", userId);
          socketInstance.emit("registerUser", userId);
          socketInstance.emit("join-user-room", { userId });
        }

        // Thiết lập ping định kỳ để giữ kết nối
        if (reconnectInterval.current) {
          clearInterval(reconnectInterval.current);
        }
        reconnectInterval.current = setInterval(() => {
          if (socketInstance.connected) {
            socketInstance.emit("ping", {
              timestamp: new Date().toISOString(),
            });
          }
        }, 30000);
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("RoleUpdate socket bị ngắt kết nối. Lý do:", reason);
        setIsSocketReady(false);
      });

      socketInstance.on("connect_error", (error) => {
        console.error("RoleUpdate socket kết nối lỗi:", error);
        reconnectAttempts.current++;

        if (reconnectAttempts.current > maxReconnectAttempts) {
          console.log("Đã vượt quá số lần thử kết nối lại. Dừng thử lại.");
          socketInstance.disconnect();
        }
      });

      setLocalSocket(socketInstance);
      return socketInstance;
    } catch (error) {
      console.error("Lỗi khi tạo kết nối RoleUpdate socket:", error);
      return null;
    }
  };

  // Hàm thiết lập lắng nghe sự kiện
  const setupRoleUpdateListener = (targetSocket: Socket) => {
    try {
      console.log("Thiết lập lắng nghe sự kiện roleUpdate");

      // Xóa lắng nghe cũ nếu có để tránh trùng lặp
      targetSocket.off("roleUpdate");

      // Lắng nghe sự kiện cập nhật vai trò
      targetSocket.on("roleUpdate", async (data) => {
        console.log("Đã nhận sự kiện roleUpdate:", data);

        // Tạo id duy nhất cho sự kiện để tránh xử lý trùng lặp
        const eventId = `${JSON.stringify(data)}-${Date.now()}`;
        if (handledEvents.current.has(eventId)) {
          console.log("Sự kiện đã được xử lý trước đó:", eventId);
          return;
        }

        // Đánh dấu sự kiện đã được xử lý
        handledEvents.current.add(eventId);

        // Xử lý nhiều định dạng data khác nhau từ hai loại sự kiện
        // notifyRoleUpdate và notifyRoleUpdated
        let status, note;

        if (data.status) {
          // Format từ notifyRoleUpdated
          status = data.status;
          note = data.note;
        } else if (data.event === "roleUpdate" && data.data) {
          // Format từ notifyRoleUpdate
          status = "APPROVED"; // Giả sử luôn là APPROVED vì đang gửi newRole
          note = null;
        } else if (typeof data === "string") {
          // Trường hợp data là string
          try {
            const parsedData = JSON.parse(data);
            status = parsedData.status || "APPROVED";
            note = parsedData.note;
          } catch (e) {
            console.error("Không thể parse data string:", data);
            status = "APPROVED"; // Fallback
          }
        }

        if (status === "APPROVED") {
          try {
            // Hiển thị toast trước khi refresh token
            toast.success(
              "Yêu cầu nâng cấp vai trò của bạn đã được phê duyệt!"
            );

            // Làm mới token để cập nhật vai trò
            await new Promise<void>((resolve) => {
              checkAndRefreshToken({
                force: true,
                onSuccess: () => {
                  // Lấy token mới đã được cập nhật từ localStorage
                  const newToken = getAccessTokenFromLocalStorage();
                  if (newToken) {
                    const { roleName } = decodeAccessToken(newToken);
                    // Cập nhật role vào store
                    setRole(roleName as RoleType);
                    console.log("Đã cập nhật role thành:", roleName);
                  }
                  resolve();
                },
                onError: () => {
                  toast.error(
                    "Không thể cập nhật vai trò. Vui lòng thử lại sau."
                  );
                  resolve();
                },
              });
            });

            // Tải lại trang để đảm bảo UI được cập nhật đầy đủ
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } catch (error) {
            console.error("Lỗi khi xử lý sự kiện roleUpdate:", error);
            toast.error("Không thể cập nhật vai trò. Vui lòng thử lại sau.");
          }
        } else if (status === "REJECTED") {
          toast.error(
            `Yêu cầu nâng cấp vai trò của bạn đã bị từ chối. ${
              note ? "Lý do: " + note : ""
            }`
          );
        }
      });
    } catch (error) {
      console.error("Lỗi khi thiết lập lắng nghe roleUpdate:", error);
    }
  };

  // Thiết lập kết nối socket độc lập
  useEffect(() => {
    // Khi vừa mount component
    const socketInstance = setupLocalSocket();

    // Cleanup khi unmount component
    return () => {
      if (localSocket) {
        localSocket.disconnect();
        setLocalSocket(null);
      }

      if (reconnectInterval.current) {
        clearInterval(reconnectInterval.current);
        reconnectInterval.current = null;
      }
    };
  }, []);

  // Thiết lập lắng nghe sự kiện trên cả socket chính và socket riêng
  useEffect(() => {
    // Lắng nghe trên socket chính từ AppProvider (để đảm bảo tương thích với code cũ)
    if (socket && socket.connected) {
      setupRoleUpdateListener(socket);
    }

    // Lắng nghe trên socket riêng (độc lập với AppProvider)
    if (localSocket && localSocket.connected) {
      setupRoleUpdateListener(localSocket);
    }
  }, [socket, localSocket, setRole]);

  // Thiết lập kiểm tra và phục hồi kết nối định kỳ
  useEffect(() => {
    const checkConnectionInterval = setInterval(() => {
      // Nếu không có socket nào sẵn sàng, thử khởi tạo lại socket riêng
      if (
        (!socket || !socket.connected) &&
        (!localSocket || !localSocket.connected)
      ) {
        console.log("Không có socket nào kết nối. Thử kết nối lại...");
        setupLocalSocket();
      }
    }, 60000); // Kiểm tra mỗi phút

    return () => clearInterval(checkConnectionInterval);
  }, [socket, localSocket]);

  return null;
}
