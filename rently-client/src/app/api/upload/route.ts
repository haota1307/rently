import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Khai báo kiểu dữ liệu cho kết quả upload
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Không tìm thấy file" },
        { status: 400 }
      );
    }

    // Chuyển đổi File thành buffer để tải lên Cloudinary
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Tải lên bằng phương thức bufferUpload thay vì stream
    return new Promise<NextResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "rently-system-settings",
            resource_type: "auto",
          },
          (error: unknown, result: CloudinaryUploadResult | undefined) => {
            if (error || !result) {
              console.error("Lỗi tải lên Cloudinary:", error);
              resolve(
                NextResponse.json(
                  { error: "Không thể tải lên hình ảnh" },
                  { status: 500 }
                )
              );
              return;
            }

            // Trả về URL của file đã tải lên
            resolve(
              NextResponse.json({
                url: result.secure_url,
                public_id: result.public_id,
              })
            );
          }
        )
        .end(buffer);
    });
  } catch (error) {
    console.error("Lỗi khi xử lý tải lên:", error);
    return NextResponse.json(
      { error: "Không thể tải lên hình ảnh" },
      { status: 500 }
    );
  }
}
