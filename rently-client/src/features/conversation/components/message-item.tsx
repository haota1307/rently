"use client";

import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { File, FileText, Music, Pencil, Trash2 } from "lucide-react";
import { Message, MessageType } from "../message.types";
import { formatFileSize } from "./message-image-preview";
import { memo } from "react";

interface MessageItemProps {
  msg: Message;
  userId: number;
  setEditingMessageId: (id: number | null) => void;
  setEditMessageContent: (content: string) => void;
  confirmDelete: (id: number) => void;
  onOpenProfile?: (id: number) => void;
  handleEditMessage?: (messageId: number, content: string) => Promise<void>;
  editingMessageId?: number | null;
  editMessageContent?: string;
}

export const MessageItem = memo(
  ({
    msg,
    userId,
    setEditingMessageId,
    setEditMessageContent,
    confirmDelete,
    onOpenProfile,
    handleEditMessage,
    editingMessageId,
    editMessageContent = "",
  }: MessageItemProps) => {
    // Kiểm tra và chuẩn hóa ngày tạo
    const normalizeDate = (dateStr: string | null | undefined): Date | null => {
      if (!dateStr) return null;

      try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      } catch (error) {
        console.error("Lỗi khi chuyển đổi ngày:", error);
        return null;
      }
    };

    // Xử lý hiển thị thời gian
    const formatMessageTime = (dateStr: string | null | undefined) => {
      try {
        const date = normalizeDate(dateStr);
        // Nếu không có ngày hợp lệ, hiển thị thời gian hiện tại
        if (!date) {
          return format(new Date(), "H:mm", { locale: vi });
        }

        return format(date, "H:mm", { locale: vi });
      } catch (error) {
        console.error("Lỗi khi định dạng thời gian tin nhắn:", error);
        return format(new Date(), "H:mm", { locale: vi });
      }
    };

    const formatFullTime = (date: Date | null) => {
      try {
        if (!date) {
          // Sử dụng ngày hiện tại thay vì "Thời gian không xác định"
          return `Hôm nay, lúc ${format(new Date(), "h:mm:ss a", { locale: vi })}`;
        }

        return `${
          isToday(date)
            ? "Hôm nay, "
            : isYesterday(date)
              ? "Hôm qua, "
              : format(date, "d MMM, yyyy", { locale: vi })
        } lúc ${format(date, "h:mm:ss a", { locale: vi })}`;
      } catch (error) {
        console.error("Lỗi khi định dạng thời gian đầy đủ:", error);
        return `Hôm nay, lúc ${format(new Date(), "h:mm:ss a", { locale: vi })}`;
      }
    };

    // Hàm chuyển đổi id sang number nếu là string
    const getMsgId = (id: string | number): number => {
      return typeof id === "string" ? parseInt(id) : id;
    };

    // Tạo ID duy nhất cho mỗi tin nhắn dựa trên ID và senderId
    const getUniqueMessageKey = () => {
      return `msg-${msg.senderId}-${typeof msg.id === "number" ? msg.id : msg.id.replace(/[^a-zA-Z0-9]/g, "")}-${new Date(msg.createdAt || "").getTime()}`;
    };

    // Xử lý click vào avatar
    const handleAvatarClick = () => {
      if (onOpenProfile && msg.senderId !== userId) {
        onOpenProfile(msg.senderId);
      }
    };

    // Xử lý hiển thị tin nhắn dựa trên loại
    const renderContent = () => {
      // Nếu tin nhắn đã bị xóa
      if (msg.isDeleted) {
        return (
          <p className="text-sm italic text-muted-foreground">
            Tin nhắn đã bị xóa
          </p>
        );
      }

      // Nếu đang chỉnh sửa tin nhắn này
      if (editingMessageId !== null && getMsgId(msg.id) === editingMessageId) {
        return (
          <div className="flex flex-col gap-2 w-full">
            <Input
              value={editMessageContent}
              onChange={(e) => setEditMessageContent(e.target.value)}
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (handleEditMessage) {
                    handleEditMessage(getMsgId(msg.id), editMessageContent);
                  }
                } else if (e.key === "Escape") {
                  setEditingMessageId(null);
                  setEditMessageContent("");
                }
              }}
            />
            <div className="flex gap-2 text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (handleEditMessage) {
                    handleEditMessage(getMsgId(msg.id), editMessageContent);
                  }
                }}
                disabled={!editMessageContent.trim()}
              >
                Lưu
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingMessageId(null);
                  setEditMessageContent("");
                }}
              >
                Hủy
              </Button>
            </div>
          </div>
        );
      }

      // Nếu là tin nhắn văn bản
      if (!msg.type || msg.type === MessageType.TEXT) {
        return (
          <div className="relative group">
            {/* Thanh công cụ sửa/xóa phía trên tin nhắn */}
            {msg.senderId === userId && !msg.isDeleted && (
              <div className="absolute top-0 right-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1 py-1 px-1.5 rounded-full bg-background/95 backdrop-blur-sm shadow-sm border border-border/30">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-transparent hover:bg-primary/10 text-blue-500 hover:text-blue-600"
                  onClick={() => {
                    setEditingMessageId(getMsgId(msg.id));
                    setEditMessageContent(msg.content);
                  }}
                  title="Chỉnh sửa tin nhắn"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-transparent hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                  onClick={() => confirmDelete(getMsgId(msg.id))}
                  title="Xóa tin nhắn"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            <p className="text-sm break-words">
              {msg.content}
              {msg.isEdited && !msg.isDeleted && (
                <span className="text-[10px] ml-1 opacity-70">
                  (đã chỉnh sửa)
                </span>
              )}
            </p>
          </div>
        );
      }

      // Hiển thị tin nhắn dựa trên loại
      switch (msg.type) {
        case MessageType.IMAGE:
          return (
            <div className="flex flex-col gap-2 relative group">
              {/* Thanh công cụ xóa phía trên ảnh */}
              {msg.senderId === userId && !msg.isDeleted && (
                <div className="absolute top-0 right-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1 py-1 px-1.5 rounded-full bg-background/95 backdrop-blur-sm shadow-sm border border-border/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-transparent hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                    onClick={() => confirmDelete(getMsgId(msg.id))}
                    title="Xóa tin nhắn"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="relative rounded-md overflow-hidden">
                <img
                  src={msg.fileUrl}
                  alt={msg.fileName || "Hình ảnh"}
                  className="max-w-[200px] max-h-[200px] rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(msg.fileUrl, "_blank")}
                />
              </div>
              <p className="text-xs opacity-80">
                {msg.fileName}
                {msg.isEdited && !msg.isDeleted && (
                  <span className="text-[10px] ml-1 opacity-70">
                    (đã chỉnh sửa)
                  </span>
                )}
              </p>
            </div>
          );

        case MessageType.VIDEO:
          return (
            <div className="flex flex-col gap-2 relative group">
              {/* Thanh công cụ xóa phía trên video */}
              {msg.senderId === userId && !msg.isDeleted && (
                <div className="absolute top-0 right-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1 py-1 px-1.5 rounded-full bg-background/95 backdrop-blur-sm shadow-sm border border-border/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-transparent hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                    onClick={() => confirmDelete(getMsgId(msg.id))}
                    title="Xóa tin nhắn"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="relative rounded-md overflow-hidden">
                <video
                  src={msg.fileUrl}
                  controls
                  className="max-w-full max-h-[300px] rounded-md"
                />
              </div>
              <p className="text-xs opacity-80">{msg.fileName}</p>
            </div>
          );

        case MessageType.AUDIO:
          return (
            <div className="flex flex-col gap-2 relative group">
              {/* Thanh công cụ xóa phía trên audio */}
              {msg.senderId === userId && !msg.isDeleted && (
                <div className="absolute top-0 right-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1 py-1 px-1.5 rounded-full bg-background/95 backdrop-blur-sm shadow-sm border border-border/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-transparent hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                    onClick={() => confirmDelete(getMsgId(msg.id))}
                    title="Xóa tin nhắn"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Music className="h-8 w-8" />
                <audio src={msg.fileUrl} controls className="max-w-full" />
              </div>
              <p className="text-xs opacity-80">{msg.fileName}</p>
            </div>
          );

        case MessageType.DOCUMENT:
          return (
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-opacity-80 transition-opacity relative group"
              onClick={() => {
                // Xử lý URL Cloudinary cho file raw
                let downloadLink = msg.downloadUrl || msg.fileUrl;

                // Lấy tên file thực từ URL Cloudinary
                const getActualFilenameFromUrl = (url: string) => {
                  try {
                    // Lấy phần cuối của URL (sau dấu / cuối cùng và trước dấu ? nếu có)
                    const urlPath = url.split("?")[0];
                    const fileName = urlPath.split("/").pop() || "";
                    return fileName;
                  } catch (e) {
                    return "";
                  }
                };

                // Xác định tên file thực từ URL
                const actualFileName = getActualFilenameFromUrl(
                  downloadLink || ""
                );

                // Xác định phần mở rộng file dựa trên tên file thực hoặc fileName từ message
                let fileExt = "";
                if (actualFileName && actualFileName.includes(".")) {
                  fileExt = actualFileName.split(".").pop() || "";
                } else if (msg.fileName && msg.fileName.includes(".")) {
                  fileExt = msg.fileName.split(".").pop() || "";
                } else if (msg.fileType) {
                  // Dựa vào MIME type
                  if (msg.fileType.includes("pdf")) fileExt = "pdf";
                  else if (msg.fileType.includes("word")) fileExt = "docx";
                  else if (msg.fileType.includes("excel")) fileExt = "xlsx";
                  else if (msg.fileType.includes("powerpoint"))
                    fileExt = "pptx";
                }

                // Tạo URL tải xuống với tham số đúng
                if (downloadLink && downloadLink.includes("cloudinary.com")) {
                  // Lấy URL cơ bản (không có tham số)
                  const baseUrl = downloadLink.split("?")[0];

                  // Sử dụng tên file thực từ URL nếu có, hoặc sử dụng tên file gốc
                  const displayName =
                    msg.fileName ||
                    actualFileName ||
                    `document.${fileExt || "pdf"}`;

                  // Tạo URL tải xuống mới
                  downloadLink = `${baseUrl}?fl_attachment=true&dn=${encodeURIComponent(
                    displayName
                  )}`;

                  // Thêm xử lý lỗi khi người dùng mở file
                  try {
                    const openWindow = window.open(downloadLink, "_blank");

                    // Nếu file là PDF, thử thêm xử lý đặc biệt
                    if (fileExt.toLowerCase() === "pdf" && openWindow) {
                      // Sau 3 giây kiểm tra nếu có lỗi, thử phương thức khác
                      setTimeout(() => {
                        try {
                          // Tạo một thẻ a để tải file trực tiếp
                          const downloadAnchor = document.createElement("a");
                          downloadAnchor.href = downloadLink || "";
                          downloadAnchor.download = displayName;
                          downloadAnchor.target = "_blank";
                          downloadAnchor.style.display = "none";
                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();

                          // Xóa thẻ sau khi đã dùng
                          setTimeout(() => {
                            document.body.removeChild(downloadAnchor);
                          }, 1000);
                        } catch (e) {
                          console.error(
                            "Lỗi khi tải file PDF bằng phương thức thay thế:",
                            e
                          );
                        }
                      }, 3000);
                    }
                  } catch (error) {
                    console.error("Error opening file:", error);
                    // Nếu xảy ra lỗi, thử sử dụng URL gốc mà không có tham số
                    if (msg.fileUrl) {
                      window.open(msg.fileUrl.split("?")[0], "_blank");
                    }
                  }
                } else {
                  window.open(downloadLink, "_blank");
                }
              }}
            >
              <FileText className="h-10 w-10" />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{msg.fileName}</p>
                <p className="text-xs opacity-70">
                  {formatFileSize(msg.fileSize)}
                </p>
              </div>

              {/* Thêm nút xóa phía trên document */}
              {msg.senderId === userId && !msg.isDeleted && (
                <div className="absolute top-0 right-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1 py-1 px-1.5 rounded-full bg-background/95 backdrop-blur-sm shadow-sm border border-border/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-transparent hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                    onClick={(e) => {
                      e.stopPropagation(); // Ngăn không cho sự kiện click lan tỏa lên parent
                      confirmDelete(getMsgId(msg.id));
                    }}
                    title="Xóa tin nhắn"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );

        default: // MessageType.FILE và các loại khác
          return (
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-opacity-80 transition-opacity relative group"
              onClick={() => {
                // Xử lý URL Cloudinary cho file raw
                let downloadLink = msg.downloadUrl || msg.fileUrl;

                // Lấy tên file thực từ URL Cloudinary
                const getActualFilenameFromUrl = (url: string) => {
                  try {
                    // Lấy phần cuối của URL (sau dấu / cuối cùng và trước dấu ? nếu có)
                    const urlPath = url.split("?")[0];
                    const fileName = urlPath.split("/").pop() || "";
                    return fileName;
                  } catch (e) {
                    return "";
                  }
                };

                // Xác định tên file thực từ URL
                const actualFileName = getActualFilenameFromUrl(
                  downloadLink || ""
                );

                // Xác định phần mở rộng file dựa trên tên file thực hoặc fileName từ message
                let fileExt = "";
                if (actualFileName && actualFileName.includes(".")) {
                  fileExt = actualFileName.split(".").pop() || "";
                } else if (msg.fileName && msg.fileName.includes(".")) {
                  fileExt = msg.fileName.split(".").pop() || "";
                }

                // Tạo URL tải xuống với tham số đúng
                if (downloadLink && downloadLink.includes("cloudinary.com")) {
                  // Lấy URL cơ bản (không có tham số)
                  const baseUrl = downloadLink.split("?")[0];

                  // Sử dụng tên file thực từ URL nếu có, hoặc sử dụng tên file gốc
                  const displayName =
                    msg.fileName ||
                    actualFileName ||
                    `file.${fileExt || "dat"}`;

                  // Tạo URL tải xuống mới
                  downloadLink = `${baseUrl}?fl_attachment=true&dn=${encodeURIComponent(
                    displayName
                  )}`;

                  // Thêm xử lý lỗi khi người dùng mở file
                  try {
                    const openWindow = window.open(downloadLink, "_blank");

                    // Nếu file là PDF, thử thêm xử lý đặc biệt
                    if (fileExt.toLowerCase() === "pdf" && openWindow) {
                      // Sau 3 giây kiểm tra nếu có lỗi, thử phương thức khác
                      setTimeout(() => {
                        try {
                          // Tạo một thẻ a để tải file trực tiếp
                          const downloadAnchor = document.createElement("a");
                          downloadAnchor.href = downloadLink || "";
                          downloadAnchor.download = displayName;
                          downloadAnchor.target = "_blank";
                          downloadAnchor.style.display = "none";
                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();

                          // Xóa thẻ sau khi đã dùng
                          setTimeout(() => {
                            document.body.removeChild(downloadAnchor);
                          }, 1000);
                        } catch (e) {
                          console.error(
                            "Lỗi khi tải file PDF bằng phương thức thay thế:",
                            e
                          );
                        }
                      }, 3000);
                    }
                  } catch (error) {
                    console.error("Error opening file:", error);
                    // Nếu xảy ra lỗi, thử sử dụng URL gốc mà không có tham số
                    if (msg.fileUrl) {
                      window.open(msg.fileUrl.split("?")[0], "_blank");
                    }
                  }
                } else {
                  window.open(downloadLink, "_blank");
                }
              }}
            >
              <File className="h-10 w-10" />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{msg.fileName}</p>
                <p className="text-xs opacity-70">
                  {formatFileSize(msg.fileSize)}
                </p>
              </div>

              {/* Thêm nút xóa phía trên file */}
              {msg.senderId === userId && !msg.isDeleted && (
                <div className="absolute top-0 right-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1 py-1 px-1.5 rounded-full bg-background/95 backdrop-blur-sm shadow-sm border border-border/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-transparent hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                    onClick={(e) => {
                      e.stopPropagation(); // Ngăn không cho sự kiện click lan tỏa lên parent
                      confirmDelete(getMsgId(msg.id));
                    }}
                    title="Xóa tin nhắn"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
      }
    };

    const isAuthor = msg.senderId === userId;

    return (
      <div
        className={`flex flex-col gap-2 p-1.5 px-3 hover:bg-gray-100/60 dark:hover:bg-slate-800 group relative rounded-lg w-full ${
          isAuthor ? "items-end" : "items-start"
        }`}
        id={getUniqueMessageKey()}
      >
        <div
          className={`flex items-start gap-2 w-full ${isAuthor ? "justify-end" : ""}`}
        >
          {!isAuthor && (
            <button onClick={handleAvatarClick} className="flex-shrink-0">
              <Avatar className="rounded-md">
                <AvatarImage
                  className="rounded-md"
                  src={msg.sender?.avatar || undefined}
                />
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-xs">
                  {(msg.sender?.name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          )}

          <div
            className={`flex flex-col max-w-[65%] ${
              isAuthor ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`flex items-center mb-1 gap-2 ${isAuthor ? "flex-row-reverse" : ""}`}
            >
              <span className="text-sm font-medium">
                {isAuthor ? "Bạn" : msg.sender?.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatMessageTime(msg.createdAt)}
              </span>
            </div>

            <div
              className={`p-3 rounded-lg w-fit ${
                isAuthor
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-muted rounded-tl-none"
              }`}
              title={formatFullTime(normalizeDate(msg.createdAt))}
            >
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
