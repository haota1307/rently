import { NextRequest, NextResponse } from "next/server";
import { decodeAccessToken } from "@/lib/auth-utils";
import { Role } from "@/constants/type";

// Định nghĩa các tuyến đường dành riêng cho vai trò cụ thể
const adminPaths = ["/quan-ly"];
const landlordPaths = ["/cho-thue"];

// Tất cả các tuyến đường bảo vệ cần xác thực
const privatePaths = [...adminPaths, ...landlordPaths];

// Các tuyến đường công khai không cần xác thực
const publicPaths = [
  "/dang-nhap",
  "/dang-ky",
  "/refresh-token",
  "/quen-mat-khau",
  "/oauth-google-callback",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // Nếu là các tuyến đường công khai, cho phép truy cập
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    // Nếu đã đăng nhập mà truy cập các trang auth -> redirect về trang chủ
    if (refreshToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Nếu truy cập vào các tuyến đường bảo vệ mà không có refresh token -> redirect về đăng nhập
  if (privatePaths.some((path) => pathname.startsWith(path)) && !refreshToken) {
    const url = new URL("/dang-nhap", request.url);
    url.searchParams.set("clearTokens", "true");
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Nếu có refresh token nhưng không có access token, chuyển sang trang refresh-token
  if (
    privatePaths.some((path) => pathname.startsWith(path)) &&
    refreshToken &&
    !accessToken
  ) {
    const url = new URL("/refresh-token", request.url);
    url.searchParams.set("refreshToken", refreshToken);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Kiểm tra role của người dùng nếu có access token
  if (accessToken) {
    try {
      const decoded = decodeAccessToken(accessToken);
      const userRole = decoded?.roleName?.toUpperCase();

      // Kiểm tra quyền truy cập vào trang admin
      if (adminPaths.some((path) => pathname.startsWith(path))) {
        if (userRole !== Role.Admin) {
          // Nếu không phải Admin mà truy cập trang Admin -> chuyển về trang chủ
          return NextResponse.redirect(new URL("/", request.url));
        }
        return NextResponse.next();
      }

      // Kiểm tra quyền truy cập vào trang landlord
      if (landlordPaths.some((path) => pathname.startsWith(path))) {
        // Admin cũng có thể truy cập trang của Landlord
        if (userRole !== Role.Landlord && userRole !== Role.Admin) {
          // Nếu không phải Landlord hoặc Admin mà truy cập trang Landlord -> chuyển về trang chủ
          return NextResponse.redirect(new URL("/", request.url));
        }
        return NextResponse.next();
      }
    } catch (error) {
      // Nếu token không hợp lệ, xóa cookie và chuyển về trang đăng nhập
      const url = new URL("/dang-nhap", request.url);
      url.searchParams.set("clearTokens", "true");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Định nghĩa các tuyến đường sẽ chạy middleware này
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|opengraph-image|robots.txt|sitemap.xml|.*\\.png$).*)",
  ],
};
