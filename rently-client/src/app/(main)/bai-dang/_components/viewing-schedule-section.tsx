import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarX } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { ViewingScheduleForm } from "@/features/viewing-schedule/components/viewing-schedule-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ViewingScheduleSectionProps {
  postId: number;
  isAuth: boolean;
  isLandlordOrAdmin: boolean;
  existingSchedule: any | null;
}

export function ViewingScheduleSection({
  postId,
  isAuth,
  isLandlordOrAdmin,
  existingSchedule,
}: ViewingScheduleSectionProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-3 sm:p-5">
        <Accordion type="single" collapsible>
          <AccordionItem value="viewing-schedule" className="border-none">
            <AccordionTrigger className="font-medium mb-1 py-0 text-sm sm:text-base hover:no-underline">
              Đặt lịch xem phòng
            </AccordionTrigger>
            <AccordionContent>
              {!isAuth && (
                <Alert variant="default" className="bg-muted p-2 sm:p-3">
                  <CalendarX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <AlertTitle className="text-xs sm:text-sm">
                    Cần đăng nhập
                  </AlertTitle>
                  <AlertDescription className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs">
                    Bạn cần đăng nhập để đặt lịch xem phòng
                  </AlertDescription>
                  <Link href="/dang-nhap">
                    <Button
                      size="sm"
                      className="mt-1.5 sm:mt-2 h-7 sm:h-9 text-xs"
                    >
                      Đăng nhập
                    </Button>
                  </Link>
                </Alert>
              )}

              {isAuth && isLandlordOrAdmin && (
                <Alert variant="default" className="bg-muted p-2 sm:p-3">
                  <CalendarX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <AlertTitle className="text-xs sm:text-sm">
                    Không thể đặt lịch
                  </AlertTitle>
                  <AlertDescription className="text-[10px] sm:text-xs">
                    Chủ nhà và quản trị viên không thể đặt lịch xem phòng
                  </AlertDescription>
                </Alert>
              )}

              {isAuth && !isLandlordOrAdmin && existingSchedule && (
                <Alert
                  variant={
                    existingSchedule.status === "PENDING"
                      ? "default"
                      : existingSchedule.status === "APPROVED"
                        ? "default"
                        : "default"
                  }
                  className={
                    existingSchedule.status === "PENDING"
                      ? "bg-yellow-50 p-2 sm:p-3"
                      : existingSchedule.status === "APPROVED"
                        ? "bg-green-50 p-2 sm:p-3"
                        : "bg-blue-50 p-2 sm:p-3"
                  }
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <AlertTitle className="text-xs sm:text-sm">
                    {existingSchedule.status === "PENDING"
                      ? "Đang chờ xác nhận"
                      : existingSchedule.status === "APPROVED"
                        ? "Đã xác nhận lịch hẹn"
                        : "Đã đổi lịch"}
                  </AlertTitle>
                  <AlertDescription className="text-[10px] sm:text-xs">
                    Bạn đã đặt lịch xem phòng này vào ngày{" "}
                    {format(new Date(existingSchedule.viewingDate), "PPP", {
                      locale: vi,
                    })}{" "}
                    lúc{" "}
                    {format(new Date(existingSchedule.viewingDate), "HH:mm", {
                      locale: vi,
                    })}
                    .
                    <br />
                    Vui lòng kiểm tra trong{" "}
                    <Link
                      href="/lich-xem-phong"
                      className="text-primary underline"
                    >
                      danh sách lịch hẹn
                    </Link>{" "}
                    của bạn.
                  </AlertDescription>
                </Alert>
              )}

              {isAuth && !isLandlordOrAdmin && !existingSchedule && (
                <ViewingScheduleForm postId={postId} />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
