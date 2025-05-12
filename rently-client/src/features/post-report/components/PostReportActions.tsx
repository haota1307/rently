import { useState } from "react";
import { useUpdatePostReportStatus } from "../usePostReport";
import { PostReportType, ReportStatus } from "@/schemas/post-report.schema";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CheckCircle, MoreVertical, Eye, XCircle } from "lucide-react";
import { PostReportDetails } from "@/features/post-report/components/PostReportDetails";

interface PostReportActionsProps {
  report: PostReportType;
}

export function PostReportActions({ report }: PostReportActionsProps) {
  const [openDetails, setOpenDetails] = useState(false);
  const [openProcessDialog, setOpenProcessDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdatePostReportStatus();

  const isReportPending = report.status === ReportStatus.PENDING;

  // Xử lý báo cáo
  const handleProcessReport = () => {
    updateStatus(
      {
        id: report.id,
        body: { status: ReportStatus.PROCESSED },
      },
      {
        onSuccess: () => {
          toast.success("Báo cáo đã được xử lý thành công");
          setOpenProcessDialog(false);
        },
        onError: (error) => {
          toast.error(
            error.message ||
              "Có lỗi xảy ra khi xử lý báo cáo. Vui lòng thử lại sau."
          );
        },
      }
    );
  };

  // Từ chối báo cáo
  const handleRejectReport = () => {
    updateStatus(
      {
        id: report.id,
        body: { status: ReportStatus.REJECTED },
      },
      {
        onSuccess: () => {
          toast.success("Báo cáo đã được đánh dấu là từ chối");
          setOpenRejectDialog(false);
        },
        onError: (error) => {
          toast.error(
            error.message ||
              "Có lỗi xảy ra khi từ chối báo cáo. Vui lòng thử lại sau."
          );
        },
      }
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Tùy chọn">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setOpenDetails(true)}>
            <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
          </DropdownMenuItem>
          {isReportPending && (
            <>
              <DropdownMenuItem onClick={() => setOpenProcessDialog(true)}>
                <CheckCircle className="mr-2 h-4 w-4" /> Xử lý báo cáo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenRejectDialog(true)}>
                <XCircle className="mr-2 h-4 w-4" /> Từ chối báo cáo
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog xem chi tiết */}
      <PostReportDetails
        open={openDetails}
        onOpenChange={setOpenDetails}
        reportId={report.id}
      />

      {/* Dialog xác nhận xử lý báo cáo */}
      <AlertDialog open={openProcessDialog} onOpenChange={setOpenProcessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xử lý báo cáo</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đánh dấu báo cáo này là đã được xử lý? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessReport}
              disabled={isUpdating}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog xác nhận từ chối báo cáo */}
      <AlertDialog open={openRejectDialog} onOpenChange={setOpenRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ chối báo cáo</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn từ chối báo cáo này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectReport}
              disabled={isUpdating}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
