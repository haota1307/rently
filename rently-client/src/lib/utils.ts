import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { jwtDecode } from "jwt-decode";
import { AccessTokenPayload, RefreshTokenPayload } from "@/types/jwt.types";
import { toast } from "sonner";
import { UseFormSetError } from "react-hook-form";
import authApiRequest from "@/features/auth/auth.api";
import { io, Socket } from "socket.io-client";
import { formatDistance, format } from "date-fns";
import { vi } from "date-fns/locale";
import { Role, RoleType } from "@/constants/type";
import {
  decodeAccessToken,
  decodeRefreshToken,
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  setAccessTokenToLocalStorage,
  setRefreshTokenToLocalStorage,
  removeTokensFromLocalStorage,
  clearAuthData,
} from "./auth-utils";

export {
  decodeAccessToken,
  decodeRefreshToken,
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  setAccessTokenToLocalStorage,
  setRefreshTokenToLocalStorage,
  removeTokensFromLocalStorage,
  clearAuthData,
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Xóa đi ký tự `/` đầu tiên của path
 */
export const normalizePath = (path: string) => {
  return path.startsWith("/") ? path.slice(1) : path;
};

/**
 * Format date to a readable string
 * @param date - Date to format
 * @param formatString - Optional format string (default: 'dd/MM/yyyy HH:mm')
 * @returns Formatted date string in Vietnamese locale
 */
export const formatDate = (
  date: Date,
  formatString: string = "dd/MM/yyyy HH:mm"
) => {
  return format(date, formatString, { locale: vi });
};

const errorMessageMap: Record<string, string> = {
  "Error.InvalidPassword": "Mật khẩu không hợp lệ. Vui lòng thử lại.",
  "Error.EmailNotFound": "Email không tồn tại trong hệ thống.",
  "Error.EmailAlreadyExists": "Email đã tồn tại trong hệ thống.",
  "Error.UserBlocked":
    "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
  "Error.InvalidCode": "Mã OTP không hợp lệ hoặc đã hết hạn.",
  "Error.CodeExpired": "Mã OTP đã hết hạn.",
};

export const handleErrorApi = ({
  error,
  setError,
}: {
  error: any;
  setError?: UseFormSetError<any>;
}) => {
  // Xử lý lỗi 401 đặc biệt từ API
  if (
    error?.status === 401 &&
    error?.payload?.message === "Error.UserBlocked"
  ) {
    toast.error(errorMessageMap["Error.UserBlocked"]);

    // Buộc đăng xuất khi tài khoản bị khóa (xóa cả localStorage và cookies)
    clearAuthData().catch(console.error);

    // Chuyển hướng về trang đăng nhập sau 2 giây để người dùng kịp đọc thông báo lỗi
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = "/dang-nhap";
      }
    }, 2000);

    return;
  }

  // Nếu error có dạng EntityError với payload và có setError
  if (error?.payload && setError) {
    const payload = error.payload;
    // Kiểm tra xem payload.message có phải là mảng lỗi không
    if (Array.isArray(payload.message)) {
      payload.message.forEach((item: { message: string; path: string }) => {
        // Lấy nội dung lỗi từ errorMessageMap, nếu không có thì hiển thị message gốc
        const displayMessage = errorMessageMap[item.message] ?? item.message;
        // Gán lỗi cho react-hook-form
        setError(item.path, {
          type: "server",
          message: displayMessage,
        });
      });
      return;
    }
  }
  // Nếu không khớp với cấu trúc trên, hiển thị thông báo lỗi chung
  toast.error("Có lỗi xảy ra!");
};

const isBrowser = typeof window !== "undefined";

export function formatDistanceToNowVi(date: Date) {
  return formatDistance(date, new Date(), {
    addSuffix: true,
    locale: vi,
  });
}

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const checkAndRefreshToken = async (param?: {
  onError?: () => void;
  onSuccess?: () => void;
  force?: boolean;
}) => {
  // Không nên đưa logic lấy access và refresh token ra khỏi cái function `checkAndRefreshToken`
  // Vì để mỗi lần mà checkAndRefreshToken() được gọi thì chúng ta se có một access và refresh token mới
  // Tránh hiện tượng bug nó lấy access và refresh token cũ ở lần đầu rồi gọi cho các lần tiếp theo
  const accessToken = getAccessTokenFromLocalStorage();
  const refreshToken = getRefreshTokenFromLocalStorage();
  // Chưa đăng nhập thì cũng không cho chạy
  if (!accessToken || !refreshToken) return;
  const decodedAccessToken = decodeAccessToken(accessToken);
  const decodedRefreshToken = decodeRefreshToken(refreshToken);
  // Thời điểm hết hạn của token là tính theo epoch time (s)
  // Còn khi các bạn dùng cú pháp new Date().getTime() thì nó sẽ trả về epoch time (ms)
  const now = Math.round(new Date().getTime() / 1000);
  // trường hợp refresh token hết hạn thì cho logout
  if (decodedRefreshToken.exp <= now) {
    removeTokensFromLocalStorage();
    return param?.onError && param.onError();
  }
  // Ví dụ access token của chúng ta có thời gian hết hạn là 10s
  // thì mình sẽ kiểm tra còn 1/3 thời gian (3s) thì mình sẽ cho refresh token lại
  // Thời gian còn lại sẽ tính dựa trên công thức: decodedAccessToken.exp - now
  // Thời gian hết hạn của access token dựa trên công thức: decodedAccessToken.exp - decodedAccessToken.iat
  if (
    param?.force ||
    decodedAccessToken.exp - now <
      (decodedAccessToken.exp - decodedAccessToken.iat) / 3
  ) {
    // Gọi API refresh token
    try {
      const res = await authApiRequest.refreshToken();

      if (res.payload.accessToken && res.payload.refreshToken) {
        setAccessTokenToLocalStorage(res.payload.accessToken);
        setRefreshTokenToLocalStorage(res.payload.refreshToken);
      }
      param?.onSuccess && param.onSuccess();
    } catch (error) {
      param?.onError && param.onError();
    }
  }
};

export const preprocessDecimal = (arg: unknown) =>
  typeof arg === "object" && arg !== null && "toNumber" in arg
    ? (arg as any).toNumber()
    : arg;

export function generateSocketInstance(accessToken: string): Socket | null {
  // Kiểm tra nếu đang chạy trên server, return null
  if (typeof window === "undefined") return null;

  try {
    const socket = io(process.env.NEXT_PUBLIC_API_ENDPOINT || "", {
      auth: {
        token: accessToken,
      },
    });

    return socket;
  } catch (error) {
    console.error("Không thể tạo kết nối socket:", error);
    return null;
  }
}

/**
 * Lấy chữ cái đầu tiên của mỗi từ trong tên để tạo initials
 * Ví dụ: "Nguyen Van A" -> "NVA"
 */
export function getInitials(name: string): string {
  if (!name) return "";

  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
