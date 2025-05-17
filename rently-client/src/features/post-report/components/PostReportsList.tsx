import { useState } from "react";
import { useGetPostReports } from "../usePostReport";
import { ReportStatus } from "@/schemas/post-report.schema";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PostReportActions } from "./PostReportActions";
import { Skeleton } from "@/components/ui/skeleton";
import { createPostSlug } from "@/lib/utils";

// Badge variants theo status
const statusVariantMap: Record<
  ReportStatus,
  "warning" | "default" | "destructive"
> = {
  [ReportStatus.PENDING]: "warning",
  [ReportStatus.PROCESSED]: "default",
  [ReportStatus.REJECTED]: "destructive",
};

// Label hiển thị theo status
const statusLabelMap = {
  [ReportStatus.PENDING]: "Chờ xử lý",
  [ReportStatus.PROCESSED]: "Đã xử lý",
  [ReportStatus.REJECTED]: "Đã từ chối",
} as const;

export default function PostReportsList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<ReportStatus | undefined>(
    ReportStatus.PENDING
  );

  const { data, isLoading, isFetching } = useGetPostReports({
    page,
    limit,
    status,
    includePost: true,
    includeReportedBy: true,
    includeProcessedBy: false,
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "ALL") {
      setStatus(undefined);
    } else {
      setStatus(newStatus as ReportStatus);
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-2xl font-semibold">Danh sách báo cáo bài đăng</h2>

        <div className="flex flex-wrap gap-4 items-center">
          <Select
            value={status !== undefined ? status : "ALL"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value={ReportStatus.PENDING}>Chờ xử lý</SelectItem>
              <SelectItem value={ReportStatus.PROCESSED}>Đã xử lý</SelectItem>
              <SelectItem value={ReportStatus.REJECTED}>Đã từ chối</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(limit)}
            onValueChange={(value) => setLimit(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Hiển thị" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>Bài đăng</TableHead>
              <TableHead>Người báo cáo</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              Array.from({ length: limit }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-9 w-28 float-right" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.items?.length ? (
              data.items.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.id}</TableCell>
                  <TableCell
                    className="max-w-48 truncate"
                    title={report.reason}
                  >
                    {report.reason}
                  </TableCell>
                  <TableCell>
                    {report.post ? (
                      <a
                        href={`/bai-dang/${createPostSlug(report.post.title, report.postId)}`}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {report.post.title.slice(0, 20)}
                        {report.post.title.length > 20 ? "..." : ""}
                      </a>
                    ) : (
                      `ID: ${report.postId}`
                    )}
                  </TableCell>
                  <TableCell>
                    {report.reportedBy?.name || `ID: ${report.reportedById}`}
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        statusVariantMap[report.status as ReportStatus] ||
                        "default"
                      }
                    >
                      {statusLabelMap[report.status as ReportStatus] ||
                        report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PostReportActions report={report} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Không tìm thấy báo cáo nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta && (
        <Pagination
          currentPage={page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
