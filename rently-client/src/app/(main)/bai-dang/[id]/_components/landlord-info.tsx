import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { useConversation } from "@/features/conversation/use-conversation";
import { useAuth } from "@/hooks/use-auth";

interface LandlordInfoProps {
  landlord: {
    id: number;
    name: string;
    avatar?: string;
    phoneNumber?: string;
    email?: string;
  };
  isLandlord: boolean;
}

export function LandlordInfo({ landlord, isLandlord }: LandlordInfoProps) {
  const { isAuthenticated: isAuth } = useAuth();
  const { startConversation, loading: loadingConversation } = useConversation();

  const handleContactLandlord = () => {
    if (landlord?.phoneNumber) {
      window.open(`tel:${landlord.phoneNumber}`);
    } else {
      toast.error("Không có số điện thoại của chủ nhà");
    }
  };

  const handleSendMessage = async () => {
    if (!isAuth) {
      toast.error("Bạn cần đăng nhập để nhắn tin");
      return;
    }

    if (landlord?.id) {
      try {
        await startConversation(landlord.id);
      } catch (error) {
        console.error("Lỗi khi tạo cuộc trò chuyện:", error);
        toast.error("Không thể kết nối với chủ nhà. Vui lòng thử lại sau");
      }
    } else {
      toast.error("Không tìm thấy thông tin chủ nhà");
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-3 sm:p-5">
        <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">
          Thông tin người cho thuê
        </h3>
        <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-gray-200">
            <Image
              src={landlord?.avatar || "/placeholder.svg?height=48&width=48"}
              alt={landlord?.name || "Chủ nhà"}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-sm sm:text-base">
              {landlord?.name || "Không có thông tin"}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Chủ nhà trọ
            </p>
          </div>
        </div>

        {landlord?.phoneNumber && (
          <Button
            className="w-full mb-2 h-8 sm:h-10 text-xs sm:text-sm"
            variant="default"
            onClick={handleContactLandlord}
          >
            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            {landlord.phoneNumber}
          </Button>
        )}

        {/* Hiển thị nút nhắn tin chỉ khi người dùng đã đăng nhập và không phải là chủ nhà */}
        {isAuth && !isLandlord && (
          <Button
            className="w-full h-8 sm:h-10 text-xs sm:text-sm"
            variant="outline"
            onClick={handleSendMessage}
            disabled={loadingConversation}
          >
            {loadingConversation ? "Đang xử lý..." : "Nhắn tin"}
          </Button>
        )}

        {/* Hiển thị thông báo khi người dùng là chủ nhà */}
        {isAuth && isLandlord && (
          <div className="text-[10px] sm:text-xs text-center text-muted-foreground mt-2">
            Bạn là chủ nhà trọ này
          </div>
        )}

        {!isAuth && (
          <div className="mt-2">
            <Link href="/dang-nhap">
              <Button
                className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                variant="outline"
              >
                Đăng nhập để nhắn tin
              </Button>
            </Link>
          </div>
        )}

        {landlord?.email && (
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-2">
            {landlord.email}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
