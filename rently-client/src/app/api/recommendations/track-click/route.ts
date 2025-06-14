import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();

    // Get authentication token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Cần đăng nhập để ghi nhận tương tác",
        },
        { status: 401 }
      );
    }

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    // Make request to backend
    const response = await fetch(`${BACKEND_URL}/recommendations/track-click`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);

      return NextResponse.json(
        {
          success: false,
          message: "Không thể ghi nhận tương tác",
          error: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Track click API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Lỗi hệ thống khi ghi nhận tương tác",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
