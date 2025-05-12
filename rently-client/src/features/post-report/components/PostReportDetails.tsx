import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetPostReport } from "../usePostReport";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ReportStatus } from "@/schemas/post-report.schema";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getInitials } from "@/lib/utils";

// Badge variants theo status
const statusVariantMap = {
  [ReportStatus.PENDING]: "warning",
  [ReportStatus.PROCESSED]: "success",
  [ReportStatus.REJECTED]: "destructive",
} as const;

// Label hiển thị theo status
const statusLabelMap = {
  [ReportStatus.PENDING]: "Chờ xử lý",
  [ReportStatus.PROCESSED]: "Đã xử lý",
  [ReportStatus.REJECTED]: "Đã từ chối",
} as const;

interface PostReportDetailsProps {
  reportId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostReportDetails({
  reportId,
  open,
  onOpenChange,
}: PostReportDetailsProps) {
  const { data: report, isLoading } = useGetPostReport(reportId, {
    includePost: true,
    includeReportedBy: true,
    includeProcessedBy: true,
    enabled: open && !!reportId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Chi tiết báo cáo</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    ID
                  </p>
                  <p>{report.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Ngày tạo
                  </p>
                  <p>
                    {format(new Date(report.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Trạng thái
                  </p>
                  <Badge
                    variant={
                      statusVariantMap[report.status as ReportStatus] ||
                      "default"
                    }
                  >
                    {statusLabelMap[report.status as ReportStatus] ||
                      report.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Nội dung báo cáo */}
            <div className="space-y-2">
              <h3 className="font-medium">Lý do báo cáo</h3>
              <p className="text-sm p-3 bg-muted rounded-md">{report.reason}</p>
            </div>

            {report.description && (
              <div className="space-y-2">
                <h3 className="font-medium">Mô tả chi tiết</h3>
                <p className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>
            )}

            {/* Thông tin bài đăng */}
            {report.post && (
              <div className="space-y-2 p-3 border rounded-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Bài đăng bị báo cáo</h3>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <a
                      href={`/bai-dang/${report.postId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Xem bài đăng</span>
                    </a>
                  </Button>
                </div>
                <p className="font-medium text-sm">{report.post.title}</p>
                <p className="text-xs text-muted-foreground">
                  ID: {report.postId}
                </p>
              </div>
            )}

            {/* Người báo cáo */}
            {report.reportedBy && (
              <div className="space-y-2">
                <h3 className="font-medium">Người báo cáo</h3>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={report.reportedBy.avatar || undefined} />
                    <AvatarFallback>
                      {getInitials(report.reportedBy.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {report.reportedBy.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.reportedBy.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Người xử lý */}
            {report.processedBy && report.processedAt && (
              <div className="space-y-2">
                <h3 className="font-medium">Người xử lý</h3>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={report.processedBy.avatar || undefined} />
                    <AvatarFallback>
                      {getInitials(report.processedBy.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {report.processedBy.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.processedBy.email}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Xử lý vào:{" "}
                  {format(new Date(report.processedAt), "dd/MM/yyyy HH:mm", {
                    locale: vi,
                  })}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            Không tìm thấy thông tin báo cáo
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
