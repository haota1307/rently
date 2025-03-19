"use client";

import type { Dispatch, SetStateAction } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface LandlordDialogProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  landlordStatus: any;
  setLandlordStatus: Dispatch<SetStateAction<any>>;
}

export default function LandlordDialog({
  isOpen,
  setIsOpen,
  isLoading,
  setIsLoading,
  landlordStatus,
  setLandlordStatus,
}: LandlordDialogProps) {
  function onLandlordRequest() {
    setIsLoading(true);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={"outline"} disabled={landlordStatus === "pending"}>
          Đăng ký ngay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Đăng ký trở thành người cho thuê</DialogTitle>
          <DialogDescription>
            Hoàn thành đăng ký để bắt đầu cho thuê và kinh doanh trên nền tảng
            của chúng tôi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Quyền lợi của người cho thuê:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Đăng tin cho thuê không giới hạn</li>
              <li>Tiếp cận hàng ngàn khách hàng tiềm năng</li>
              <li>Công cụ quản lý cho thuê chuyên nghiệp</li>
              <li>Hỗ trợ kỹ thuật ưu tiên</li>
              <li>Báo cáo và phân tích chi tiết</li>
            </ul>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Yêu cầu:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Xác minh danh tính</li>
              <li>Cung cấp thông tin pháp lý về tài sản</li>
              <li>Tuân thủ các quy định và chính sách của nền tảng</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onLandlordRequest} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận đăng ký
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
