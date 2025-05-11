"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface MessageImagePreviewProps {
  images: Array<{ url: string; file: File }>;
  removeImage: (index: number) => void;
}

export function MessageImagePreview({
  images,
  removeImage,
}: MessageImagePreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="p-2 border rounded-md mb-2 bg-background">
      <div className="text-xs text-muted-foreground mb-1 flex justify-between items-center">
        <span>Ảnh đính kèm ({images.length})</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => images.forEach((_, index) => removeImage(index))}
        >
          Xóa tất cả
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <div key={index} className="relative min-w-[80px] h-[80px]">
            <img
              src={image.url}
              alt={`Ảnh đính kèm ${index + 1}`}
              className="w-[80px] h-[80px] object-cover rounded-md"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-0.5 right-0.5 bg-black bg-opacity-50 text-white rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Định dạng kích thước file
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};
