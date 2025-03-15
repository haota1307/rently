import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircleMore, Phone } from "lucide-react";

export function RoomOwnerSection() {
  return (
    <div className="col-span-2 pl-4 hidden md:block">
      <h2 className="text-base uppercase">Người cho thuê</h2>

      <div className="w-full flex items-center mt-4">
        <Avatar className="h-20 w-20 border">
          <AvatarImage src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/9198ce95636919.5f60f2dda90ca.jpg" />
          <AvatarFallback>T</AvatarFallback>
        </Avatar>

        <div className="w-full ml-4 flex items-center justify-center gap-4">
          <div>
            <p className="text-lg">Trần Văn A</p>
            <span className="flex items-center gap-2">
              <Phone className="size-4" />
              <p>0947055644</p>
            </span>
          </div>

          <div className="w-full mt-4">
            <Button variant="outline">
              <MessageCircleMore className="size-4" />
              Liên hệ
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-amber-50 border-l-4 border-amber-400 shadow-sm p-4 mt-4">
        <CardHeader className="p-0 mb-2">
          <CardTitle className="text-amber-800 text-base font-semibold">
            Lưu ý:
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-2 text-sm text-amber-900">
          <p>
            Chỉ đặt khi cọc xác định được chủ nhà và có thỏa thuận biên nhận rõ
            ràng. Kiểm tra mọi điều khoản và yêu cầu liệt kê tất cả chi phí hàng
            tháng vào hợp đồng.
          </p>
          <p>
            Mọi thông tin liên quan đến tin đăng này mang tính chất tham khảo.
            Nếu bạn thấy rằng tin đăng này không đúng hoặc có dấu hiệu lừa đảo,{" "}
            <a
              href="#"
              className="underline font-medium text-amber-800 hover:text-amber-600"
            >
              hãy phản ánh với chúng tôi
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
