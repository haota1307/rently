import {
  LoginBodyType,
  LoginResType,
  LogoutBodyType,
  RefreshTokenBodyType,
  RefreshTokenResType,
} from "@/features/auth/schema/auth.schema";
import http from "@/lib/http";

const authApiRequest = {
  // --- Server-side endpoints (dùng trong SSR hoặc nội bộ, không cần baseUrl override) ---
  sLogin: (body: LoginBodyType) => http.post<LoginResType>("/auth/login", body),

  sLogout: (body: LogoutBodyType & { accessToken: string }) =>
    http.post(
      "/auth/logout",
      { refreshToken: body.refreshToken },
      {
        headers: {
          Authorization: `Bearer ${body.accessToken}`,
        },
      }
    ),

  sRefreshToken: (body: RefreshTokenBodyType) =>
    http.post<RefreshTokenResType>("/auth/refresh-token", body),

  // --- Client-side endpoints (đường dẫn sử dụng /api/auth/* và baseUrl là BASE_URL) ---
  login: (body: LoginBodyType) =>
    http.post<LoginResType>("/api/auth/login", body, { baseUrl: "" }),

  logout: () => http.post("/api/auth/logout", null, { baseUrl: "" }),

  // refreshTokenRequest dùng để tránh gọi nhiều lần trong cùng một chu kỳ refresh token
  refreshTokenRequest: null as Promise<{
    status: number;
    payload: RefreshTokenResType;
  }> | null,

  refreshToken: async function () {
    if (this.refreshTokenRequest) {
      return this.refreshTokenRequest;
    }
    this.refreshTokenRequest = http.post<RefreshTokenResType>(
      "/api/auth/refresh-token",
      null,
      { baseUrl: "" }
    );
    const result = await this.refreshTokenRequest;
    this.refreshTokenRequest = null;
    return result;
  },

  // Dùng để lưu accessToken và refreshToken vào cookie thông qua endpoint backend
  setTokenToCookie: (body: { accessToken: string; refreshToken: string }) =>
    http.post("/api/auth/token", body, { baseUrl: "" }),
};

export default authApiRequest;
