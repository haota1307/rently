"use client";

import { useState } from "react";
import { SystemSetting } from "@/features/system-setting/system-setting.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  EyeIcon,
  Code,
  FileText,
  Copy,
  CheckCircle,
  Calendar,
  Tag,
  ExternalLink,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  SYSTEM_SETTING_GROUP_COLORS,
  SYSTEM_SETTING_GROUP_LABELS,
  SYSTEM_SETTING_TYPE_LABELS,
} from "./system-setting-constants";

type SystemSettingValueDisplayProps = {
  setting: SystemSetting;
};

export function SystemSettingValueDisplay({
  setting,
}: SystemSettingValueDisplayProps) {
  const [activeTab, setActiveTab] = useState<string>("value");
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const groupLabel = (groupName: string) => {
    return (
      SYSTEM_SETTING_GROUP_LABELS[
        groupName as keyof typeof SYSTEM_SETTING_GROUP_LABELS
      ] || groupName
    );
  };

  const typeLabel = (typeName: string) => {
    return (
      SYSTEM_SETTING_TYPE_LABELS[
        typeName as keyof typeof SYSTEM_SETTING_TYPE_LABELS
      ] || typeName
    );
  };

  const formatJsonValue = (value: string, type: string): string => {
    if (type === "json") {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  const handleCopyValue = () => {
    navigator.clipboard.writeText(setting.value);
    setCopied(true);
    toast.success("Đã sao chép giá trị vào clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = () => {
    if (setting.value.startsWith("http")) {
      window.open(setting.value, "_blank");
    }
  };

  const handleGeneratePreview = () => {
    if (setting.group !== "email") return;

    setPreviewLoading(true);

    try {
      // Nếu là HTML thuần, hiển thị trực tiếp
      if (
        !setting.value.includes("import") &&
        !setting.value.includes("export default")
      ) {
        setPreviewHtml(setting.value);
        setPreviewText(
          "Nội dung HTML không thể chuyển đổi thành văn bản thuần một cách tự động"
        );
      } else {
        // Trích xuất jsx component từ React component
        const jsxContent = extractEmailJSX(setting.value);
        const previewHtml = generateReactPreviewContainer(
          jsxContent || "Không thể phân tích cú pháp JSX"
        );
        const previewText = generatePreviewText();
        setPreviewHtml(previewHtml);
        setPreviewText(previewText);
      }

      // Chuyển sang tab preview
      setActiveTab("preview");
    } catch (error) {
      console.error("Lỗi khi tạo bản xem trước:", error);
      // Fallback nếu có lỗi
      setPreviewHtml(
        `<div style="color: red; padding: 20px;">Không thể tạo bản xem trước. Error: ${error instanceof Error ? error.message : "Unknown error"}</div>`
      );
      setPreviewText("Không thể tạo bản xem trước");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Trích xuất JSX từ React component
  const extractEmailJSX = (template: string) => {
    try {
      // Tìm phần return JSX chính trong mã nguồn
      const returnRegex = /return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*}/;
      const returnMatch = template.match(returnRegex);

      if (returnMatch && returnMatch[1]) {
        return returnMatch[1].trim();
      }

      // Nếu không tìm thấy return thông thường, thử tìm functional component arrow syntax
      const arrowReturnRegex = /=>\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*(?:}|$)/;
      const arrowMatch = template.match(arrowReturnRegex);

      if (arrowMatch && arrowMatch[1]) {
        return arrowMatch[1].trim();
      }

      return null;
    } catch (error) {
      console.error("Lỗi khi phân tích cú pháp JSX:", error);
      return null;
    }
  };

  // Tạo container HTML để hiển thị nội dung React
  const generateReactPreviewContainer = (jsxContent: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Email Preview</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; background-color: #f9f9f9; }
            .container { max-width: 750px; margin: 0 auto; padding: 20px; }
            .preview-box { border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .preview-header { background: #f5f7f9; padding: 10px 15px; margin-bottom: 15px; border-radius: 5px; border-left: 4px solid #0284c7; }
            .title { color: #0f172a; margin-top: 0; font-size: 16px; }
            .tag { display: inline-block; background: #dbeafe; color: #2563eb; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 500; }
            .jsx-content { border-top: 1px solid #e5e7eb; margin-top: 15px; padding-top: 15px; }
            .jsx-content pre { background: #f8fafc; padding: 10px; border-radius: 4px; font-size: 13px; overflow: auto; color: #334155; }
            .component-preview { padding: 15px; border: 1px dashed #e5e7eb; background: #ffffff; border-radius: 4px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="preview-header">
              <h2 class="title">Email Preview <span class="tag">React JSX</span></h2>
            </div>
            <div class="preview-box">
              <div class="component-preview">
                <div style="color: #475569; font-style: italic; margin-bottom: 10px; font-size: 14px;">
                  Nội dung email sẽ được hiển thị khi gửi thực tế:
                </div>
                <div>${formatJSXPreview(jsxContent)}</div>
              </div>
              
              <div class="jsx-content">
                <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">Mã nguồn JSX:</div>
                <pre>${escapeHtml(jsxContent)}</pre>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Format JSX thành dạng hiển thị HTML đơn giản
  const formatJSXPreview = (jsx: string) => {
    // Thay thế các component React Email bằng HTML tương ứng
    return jsx
      .replace(/<Html[^>]*>([\s\S]*?)<\/Html>/g, "$1")
      .replace(/<Head[^>]*>[\s\S]*?<\/Head>/g, "")
      .replace(/<Preview[^>]*>[\s\S]*?<\/Preview>/g, "")
      .replace(
        /<Body[^>]*>([\s\S]*?)<\/Body>/g,
        '<div style="font-family: sans-serif;">$1</div>'
      )
      .replace(
        /<Container[^>]*>([\s\S]*?)<\/Container>/g,
        '<div style="max-width: 600px; margin: 0 auto;">$1</div>'
      )
      .replace(
        /<Section[^>]*>([\s\S]*?)<\/Section>/g,
        '<div style="margin: 10px 0;">$1</div>'
      )
      .replace(
        /<Row[^>]*>([\s\S]*?)<\/Row>/g,
        '<div style="display: flex;">$1</div>'
      )
      .replace(
        /<Column[^>]*>([\s\S]*?)<\/Column>/g,
        '<div style="flex: 1;">$1</div>'
      )
      .replace(
        /<Heading[^>]*>([\s\S]*?)<\/Heading>/g,
        '<h2 style="font-size: 18px; font-weight: bold;">$1</h2>'
      )
      .replace(
        /<Text[^>]*>([\s\S]*?)<\/Text>/g,
        '<p style="font-size: 14px; line-height: 1.5;">$1</p>'
      )
      .replace(
        /<Button[^>]*>([\s\S]*?)<\/Button>/g,
        '<button style="background: #0070f3; color: white; padding: 8px 16px; border-radius: 4px; border: none;">$1</button>'
      );
  };

  // Escape HTML để hiển thị an toàn
  const escapeHtml = (html: string) => {
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const generatePreviewText = () => {
    return `
Email Preview (React Component)
------------------------------
Email này sử dụng React Component và sẽ được render khi gửi. Nội dung này chỉ là bản đơn giản.

Một số thông tin sẽ được hiển thị trong email thực tế như:
- Tên người gửi, người nhận
- Nội dung email
- Thông tin khác
`;
  };

  // Hiển thị giá trị phụ thuộc vào loại
  const renderValue = () => {
    const value = formatJsonValue(setting.value, setting.type);

    switch (setting.type) {
      case "json":
        return (
          <ScrollArea className="h-[250px] w-full rounded-md border p-4 bg-muted/30">
            <pre className="text-sm font-mono">{value}</pre>
          </ScrollArea>
        );

      case "file":
        if (setting.value.match(/\.(jpeg|jpg|gif|png|svg|ico|webp)$/i)) {
          return (
            <div className="mt-2 flex flex-col items-center gap-2">
              <div className="border rounded-md p-2 bg-muted/30 max-w-full">
                <img
                  src={setting.value}
                  alt={setting.key}
                  className="max-h-[180px] object-contain"
                  onError={(e) => {
                    // Fallback khi ảnh không tải được
                    e.currentTarget.src =
                      "https://placehold.co/300x200?text=Image+Not+Found";
                  }}
                />
              </div>
              {setting.value.startsWith("http") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenLink}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Mở liên kết
                </Button>
              )}
            </div>
          );
        } else {
          return (
            <div className="mt-2 p-3 border rounded-md bg-muted/30">
              <p className="text-sm truncate">{setting.value}</p>
            </div>
          );
        }

      case "string":
        if (setting.group === "email") {
          // Hiển thị mẫu email dưới dạng HTML với chiều cao giới hạn
          return (
            <div className="mt-2">
              <ScrollArea className="max-h-[300px] rounded-md">
                <div
                  className="p-3 border rounded-md bg-white"
                  dangerouslySetInnerHTML={{ __html: setting.value }}
                />
              </ScrollArea>
            </div>
          );
        } else if (setting.value.startsWith("http")) {
          // Hiển thị URL với nút mở liên kết
          return (
            <div className="mt-2 space-y-2">
              <ScrollArea className="h-[100px] w-full rounded-md border p-3 bg-muted/30">
                <p className="text-sm break-all">{value}</p>
              </ScrollArea>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenLink}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Mở liên kết
              </Button>
            </div>
          );
        } else {
          return (
            <ScrollArea className="h-[150px] w-full rounded-md border p-3 bg-muted/30">
              <p className="text-sm whitespace-pre-wrap">{value}</p>
            </ScrollArea>
          );
        }

      case "boolean":
        return (
          <div className="mt-2 p-3 border rounded-md bg-muted/30">
            <Badge variant={value === "true" ? "success" : "destructive"}>
              {value === "true" ? "True" : "False"}
            </Badge>
          </div>
        );

      case "number":
        return (
          <div className="mt-2 p-3 border rounded-md bg-muted/30 font-mono">
            <p className="text-sm">{Number(value).toLocaleString("vi-VN")}</p>
          </div>
        );

      default:
        return (
          <p className="text-sm my-2 p-2 bg-muted/30 rounded-md">{value}</p>
        );
    }
  };

  const renderPreviewHtml = () => {
    if (!previewHtml)
      return (
        <p className="text-center text-muted-foreground py-4">
          Chưa có bản xem trước HTML
        </p>
      );

    return (
      <ScrollArea className="max-h-[400px] w-full rounded-md border">
        <iframe
          srcDoc={previewHtml}
          title="Email Preview"
          className="w-full min-h-[400px] border-0"
          sandbox="allow-same-origin"
        />
      </ScrollArea>
    );
  };

  const renderPreviewText = () => {
    if (!previewText)
      return (
        <p className="text-center text-muted-foreground py-4">
          Chưa có bản xem trước văn bản thuần
        </p>
      );

    return (
      <ScrollArea className="max-h-[400px] w-full rounded-md border p-4 bg-muted/30">
        <pre className="text-sm whitespace-pre-wrap">{previewText}</pre>
      </ScrollArea>
    );
  };

  const getGroupBadgeColor = (groupName: string) => {
    return (
      SYSTEM_SETTING_GROUP_COLORS[
        groupName as keyof typeof SYSTEM_SETTING_GROUP_COLORS
      ] || SYSTEM_SETTING_GROUP_COLORS.default
    );
  };

  const getTypeIcon = (typeName: string) => {
    switch (typeName) {
      case "string":
        return <Tag className="h-4 w-4" />;
      case "number":
        return <Tag className="h-4 w-4" />;
      case "boolean":
        return <CheckCircle className="h-4 w-4" />;
      case "json":
        return <Code className="h-4 w-4" />;
      case "file":
        return <FileText className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "PPpp", { locale: vi });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="font-medium">{setting.key}</span>
              <Badge
                variant="outline"
                className="flex items-center gap-1 font-normal"
              >
                {getTypeIcon(setting.type)}
                <span>{typeLabel(setting.type)}</span>
              </Badge>
            </CardTitle>
            <Badge
              className={`font-normal ${getGroupBadgeColor(setting.group)}`}
            >
              {groupLabel(setting.group)}
            </Badge>
          </div>

          {setting.description && (
            <div className="bg-blue-50 text-blue-800 p-2 rounded-md flex items-start gap-2 text-sm">
              <Info className="h-4 w-4 mt-0.5" />
              <span>{setting.description}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 py-0">
        <div className="flex justify-between items-center">
          {setting.group === "email" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={handleGeneratePreview}
              disabled={previewLoading}
            >
              <EyeIcon className="h-4 w-4" />
              {previewLoading ? "Đang tạo bản xem trước..." : "Xem trước Email"}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="gap-1 ml-auto"
            onClick={handleCopyValue}
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Sao chép giá trị</span>
              </>
            )}
          </Button>
        </div>

        {setting.group === "email" && (previewHtml || previewText) ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-2">
              <TabsTrigger value="value">
                <Code className="h-4 w-4 mr-1" />
                Mã nguồn
              </TabsTrigger>
              <TabsTrigger value="preview">
                <EyeIcon className="h-4 w-4 mr-1" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="text">
                <FileText className="h-4 w-4 mr-1" />
                Văn bản thuần
              </TabsTrigger>
            </TabsList>

            <TabsContent value="value" className="space-y-1">
              <p className="text-sm font-medium">Giá trị:</p>
              <div>{renderValue()}</div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-1">
              <p className="text-sm font-medium">Bản xem trước HTML:</p>
              {renderPreviewHtml()}
            </TabsContent>

            <TabsContent value="text" className="space-y-1">
              <p className="text-sm font-medium">
                Bản xem trước văn bản thuần:
              </p>
              {renderPreviewText()}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium">Giá trị:</p>
            <div>{renderValue()}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Tạo: {formatDate(setting.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Cập nhật: {formatDate(setting.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
