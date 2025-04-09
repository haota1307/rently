"use client";

import {
  decodeAccessToken,
  getAccessTokenFromLocalStorage,
  removeTokensFromLocalStorage,
  setAccessTokenToLocalStorage,
  checkAndRefreshToken,
} from "@/lib/utils";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "./app-provider";
import { Role, RoleType } from "@/constants/type";

export default function ListenRoleUpdateSocket() {
  const socket = useAppStore((state) => state.socket);
  const setRole = useAppStore((state) => state.setRole);

  useEffect(() => {
    // Kiểm tra nếu không có socket, return sớm
    if (!socket) return;

    try {
      // Đăng ký người dùng với socket
      const accessToken = getAccessTokenFromLocalStorage();
      if (!accessToken) return;

      const { userId } = decodeAccessToken(accessToken);
      socket.emit("register", { userId });

      // Lắng nghe sự kiện cập nhật vai trò
      socket.on("roleUpdate", async (data) => {
        const { status, note } = data;
        if (status === "APPROVED") {
          try {
            // Sử dụng checkAndRefreshToken thay vì gọi API trực tiếp
            checkAndRefreshToken({
              force: true,
              onSuccess: () => {
                // Lấy token mới đã được cập nhật từ localStorage
                const newToken = getAccessTokenFromLocalStorage();
                if (newToken) {
                  const { roleName } = decodeAccessToken(newToken);
                  setRole(roleName as RoleType);
                  toast.success(
                    "Yêu cầu nâng cấp vai trò của bạn đã được phê duyệt!"
                  );
                }
              },
              onError: () => {
                toast.error(
                  "Không thể cập nhật vai trò. Vui lòng thử lại sau."
                );
              },
            });
          } catch (error) {
            console.error(error);
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
      console.error("Lỗi khi thiết lập socket:", error);
    }

    // Dọn dẹp khi component unmount
    return () => {
      if (socket) {
        socket.off("roleUpdate");
      }
    };
  }, [socket, setRole]);

  return null;
}
