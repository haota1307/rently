import {
  LoginBodyType,
  LoginResType,
  LogoutBodyType,
  RefreshTokenBodyType,
  RefreshTokenResType,
  RegisterBodyType,
  RegisterResType,
  SendOTPBodyType,
} from "@/features/auth/schema/auth.schema";
import http from "@/lib/http";
import { MessageResType } from "@/types/message.type";

const authApiRequest = {
  sLogin: (body: LoginBodyType) => http.post<LoginResType>("/auth/login", body),

  login: (body: LoginBodyType) =>
    http.post<LoginResType>("/api/auth/login", body, { baseUrl: "" }),

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

  register: (body: RegisterBodyType) =>
    http.post<RegisterResType>("/auth/register", body),

  sendOTPCode: (body: SendOTPBodyType) =>
    http.post<MessageResType>("/auth/otp", body),

  logout: (body: LogoutBodyType) =>
    http.post("api/auth/logout", body, { baseUrl: "" }),

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
      "/auth/refresh-token",
      null,
      { baseUrl: "" }
    );
    const result = await this.refreshTokenRequest;
    this.refreshTokenRequest = null;
    return result;
  },

  // Dùng để lưu accessToken và refreshToken vào cookie thông qua endpoint backend
  setTokenToCookie: (body: { accessToken: string; refreshToken: string }) =>
    http.post("/auth/token", body, { baseUrl: "" }),
};

export default authApiRequest;
