import { z } from "zod";

// Định nghĩa enum ReportStatus
export enum ReportStatus {
  PENDING = "PENDING",
  PROCESSED = "PROCESSED",
  REJECTED = "REJECTED",
}

// Schema cho việc tạo báo cáo
export const CreatePostReportSchema = z.object({
  reason: z
    .string()
    .min(10, "Lý do báo cáo tối thiểu 10 ký tự")
    .max(255, "Lý do báo cáo tối đa 255 ký tự"),
  description: z
    .string()
    .min(10, "Mô tả báo cáo tối thiểu 10 ký tự")
    .max(1000, "Mô tả báo cáo tối đa 1000 ký tự")
    .optional(),
  postId: z.number().int().positive(),
});

// Schema cho việc cập nhật trạng thái báo cáo
export const UpdatePostReportStatusSchema = z.object({
  status: z.enum([ReportStatus.PROCESSED, ReportStatus.REJECTED]),
});

// Schema cho query parameters khi lấy danh sách báo cáo
export const PostReportFilterSchema = z.object({
  status: z
    .enum([ReportStatus.PENDING, ReportStatus.PROCESSED, ReportStatus.REJECTED])
    .optional(),
  postId: z.number().int().positive().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  includePost: z.boolean().default(false),
  includeReportedBy: z.boolean().default(false),
  includeProcessedBy: z.boolean().default(false),
});

// Định nghĩa post report item
export const PostReportSchema = z.object({
  id: z.number(),
  reason: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  processedAt: z.string().or(z.date()).nullable(),
  postId: z.number(),
  reportedById: z.number(),
  processedById: z.number().nullable(),
  post: z
    .object({
      id: z.number(),
      title: z.string(),
    })
    .optional(),
  reportedBy: z
    .object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      avatar: z.string().nullable(),
    })
    .optional(),
  processedBy: z
    .object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      avatar: z.string().nullable(),
    })
    .optional(),
});

// Schema cho danh sách báo cáo
export const PostReportListSchema = z.object({
  items: z.array(PostReportSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean(),
  }),
});

// Export các types
export type CreatePostReportType = z.infer<typeof CreatePostReportSchema>;
export type UpdatePostReportStatusType = z.infer<
  typeof UpdatePostReportStatusSchema
>;
export type PostReportFilterType = z.infer<typeof PostReportFilterSchema>;
export type PostReportType = z.infer<typeof PostReportSchema>;
export type PostReportListType = z.infer<typeof PostReportListSchema>;
