import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface PostPriceInfoProps {
  price: number;
  area?: number;
  isAvailable: boolean;
  createdAt: string;
  deposit: number;
}

export function PostPriceInfo({
  price,
  area,
  isAvailable,
  createdAt,
  deposit,
}: PostPriceInfoProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div>
        <div className="flex items-baseline gap-1 sm:gap-2">
          <span className="text-xl sm:text-2xl font-bold text-primary">
            {formatPrice(price)}
          </span>
          <span className="text-muted-foreground text-sm">/tháng</span>
        </div>
        <div className="flex items-center mt-0.5 sm:mt-1 text-xs sm:text-sm">
          <span className="text-muted-foreground">{area || "N/A"} m²</span>
          {area && price && (
            <>
              <span className="mx-1 text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {formatPrice(Math.round(price / area))}/m²
              </span>
            </>
          )}
        </div>

        {/* Hiển thị thông tin tiền đặt cọc */}
        {deposit > 0 && (
          <div className="mt-1 sm:mt-2 flex items-center">
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-800 border-amber-200 text-xs py-0.5 px-1.5 sm:px-2"
            >
              Đặt cọc:{" "}
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(deposit)}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant={isAvailable ? "default" : "destructive"}
          className="text-xs h-5"
        >
          {isAvailable ? "Còn trống" : "Đã cho thuê"}
        </Badge>
        <Badge
          variant="outline"
          className="flex items-center gap-1 text-xs h-5"
        >
          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          {new Date(createdAt).toLocaleDateString("vi-VN")}
        </Badge>
      </div>
    </div>
  );
}
