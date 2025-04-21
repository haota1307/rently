import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import authApiRequest from "@/features/auth/auth.api";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return Response.json(
      { message: "Không tìm thấy refreshToken" },
      { status: 401 }
    );
  }
  try {
    const { payload } = await authApiRequest.sRefreshToken({ refreshToken });

    const decodedAccessToken = jwt.decode(payload.accessToken) as {
      exp: number;
    };
    const decodedRefreshToken = jwt.decode(payload.refreshToken) as {
      exp: number;
    };

    // Cập nhật cookie
    cookieStore.set("accessToken", payload.accessToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      expires: decodedAccessToken.exp * 1000,
    });
    cookieStore.set("refreshToken", payload.refreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      expires: decodedRefreshToken.exp * 1000,
    });

    // Trả về accessToken và refreshToken để cho phép client cập nhật vào localStorage
    return Response.json({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
  } catch (error: any) {
    console.error("Lỗi refresh token:", error);
    return Response.json(
      { message: error.message ?? "Có lỗi xảy ra khi refresh token" },
      { status: 401 }
    );
  }
}
