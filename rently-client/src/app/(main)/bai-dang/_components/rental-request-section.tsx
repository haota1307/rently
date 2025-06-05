import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarX } from "lucide-react";
import Link from "next/link";
import { RentalRequestForm } from "./rental-request-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RentalRequestSectionProps {
  postId: number;
  isAuth: boolean;
  isLandlord: boolean;
  isLandlordOrAdmin: boolean;
  hasExistingRequest: boolean;
  isRoomAvailable: boolean;
}

export function RentalRequestSection({
  postId,
  isAuth,
  isLandlord,
  isLandlordOrAdmin,
  hasExistingRequest,
  isRoomAvailable,
}: RentalRequestSectionProps) {
  if (isLandlord) {
    return null;
  }
  if (!isRoomAvailable) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-3 sm:p-5">
        <Accordion type="single" collapsible defaultValue="rental-request">
          <AccordionItem value="rental-request" className="border-none">
            <AccordionTrigger className="font-medium mb-1 py-0 text-sm sm:text-base hover:no-underline">
              Gửi yêu cầu thuê phòng
            </AccordionTrigger>
            <AccordionContent>
              {!isAuth && (
                <Alert variant="default" className="bg-muted p-2 sm:p-3">
                  <CalendarX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <AlertTitle className="text-xs sm:text-sm">
                    Cần đăng nhập
                  </AlertTitle>
                  <AlertDescription className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs">
                    Bạn cần đăng nhập để gửi yêu cầu thuê phòng
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
                    Không thể thuê phòng
                  </AlertTitle>
                  <AlertDescription className="text-[10px] sm:text-xs">
                    Chủ nhà và quản trị viên không thể thuê phòng
                  </AlertDescription>
                </Alert>
              )}

              {isAuth && !isLandlordOrAdmin && hasExistingRequest && (
                <Alert variant="default" className="bg-yellow-50 p-2 sm:p-3">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <AlertTitle className="text-xs sm:text-sm">
                    Yêu cầu đang xử lý
                  </AlertTitle>
                  <AlertDescription className="text-[10px] sm:text-xs">
                    Bạn đã gửi yêu cầu thuê phòng này. Vui lòng kiểm tra trong
                    danh sách yêu cầu của bạn.
                  </AlertDescription>
                </Alert>
              )}

              {isAuth && !isLandlordOrAdmin && !hasExistingRequest && (
                <RentalRequestForm postId={postId} />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
