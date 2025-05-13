import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useUploadImage } from "@/features/media/useMedia";
import { ACCEPTED_IMAGE_TYPES } from "@/config/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageUploadProps {
  currentValue: string;
  imageType: "site_logo" | "site_favicon" | "hero_image";
  onImageUploaded: (imageUrl: string) => void;
}

export const ImageUpload = ({
  currentValue,
  imageType,
  onImageUploaded,
}: ImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentValue || null
  );
  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadImage();

  const getImageTypeName = () => {
    switch (imageType) {
      case "site_logo":
        return "logo trang web";
      case "site_favicon":
        return "favicon trang web";
      case "hero_image":
        return "hình nền trang chủ";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error(
        "Định dạng tệp không được hỗ trợ. Vui lòng sử dụng JPG, PNG hoặc WebP."
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Kích thước tệp vượt quá giới hạn 5MB.");
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);

    // Tự động tải lên khi chọn file
    handleImageUpload(file);
  };

  const handleImageUpload = async (file: File) => {
    try {
      // Tạo FormData để tải lên
      const formData = new FormData();
      formData.append("image", file);

      // Sử dụng hook useUploadImage từ media
      const response = await uploadImage(formData);

      // Truy cập URL từ phản hồi
      if (response && response.payload && response.payload.url) {
        onImageUploaded(response.payload.url);
        toast.success("Tải lên hình ảnh thành công");
      }
    } catch (error) {
      console.error("Lỗi tải lên:", error);
      toast.error("Không thể tải lên hình ảnh. Vui lòng thử lại.");
    }
  };

  // Hàm rút gọn URL để hiển thị
  const getShortenedUrl = (url: string) => {
    if (!url) return "";
    const maxLength = 30;
    if (url.length <= maxLength) return url;
    return url.substring(0, 15) + "..." + url.substring(url.length - 15);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            document.getElementById(`image-upload-${imageType}`)?.click()
          }
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? "Đang tải lên..." : "Tải lên hình ảnh"}
          <Upload className="h-4 w-4" />
        </Button>
        <Input
          type="file"
          id={`image-upload-${imageType}`}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Badge variant="outline" className="font-normal">
          {getImageTypeName()}
        </Badge>
      </div>

      {previewUrl && (
        <div className="border rounded-md overflow-hidden bg-gray-50/50">
          <div
            className={cn(
              "relative",
              imageType === "hero_image"
                ? "h-48 w-full"
                : imageType === "site_logo"
                  ? "h-28 w-full"
                  : "h-20 w-full",
              "bg-checkerboard"
            )}
          >
            <Image
              src={previewUrl}
              alt={getImageTypeName()}
              fill
              className={cn(
                "object-contain",
                imageType === "hero_image" && "object-cover"
              )}
            />
          </div>

          {currentValue && (
            <div className="p-2 border-t flex items-center justify-between bg-white">
              <div
                className="text-xs text-muted-foreground truncate max-w-[85%]"
                title={currentValue}
              >
                {getShortenedUrl(currentValue)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => window.open(currentValue, "_blank")}
                title="Mở liên kết"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
