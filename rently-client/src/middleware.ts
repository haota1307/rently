import { NextRequest, NextResponse } from "next/server";
import { decodeAccessToken } from "@/lib/utils";
import { match } from "path-to-regexp";

const privatePaths = ["/phong-tro"];
const unAuthPaths = ["/dang-nhap", "/dang-ky"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (privatePaths.some((path) => pathname.startsWith(path)) && !refreshToken) {
    const url = new URL("/dang-nhap", request.url);
    url.searchParams.set("clearTokens", "true");

    return NextResponse.redirect(url);
  }

  if (refreshToken) {
    // 2.1 Đăng nhập rồi mà vẫn vào trang dang-nhap -> redirect sang trang chủ
    if (unAuthPaths.some((path) => pathname.startsWith(path)) && refreshToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // 2.2 Trường hợp access token hết hạn ở cookie (cookie tự xóa)
    if (
      privatePaths.some((path) => pathname.startsWith(path)) &&
      !accessToken
    ) {
      const url = new URL("/refresh-token", request.url);
      url.searchParams.set("refreshToken", refreshToken);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // 2.3 vào không đúng role -> redirect vè trang chủ
    // TODO: chưa test
    const decoded = decodeAccessToken(refreshToken);
    const role = decoded?.roleName;

    // const res = await fetch(
    //   `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/permissions?role=${role}`
    // );

    // if (!res.ok) {
    //   return NextResponse.redirect(new URL("/", request.url));
    // }

    // const permissions: { path: string; method: string }[] = await res.json();
    // const reqMethod = request.method;
    // const hasPermission = permissions.some((perm) => {
    //   const matcher = match(perm.path, { decode: decodeURIComponent });
    //   return perm.method === reqMethod && matcher(pathname) !== false;
    // });

    // if (!hasPermission) {
    //   return NextResponse.redirect(new URL("/", request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/phong-tro/:path*", "/dang-nhap", "/dang-ky"],
};
