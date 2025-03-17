import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { jwtDecode } from "jwt-decode";
import { AccessTokenPayload, RefreshTokenPayload } from "@/types/jwt.types";
import { toast } from "sonner";
import { UseFormSetError } from "react-hook-form";
import authApiRequest from "@/features/auth/auth.api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const decodeAccessToken = (token: string) => {
  return jwtDecode(token) as AccessTokenPayload;
};

export const decodeRefreshToken = (token: string) => {
  return jwtDecode(token) as RefreshTokenPayload;
};

/**
 * Xóa đi ký tự `/` đầu tiên của path
 */
export const normalizePath = (path: string) => {
  return path.startsWith("/") ? path.slice(1) : path;
};

const errorMessageMap: Record<string, string> = {
  "Error.InvalidPassword": "Mật khẩu không hợp lệ. Vui lòng thử lại.",
  "Error.EmailNotFound": "Email không tồn tại trong hệ thống.",
  "Error.EmailAlreadyExists": "Email đã tồn tại trong hệ thống.",
};

export const handleErrorApi = ({
  error,
  setError,
}: {
  error: any;
  setError?: UseFormSetError<any>;
}) => {
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

export const getAccessTokenFromLocalStorage = () =>
  isBrowser ? localStorage.getItem("accessToken") : null;

export const getRefreshTokenFromLocalStorage = () =>
  isBrowser ? localStorage.getItem("refreshToken") : null;

export const setAccessTokenToLocalStorage = (value: string) =>
  isBrowser && localStorage.setItem("accessToken", value);

export const setRefreshTokenToLocalStorage = (value: string) =>
  isBrowser && localStorage.setItem("refreshToken", value);

export const removeTokensFromLocalStorage = () => {
  isBrowser && localStorage.removeItem("accessToken");
  isBrowser && localStorage.removeItem("refreshToken");
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
      setAccessTokenToLocalStorage(res.payload.accessToken);
      setRefreshTokenToLocalStorage(res.payload.refreshToken);
      param?.onSuccess && param.onSuccess();
    } catch (error) {
      param?.onError && param.onError();
    }
  }
};
