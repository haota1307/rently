import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build backend URL with query parameters
    const backendUrl = new URL("/recommendations", BACKEND_URL);

    // Forward all query parameters
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    // Get authentication token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add auth header if token exists
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // Make request to backend
    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers,
      // Add cache control for recommendations
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);

      return NextResponse.json(
        {
          success: false,
          message: "Không thể lấy danh sách gợi ý",
          error: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Recommendation API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Lỗi hệ thống khi lấy gợi ý",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
