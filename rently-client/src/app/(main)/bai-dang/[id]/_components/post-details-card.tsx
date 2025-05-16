import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PostDetailsCardProps {
  post: {
    id: number;
    createdAt: string;
    startDate?: string;
    endDate?: string;
    deposit: number;
    status: string;
  };
  roomArea?: number;
}

export function PostDetailsCard({ post, roomArea }: PostDetailsCardProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-3 sm:p-5">
        <h3 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">
          Thông tin chi tiết
        </h3>
        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <li className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">ID bài đăng:</span>
            <span>{post.id}</span>
          </li>
          <li className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Diện tích:</span>
            <span>{roomArea || "N/A"} m²</span>
          </li>
          <li className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Ngày đăng:</span>
            <span>{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
          </li>
          {post.startDate && (
            <li className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Ngày bắt đầu:</span>
              <span>
                {new Date(post.startDate).toLocaleDateString("vi-VN")}
              </span>
            </li>
          )}
          {post.endDate && (
            <li className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Ngày kết thúc:</span>
              <span>{new Date(post.endDate).toLocaleDateString("vi-VN")}</span>
            </li>
          )}
          <li className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Tiền đặt cọc:</span>
            <span className="font-medium">
              {post.deposit > 0
                ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(post.deposit)
                : "Không yêu cầu đặt cọc"}
            </span>
          </li>
          <li className="flex justify-between py-1">
            <span className="text-muted-foreground">Trạng thái:</span>
            <Badge
              variant={post.status === "ACTIVE" ? "default" : "outline"}
              className="font-normal text-xs h-5"
            >
              {post.status === "ACTIVE"
                ? "Đang hoạt động"
                : post.status === "INACTIVE"
                  ? "Tạm ngưng"
                  : "Đã xóa"}
            </Badge>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
