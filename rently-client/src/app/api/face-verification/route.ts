import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Lấy API key từ environment variables
    const apiKey = process.env.FPT_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "FPT.AI API key not configured" },
        { status: 500 }
      );
    }

    // Gọi API FPT.AI
    const response = await fetch("https://api.fpt.ai/dmp/checkface/v1", {
      method: "POST",
      headers: {
        api_key: apiKey,
      },
      body: formData,
    });

    const result = await response.json();

    // Trả về kết quả
    return NextResponse.json(result);
  } catch (error) {
    console.error("Face verification error:", error);
    return NextResponse.json(
      {
        code: "500",
        message: "Có lỗi xảy ra khi xác thực khuôn mặt",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
