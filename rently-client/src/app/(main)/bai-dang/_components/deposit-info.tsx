import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface DepositInfoProps {
  deposit: number;
}

export function DepositInfo({ deposit }: DepositInfoProps) {
  if (deposit <= 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start gap-2 sm:gap-3">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base sm:text-lg font-medium text-amber-800 mb-1 sm:mb-2">
              Điều kiện đặt cọc
            </h3>
            <p className="text-xs sm:text-sm text-amber-700 mb-1.5 sm:mb-2">
              Chủ nhà yêu cầu đặt cọc{" "}
              <span className="font-semibold">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(deposit)}
              </span>{" "}
              khi thuê phòng này.
            </p>
            <p className="text-xs sm:text-sm text-amber-700">
              Số tiền cọc sẽ được hoàn trả khi kết thúc hợp đồng thuê nếu không
              có hư hỏng tài sản và đã thanh toán đầy đủ các khoản phí liên quan
              (điện, nước, internet...).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
