import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { template, type } = await req.json();

    // Nếu là HTML thuần, trả về ngay
    if (
      type === "string" &&
      !template.includes("import") &&
      !template.includes("export default")
    ) {
      return NextResponse.json({
        html: template,
        text: "Không thể tạo bản xem trước văn bản thuần từ HTML trực tiếp",
      });
    }

    // Nếu là React component, sử dụng fallback
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Email Preview</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
            .preview-box { border: 1px solid #eaeaea; padding: 20px; border-radius: 5px; background: white; }
            .preview-header { background: #f9f9f9; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
            .title { color: #555; margin-top: 0; }
            .note { color: #666; font-size: 0.9em; }
            .tag { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; }
          </style>
        </head>
        <body>
          <div class="preview-header">
            <h2 class="title">Bản xem trước email <span class="tag">React Component</span></h2>
          </div>
          <div class="preview-box">
            <p>Email này sử dụng React Component và sẽ được render khi gửi bằng Resend API.</p>
            <p>Bản xem trước đơn giản được hiển thị thay cho email thực tế.</p>
            
            <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 15px;">
              <p class="note">Thông tin mã nguồn:</p>
              <code style="font-size: 0.8em; color: #666; display: block; white-space: pre-wrap; background: #f5f5f5; padding: 10px; border-radius: 4px; max-height: 200px; overflow: auto;">
${template.substring(0, 500)}${template.length > 500 ? "..." : ""}
              </code>
            </div>
          </div>
        </body>
      </html>
    `;

    // Tạo text preview đơn giản
    const text = `
Email Preview (React Component)
------------------------------
Email này sử dụng React Component và sẽ được render khi gửi bằng Resend API.
Bản xem trước đơn giản được hiển thị thay cho email thực tế.
`;

    return NextResponse.json({ html, text });
  } catch (error) {
    console.error("Lỗi khi tạo bản xem trước email:", error);
    return NextResponse.json(
      { error: "Không thể tạo bản xem trước email" },
      { status: 500 }
    );
  }
}
