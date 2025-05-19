"use client";

import { ViewingScheduleList } from "@/features/viewing-schedule/components/viewing-schedule-list";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CalendarIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ClipboardCheckIcon,
  HomeIcon,
  ArrowRightIcon,
  ThumbsUpIcon,
  HelpCircleIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

// Kiểu dữ liệu cho trạng thái tab
type TabType = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED";

export default function ViewingSchedulePage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("ALL");

  return (
    <div className=" mx-8 py-6 space-y-6">
      <PageHeader
        title="Lịch hẹn của bạn"
        description="Quản lý và theo dõi tất cả các lịch hẹn xem phòng của bạn"
      />

      {/* Tabs chính */}
      <Tabs
        defaultValue="ALL"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-5 w-auto">
            <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            <TabsTrigger value="PENDING">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="APPROVED">Đã duyệt</TabsTrigger>
            <TabsTrigger value="REJECTED">Từ chối</TabsTrigger>
            <TabsTrigger value="RESCHEDULED">Đã đổi lịch</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <ViewingScheduleList initialTab={activeTab.toLowerCase()} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hướng dẫn sử dụng cho người thuê */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <HelpCircleIcon className="h-5 w-5 text-primary" />
            Hướng dẫn sử dụng dành cho người thuê
          </CardTitle>
          <CardDescription>
            Các thông tin và lưu ý quan trọng khi sử dụng tính năng đặt lịch xem
            phòng
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ArrowRightIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">
                    Cách đặt lịch xem phòng
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Khi bạn tìm thấy phòng ưng ý, nhấn nút "Đặt lịch xem phòng"
                    trên trang chi tiết. Chọn ngày giờ phù hợp và gửi yêu cầu
                    cho chủ nhà.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Lịch chờ duyệt</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sau khi đặt lịch, yêu cầu của bạn sẽ ở trạng thái "Chờ
                    duyệt". Chủ nhà sẽ xem xét và phản hồi trong vòng 24 giờ.
                    Bạn có thể đổi lịch hoặc hủy yêu cầu trong thời gian này.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Lịch đã duyệt</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Khi lịch được duyệt, hãy lưu ý thời gian và địa điểm xem
                    phòng. Nên liên hệ với chủ nhà trước 30 phút để xác nhận lại
                    lịch hẹn.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Lịch đổi</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nếu chủ nhà đổi lịch, bạn sẽ nhận được thông báo và cần xác
                    nhận lịch mới. Nếu bạn không thể tham gia theo lịch mới, hãy
                    hủy và đặt lại vào thời gian khác.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Lịch từ chối</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nếu lịch bị từ chối, bạn có thể xem lý do từ chối từ chủ
                    nhà. Hãy xem xét lại thời gian hoặc tìm phòng khác phù hợp
                    hơn.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <ThumbsUpIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Mẹo đặt lịch</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nên đặt lịch xem vào giờ hành chính hoặc cuối tuần để tăng
                    khả năng được duyệt. Thêm mô tả ngắn về nhu cầu thuê phòng
                    của bạn sẽ giúp chủ nhà hiểu rõ hơn.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-base">Quy định đặt lịch</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bạn không thể đặt nhiều lịch cho cùng một phòng trọ nếu đã
                    có lịch hẹn chưa bị hủy. Nếu muốn đặt lại lịch, hãy hủy lịch
                    cũ trước khi tạo lịch mới.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle>Lưu ý quan trọng</AlertTitle>
            <AlertDescription className="text-blue-700">
              Nếu không thể đến xem phòng theo lịch đã hẹn, vui lòng hủy lịch
              hoặc đổi lịch trước ít nhất 2 giờ. Việc không đến xem mà không
              thông báo có thể ảnh hưởng đến đánh giá uy tín của bạn.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="flex justify-center border-t bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground text-center">
            Cần hỗ trợ thêm? Hãy{" "}
            <Link href="/lien-he" className="text-primary font-medium">
              liên hệ với chúng tôi
            </Link>{" "}
            để được trợ giúp.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
