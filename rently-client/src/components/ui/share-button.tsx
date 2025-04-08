import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  rentalDetail: any;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ShareButton({
  rentalDetail,
  variant = "outline",
  size = "default",
  className,
}: ShareButtonProps) {
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: rentalDetail?.title || "Chia sẻ nhà trọ",
          text: `Xem thông tin nhà trọ: ${rentalDetail?.title || ""}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Lỗi chia sẻ:", error));
    } else {
      // Fallback nếu Web Share API không được hỗ trợ
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết vào clipboard");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleShare}
    >
      <Share className="h-4 w-4 mr-2" />
      Chia sẻ
    </Button>
  );
}
