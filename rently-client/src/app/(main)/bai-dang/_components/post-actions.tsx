import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ShareButton } from "@/components/ui/share-button";
import { ComparisonButton } from "@/components/ui/comparison-button";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { useConversation } from "@/features/conversation/use-conversation";
import { useAuth } from "@/hooks/use-auth";

interface PostActionsProps {
  post: any; // Type này sẽ được cụ thể hóa theo Post type
  landlordId: number;
  landlordPhoneNumber?: string;
  isLandlord: boolean;
}

export function PostActions({
  post,
  landlordId,
  landlordPhoneNumber,
  isLandlord,
}: PostActionsProps) {
  const { isAuthenticated: isAuth } = useAuth();
  const { startConversation, loading: loadingConversation } = useConversation();

  const handleContactLandlord = () => {
    if (landlordPhoneNumber) {
      window.open(`tel:${landlordPhoneNumber}`);
    } else {
      toast.error("Không có số điện thoại của chủ nhà");
    }
  };

  const handleSendMessage = async () => {
    if (!isAuth) {
      toast.error("Bạn cần đăng nhập để nhắn tin");
      return;
    }

    if (landlordId) {
      try {
        await startConversation(landlordId);
      } catch (error) {
        console.error("Lỗi khi tạo cuộc trò chuyện:", error);
        toast.error("Không thể kết nối với chủ nhà. Vui lòng thử lại sau");
      }
    } else {
      toast.error("Không tìm thấy thông tin chủ nhà");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
      <Button
        onClick={handleContactLandlord}
        className="flex gap-1 sm:gap-2 items-center h-8 sm:h-10 text-xs sm:text-sm"
      >
        <Phone size={14} className="sm:size-16" />
        Liên hệ chủ nhà
      </Button>

      <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-0">
        {post && post.rental && (
          <>
            <FavoriteButton rentalId={post.rental.id} size="default" />
            <ShareButton rentalDetail={post} />
            <ComparisonButton
              post={post}
              size="default"
              variant="outline"
              showText={true}
            />
          </>
        )}
      </div>
    </div>
  );
}
