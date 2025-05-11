"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon, Paperclip, Send } from "lucide-react";
import { MessageImagePreview } from "./message-image-preview";
import { MessageFilePreview } from "./message-file-preview";
import { AttachedImage } from "../message.types";
import { useRef } from "react";

export interface AttachedFile {
  file: File;
  url?: string;
  previewUrl?: string;
}

interface MessageInputProps {
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: () => Promise<void>;
  isSendingMessage: boolean;
  uploading: boolean;
  selectedFile: File | null;
  uploadProgress: number;
  sendingImages: boolean;
  attachedImages: AttachedImage[];
  attachedFiles: AttachedFile[];
  removeAttachedImage: (index: number) => void;
  removeAttachedFile: (index: number) => void;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sendImagesWithMessage: () => Promise<void>;
  sendFilesWithMessage: () => Promise<void>;
}

export function MessageInput({
  message,
  setMessage,
  handleSendMessage,
  isSendingMessage,
  uploading,
  selectedFile,
  uploadProgress,
  sendingImages,
  attachedImages,
  attachedFiles,
  removeAttachedImage,
  removeAttachedFile,
  handleImageSelect,
  handleFileSelect,
  sendImagesWithMessage,
  sendFilesWithMessage,
}: MessageInputProps) {
  const messageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (attachedImages.length > 0) {
      sendImagesWithMessage();
    } else if (attachedFiles.length > 0) {
      sendFilesWithMessage();
    } else {
      handleSendMessage();
    }
  };

  return (
    <div className="border-t py-3 px-4 flex flex-col gap-2 mt-auto">
      {/* Hiển thị ảnh đính kèm */}
      {attachedImages.length > 0 && (
        <MessageImagePreview
          images={attachedImages.map((img) => ({
            url: img.url,
            file: img.file,
          }))}
          removeImage={removeAttachedImage}
        />
      )}

      {/* Hiển thị file đính kèm */}
      {attachedFiles.length > 0 && (
        <MessageFilePreview
          files={attachedFiles}
          removeFile={removeAttachedFile}
        />
      )}

      {/* Thanh nhập tin nhắn chính */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 relative">
          <Input
            placeholder="Nhập tin nhắn..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
            autoComplete="off"
            ref={messageInputRef}
            disabled={isSendingMessage || uploading || sendingImages}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {/* Nút đính kèm file */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading || sendingImages}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          />

          {/* Nút đính kèm ảnh */}
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            disabled={uploading || sendingImages}
          />

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              type="button"
              disabled={uploading || sendingImages}
              onClick={() => imageInputRef.current?.click()}
              title="Đính kèm ảnh"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              type="button"
              disabled={uploading || sendingImages}
              onClick={() => fileInputRef.current?.click()}
              title="Đính kèm file (PDF, Word, Excel, PowerPoint, TXT, CSV)"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Button
          type="button"
          size="icon"
          className="rounded-full h-10 w-10 flex-shrink-0"
          disabled={
            (!message.trim() &&
              attachedImages.length === 0 &&
              attachedFiles.length === 0) ||
            isSendingMessage ||
            uploading ||
            sendingImages
          }
          onClick={handleSubmit}
        >
          {isSendingMessage || sendingImages ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Hiển thị trạng thái tải lên/gửi */}
      {(uploading || sendingImages) && (
        <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-md border bg-background">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">
            {uploading
              ? `Đang tải lên ${selectedFile?.name}`
              : `Đang gửi tin nhắn kèm tệp đính kèm...`}
          </span>
        </div>
      )}

      {/* Hiển thị thông tin tệp đã đính kèm */}
      {(attachedImages.length > 0 || attachedFiles.length > 0) &&
        !uploading &&
        !sendingImages && (
          <div className="flex items-center gap-2 mt-1 p-2 rounded-md bg-muted/30">
            {attachedImages.length > 0 && (
              <>
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {attachedImages.length} ảnh đã sẵn sàng
                </span>
              </>
            )}
            {attachedFiles.length > 0 && (
              <>
                <Paperclip className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {attachedFiles.length} file đã sẵn sàng
                </span>
              </>
            )}
          </div>
        )}
    </div>
  );
}
