"use client";

import {
  decodeAccessToken,
  getAccessTokenFromLocalStorage,
  removeTokensFromLocalStorage,
  setAccessTokenToLocalStorage,
  checkAndRefreshToken,
} from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "./app-provider";
import { Role, RoleType } from "@/constants/type";

export default function ListenRoleUpdateSocket() {
  const socket = useAppStore((state) => state.socket);
  const setRole = useAppStore((state) => state.setRole);
  const handledEvents = useRef(new Set<string>());
  const [isSocketReady, setIsSocketReady] = useState(false);

  // Hàm thiết lập lắng nghe sự kiện
  const setupRoleUpdateListener = () => {
    if (!socket || !socket.connected) {
      console.log("Socket chưa kết nối, không thể lắng nghe sự kiện");
      return;
    }

    try {
      console.log("Thiết lập lắng nghe sự kiện roleUpdate");

      // Xóa lắng nghe cũ nếu có để tránh trùng lặp
      socket.off("roleUpdate");

      // Lắng nghe sự kiện cập nhật vai trò
      socket.on("roleUpdate", async (data) => {
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

  // Lắng nghe trạng thái kết nối socket
  useEffect(() => {
    if (!socket) return;

    // Thiết lập khi socket đã kết nối
    if (socket.connected) {
      console.log("Socket đã kết nối. ID:", socket.id);
      setIsSocketReady(true);
    }

    // Đăng ký người dùng với socket và tham gia room
    const accessToken = getAccessTokenFromLocalStorage();
    if (!accessToken) return;

    const decoded = decodeAccessToken(accessToken);
    const userId = decoded?.sub;

    if (userId) {
      console.log("Đăng ký userId với socket:", userId);
      socket.emit("register", { userId });
      socket.emit("registerUser", userId);
      socket.emit("join-user-room", { userId });
    }

    // Xử lý sự kiện kết nối
    const onConnect = () => {
      console.log("Socket kết nối thành công. ID:", socket.id);
      setIsSocketReady(true);

      // Đăng ký lại userId khi kết nối lại
      if (userId) {
        socket.emit("register", { userId });
        socket.emit("registerUser", userId);
        socket.emit("join-user-room", { userId });
      }
    };

    // Xử lý sự kiện mất kết nối
    const onDisconnect = (reason: string) => {
      console.log("Socket bị ngắt kết nối. Lý do:", reason);
      setIsSocketReady(false);
    };

    // Lắng nghe sự kiện kết nối
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("roleUpdate");
    };
  }, [socket]);

  // Thiết lập lắng nghe sự kiện roleUpdate khi socket đã sẵn sàng
  useEffect(() => {
    if (isSocketReady && socket) {
      setupRoleUpdateListener();

      // Gửi tin nhắn ping để đảm bảo kết nối ổn định
      socket.emit("ping", { timestamp: new Date().toISOString() });
    }
  }, [isSocketReady, socket, setRole]);

  return null;
}
