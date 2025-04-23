import { LoginResType, RefreshTokenResType } from "@/schemas/auth.schema";
import {
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  normalizePath,
  removeTokensFromLocalStorage,
  setAccessTokenToLocalStorage,
  setRefreshTokenToLocalStorage,
  clearAuthData,
} from "@/lib/utils";

import { redirect } from "next/navigation";

type CustomOptions = Omit<RequestInit, "method"> & {
  baseUrl?: string | undefined;
};

const ENTITY_ERROR_STATUS = 422;
const AUTHENTICATION_ERROR_STATUS = 401;

type EntityErrorPayload = {
  message: string;
  errors: {
    field: string;
    message: string;
  }[];
};

export class HttpError extends Error {
  status: number;
  payload: {
    message: string;
    [key: string]: any;
  };
  constructor({
    status,
    payload,
    message = "Lỗi HTTP",
  }: {
    status: number;
    payload: any;
    message?: string;
  }) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export class EntityError extends HttpError {
  status: typeof ENTITY_ERROR_STATUS;
  payload: EntityErrorPayload;
  constructor({
    status,
    payload,
  }: {
    status: typeof ENTITY_ERROR_STATUS;
    payload: EntityErrorPayload;
  }) {
    super({ status, payload, message: "Lỗi thực thể" });
    this.status = status;
    this.payload = payload;
  }
}

let clientLogoutRequest: null | Promise<any> = null;
let refreshTokenRequest: null | Promise<any> = null;
const isClient = typeof window !== "undefined";

// Agent xử lý token refresh
class AuthAgent {
  // Cố gắng refresh token và trả về token mới
  async refreshTokens() {
    if (refreshTokenRequest) {
      return refreshTokenRequest;
    }

    try {
      const refreshToken = getRefreshTokenFromLocalStorage();
      if (!refreshToken) {
        throw new Error("Không tìm thấy refresh token");
      }

      refreshTokenRequest = fetch("/api/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await refreshTokenRequest;
      if (!response.ok) {
        throw new Error("Refresh token thất bại");
      }

      const data = await response.json();

      // Cập nhật tokens mới vào localStorage
      setAccessTokenToLocalStorage(data.accessToken);
      setRefreshTokenToLocalStorage(data.refreshToken);

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    } catch (error) {
      console.error("Lỗi khi refresh token:", error);
      throw error;
    } finally {
      refreshTokenRequest = null;
    }
  }

  // Kiểm tra và quản lý đăng xuất
  async handleLogout() {
    if (clientLogoutRequest) {
      return clientLogoutRequest;
    }

    // Xóa tokens khỏi localStorage
    removeTokensFromLocalStorage();

    // Gọi API để xóa cookies trên server
    clientLogoutRequest = fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    try {
      await clientLogoutRequest;
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      clientLogoutRequest = null;
      location.href = "/dang-nhap";
    }
  }
}

const authAgent = new AuthAgent();

// Thực hiện request với retry logic khi token hết hạn
const request = async <Response>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  options?: CustomOptions | undefined,
  retryCount = 0
) => {
  const MAX_RETRIES = 1; // Chỉ retry 1 lần để tránh vòng lặp vô hạn

  let body: FormData | string | undefined = undefined;
  if (options?.body instanceof FormData) {
    body = options.body;
  } else if (options?.body) {
    body = JSON.stringify(options.body);
  }
  const baseHeaders: {
    [key: string]: string;
  } =
    body instanceof FormData
      ? {}
      : {
          "Content-Type": "application/json",
        };

  if (isClient) {
    const accessToken = getAccessTokenFromLocalStorage();
    if (accessToken) {
      baseHeaders.Authorization = `Bearer ${accessToken}`;
    }
  }

  const baseUrl =
    options?.baseUrl === undefined
      ? process.env.NEXT_PUBLIC_API_ENDPOINT
      : options.baseUrl;

  const fullUrl = `${baseUrl}/${normalizePath(url)}`;

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        ...baseHeaders,
        ...options?.headers,
      } as any,
      body,
      method,
    });

    const payload: Response = await res.json();
    const data = {
      status: res.status,
      payload,
    };

    // Xử lý response errors
    if (!res.ok) {
      if (res.status === ENTITY_ERROR_STATUS) {
        throw new EntityError(
          data as {
            status: 422;
            payload: EntityErrorPayload;
          }
        );
      } else if (res.status === AUTHENTICATION_ERROR_STATUS) {
        // Kiểm tra nếu là lỗi tài khoản bị khóa
        const anyPayload = payload as any;
        if (
          anyPayload?.message === "Error.UserBlocked" ||
          anyPayload?.message === "Error.UnauthorizedAccess"
        ) {
          if (isClient) {
            // Buộc đăng xuất ngay lập tức nếu tài khoản bị khóa (xóa cả localStorage và cookies)
            if (anyPayload?.message === "Error.UserBlocked") {
              // Dùng async/await trong context sync, nên phải dùng Promise catch
              clearAuthData().catch(console.error);

              setTimeout(() => {
                location.href = "/dang-nhap";
              }, 2000); // Delay 2 giây để người dùng kịp đọc thông báo lỗi
            } else {
              // Cho các lỗi UnauthorizedAccess khác
              removeTokensFromLocalStorage();
            }
          }
          throw new HttpError(data);
        }

        // Token hết hạn - thử refresh token nếu chưa retry và ở client side
        if (
          isClient &&
          retryCount < MAX_RETRIES &&
          url !== "api/auth/refresh-token"
        ) {
          try {
            // Thực hiện refresh token
            await authAgent.refreshTokens();

            // Thử lại request ban đầu với token mới
            return request<Response>(method, url, options, retryCount + 1);
          } catch (refreshError) {
            // Nếu refresh thất bại, đăng xuất người dùng
            await authAgent.handleLogout();
            throw new HttpError({
              status: AUTHENTICATION_ERROR_STATUS,
              payload: {
                message: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
              },
            });
          }
        } else if (isClient) {
          // Nếu đã retry hoặc là request refresh token bị lỗi, thực hiện đăng xuất
          await authAgent.handleLogout();
        } else {
          // Server-side handling
          const accessToken = (options?.headers as any)?.Authorization?.split(
            "Bearer "
          )[1];
          redirect(`/dang-xuat?accessToken=${accessToken || ""}`);
        }
      }

      // Các lỗi khác
      throw new HttpError(data);
    }

    // Xử lý sau khi request thành công
    if (isClient) {
      const normalizeUrl = normalizePath(url);
      if (["api/auth/login"].includes(normalizeUrl)) {
        const { accessToken, refreshToken } = (payload as LoginResType).tokens;
        setAccessTokenToLocalStorage(accessToken);
        setRefreshTokenToLocalStorage(refreshToken);
      } else if (["api/auth/refresh-token"].includes(normalizeUrl)) {
        // Xử lý sau khi refresh token thành công
        const { accessToken, refreshToken } = payload as RefreshTokenResType;
        setAccessTokenToLocalStorage(accessToken);
        setRefreshTokenToLocalStorage(refreshToken);
      } else if (["api/auth/logout"].includes(normalizeUrl)) {
        removeTokensFromLocalStorage();
      }
    }

    return data;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    // Re-throw các lỗi khác
    throw new HttpError({
      status: 500,
      payload: {
        message: error instanceof Error ? error.message : "Đã xảy ra lỗi",
      },
    });
  }
};

const http = {
  get<Response>(
    url: string,
    options?: Omit<CustomOptions, "body"> | undefined
  ) {
    return request<Response>("GET", url, options);
  },
  post<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) {
    return request<Response>("POST", url, { ...options, body });
  },
  put<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) {
    return request<Response>("PUT", url, { ...options, body });
  },
  delete<Response>(
    url: string,
    options?: Omit<CustomOptions, "body"> | undefined
  ) {
    return request<Response>("DELETE", url, { ...options });
  },
  patch<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) {
    return request<Response>("PATCH", url, { ...options, body });
  },
  // Expose auth agent for manual operations
  authAgent,
};

export default http;
