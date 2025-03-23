import { NextRequest, NextResponse } from "next/server";
import { decodeAccessToken } from "@/lib/utils";

const adminPaths = ["/quan-ly"];
const landlordPaths = ["/cho-thue"];

const privatePaths = [...adminPaths, ...landlordPaths];

const unAuthPaths = [
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

  // Nếu truy cập vào các route private mà không có refresh token -> redirect về đăng nhập
  if (privatePaths.some((path) => pathname.startsWith(path)) && !refreshToken) {
    const url = new URL("/dang-nhap", request.url);
    url.searchParams.set("clearTokens", "true");
    return NextResponse.redirect(url);
  }

  if (refreshToken) {
    // Nếu đã đăng nhập mà truy cập các trang auth -> redirect về trang chủ
    if (unAuthPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Nếu truy cập vào các route private mà access token không còn -> chuyển sang trang refresh-token
    if (
      privatePaths.some((path) => pathname.startsWith(path)) &&
      !accessToken
    ) {
      const url = new URL("/refresh-token", request.url);
      url.searchParams.set("refreshToken", refreshToken);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Kiểm tra role của người dùng để đảm bảo họ truy cập đúng phần dành riêng
    const decoded = decodeAccessToken(refreshToken);
    const role = decoded?.roleName;

    // Nếu truy cập admin route mà role không phải admin -> redirect về trang chủ
    if (
      adminPaths.some((path) => pathname.startsWith(path)) &&
      role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Nếu truy cập landlord route mà role không phải landlord -> redirect về trang chủ
    if (
      landlordPaths.some((path) => pathname.startsWith(path)) &&
      role !== "landlord"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/phong-tro/:path*",
    "/cho-thue/:path*",
    "/dang-nhap",
    "/dang-ky",
    "/refresh-token",
    "/oauth-google-callback",
    "/quen-mat-khau",
  ],
};
