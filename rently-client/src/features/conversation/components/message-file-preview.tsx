"use client";

import { Button } from "@/components/ui/button";
import { File, FileText, Music, FileIcon } from "lucide-react";
import { X } from "lucide-react";
import { formatFileSize } from "./message-image-preview";

export interface MessageFilePreviewProps {
  files: Array<{
    file: File;
    url?: string;
    previewUrl?: string;
  }>;
  removeFile: (index: number) => void;
}

// Hàm xác định icon dựa vào loại file
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) {
    return null; // Hình ảnh hiển thị trực tiếp
  } else if (fileType.startsWith("video/")) {
    return <FileIcon className="h-8 w-8" />;
  } else if (fileType.startsWith("audio/")) {
    return <Music className="h-8 w-8" />;
  } else if (
    fileType === "application/pdf" ||
    fileType.includes("word") ||
    fileType.includes("excel") ||
    fileType.includes("powerpoint") ||
    fileType.includes("openxmlformats")
  ) {
    return <FileText className="h-8 w-8" />;
  } else {
    return <File className="h-8 w-8" />;
  }
};

export function MessageFilePreview({
  files,
  removeFile,
}: MessageFilePreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="p-2 border rounded-md mb-2 bg-background">
      <div className="text-xs text-muted-foreground mb-1 flex justify-between items-center">
        <span>File đính kèm ({files.length})</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => files.forEach((_, index) => removeFile(index))}
        >
          Xóa tất cả
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {files.map((file, index) => (
          <div
            key={index}
            className="relative flex items-center p-2 border rounded-md bg-muted/30"
          >
            {/* Icon phù hợp với loại file */}
            <div className="flex-shrink-0 mr-2">
              {getFileIcon(file.file.type)}
            </div>

            {/* Thông tin file */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.file.size)}
              </p>
            </div>

            {/* Nút xóa */}
            <button
              type="button"
              onClick={() => removeFile(index)}
              className="ml-2 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
