import { jwtDecode } from "jwt-decode";
import { AccessTokenPayload, RefreshTokenPayload } from "@/types/jwt.types";

export const decodeAccessToken = (token: string) => {
  return jwtDecode(token) as AccessTokenPayload;
};

export const decodeRefreshToken = (token: string) => {
  return jwtDecode(token) as RefreshTokenPayload;
};

const isBrowser = typeof window !== "undefined";

export const getAccessTokenFromLocalStorage = () =>
  isBrowser ? localStorage.getItem("accessToken") : null;

export const getRefreshTokenFromLocalStorage = () =>
  isBrowser ? localStorage.getItem("refreshToken") : null;

export const setAccessTokenToLocalStorage = (value: string) => {
  if (isBrowser) {
    localStorage.setItem("accessToken", value);
  }
};

export const setRefreshTokenToLocalStorage = (value: string) => {
  if (isBrowser) {
    localStorage.setItem("refreshToken", value);
  }
};

export const removeTokensFromLocalStorage = () => {
  if (isBrowser) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
};

// Hàm xóa cả localStorage và cookies khi tài khoản bị khóa
export const clearAuthData = async () => {
  // Xóa localStorage
  removeTokensFromLocalStorage();

  // Xóa cookies thông qua API
  if (isBrowser) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Lỗi khi xóa cookies:", error);
    }
  }
};
