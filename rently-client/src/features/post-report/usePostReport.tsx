import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import postReportApiRequest from "./post-report.api";
import {
  CreatePostReportType,
  PostReportFilterType,
  PostReportType,
  UpdatePostReportStatusType,
} from "@/schemas/post-report.schema";

// Hook lấy danh sách báo cáo
export const useGetPostReports = (params: PostReportFilterType) => {
  return useQuery({
    queryKey: ["postReports", params],
    queryFn: async () => {
      const res = await postReportApiRequest.list(params);
      return res.payload;
    },
  });
};

// Hook lấy chi tiết một báo cáo
export const useGetPostReport = (
  id: number,
  params?: {
    includePost?: boolean;
    includeReportedBy?: boolean;
    includeProcessedBy?: boolean;
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: ["postReport", id, params],
    queryFn: async () => {
      const res = await postReportApiRequest.detail(id, {
        includePost: params?.includePost,
        includeReportedBy: params?.includeReportedBy,
        includeProcessedBy: params?.includeProcessedBy,
      });
      return res.payload as PostReportType;
    },
    enabled: params?.enabled !== undefined ? params.enabled : !!id,
  });
};

// Hook tạo báo cáo mới
export const useCreatePostReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreatePostReportType) => {
      const res = await postReportApiRequest.create(body);
      return res.payload as PostReportType;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["postReports"] });
      // Nếu có postId, invalidate cả counter của post đó
      if (data?.postId) {
        queryClient.invalidateQueries({
          queryKey: ["postReportCount", data.postId],
        });
      }
    },
  });
};

// Hook cập nhật trạng thái báo cáo
export const useUpdatePostReportStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: UpdatePostReportStatusType;
    }) => {
      const res = await postReportApiRequest.updateStatus(id, body);
      return res.payload;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["postReport", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["postReports"] });
    },
  });
};

// Hook đếm số lượng báo cáo của một bài đăng
export const useCountPostReports = (postId: number) => {
  return useQuery({
    queryKey: ["postReportCount", postId],
    queryFn: async () => {
      const res = await postReportApiRequest.countByPost(postId);
      // Trích xuất số lượng từ message (ví dụ: "Số lượng báo cáo của bài đăng: 5")
      const countMatch = res.payload.message.match(/\d+/);
      return countMatch ? parseInt(countMatch[0], 10) : 0;
    },
    enabled: !!postId,
  });
};
