import http from "@/lib/http";
import {
  CreatePostReportType,
  PostReportFilterType,
  PostReportListType,
  PostReportType,
  UpdatePostReportStatusType,
} from "@/schemas/post-report.schema";
import queryString from "query-string";

const prefix = "/post-reports";

const postReportApiRequest = {
  // Tạo báo cáo mới
  create: (body: CreatePostReportType) =>
    http.post<PostReportType>(`${prefix}`, body),

  // Lấy danh sách báo cáo (chủ yếu cho admin)
  list: (params: PostReportFilterType) => {
    // Ép kiểu đúng cho các trường cần thiết
    const queryParams: any = {
      status: params.status,
      postId: params.postId !== undefined ? Number(params.postId) : undefined,
      page: params.page !== undefined ? Number(params.page) : undefined,
      limit: params.limit !== undefined ? Number(params.limit) : undefined,
      includePost:
        params.includePost !== undefined
          ? Boolean(params.includePost)
          : undefined,
      includeReportedBy:
        params.includeReportedBy !== undefined
          ? Boolean(params.includeReportedBy)
          : undefined,
      includeProcessedBy:
        params.includeProcessedBy !== undefined
          ? Boolean(params.includeProcessedBy)
          : undefined,
    };
    return http.get<PostReportListType>(
      `${prefix}?${queryString.stringify(queryParams)}`
    );
  },

  // Lấy chi tiết một báo cáo
  detail: (
    id: number,
    params?: {
      includePost?: boolean;
      includeReportedBy?: boolean;
      includeProcessedBy?: boolean;
    }
  ) =>
    http.get<PostReportType>(
      `${prefix}/${id}?${queryString.stringify({
        includePost:
          params?.includePost !== undefined
            ? Boolean(params.includePost)
            : undefined,
        includeReportedBy:
          params?.includeReportedBy !== undefined
            ? Boolean(params.includeReportedBy)
            : undefined,
        includeProcessedBy:
          params?.includeProcessedBy !== undefined
            ? Boolean(params.includeProcessedBy)
            : undefined,
      })}`
    ),

  // Cập nhật trạng thái báo cáo (chỉ admin)
  updateStatus: (id: number, body: UpdatePostReportStatusType) =>
    http.patch<{ message: string }>(`${prefix}/${id}/status`, body),

  // Đếm số lượng báo cáo của một bài đăng
  countByPost: (postId: number) =>
    http.get<{ message: string }>(`${prefix}/post/${postId}/count`),
};

export default postReportApiRequest;
