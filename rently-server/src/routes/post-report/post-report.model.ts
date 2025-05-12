import { z } from 'zod'

export enum ReportStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
}

export const CreatePostReportSchema = z.object({
  reason: z
    .string()
    .min(10, 'Lý do báo cáo tối thiểu 10 ký tự')
    .max(255, 'Lý do báo cáo tối đa 255 ký tự'),
  description: z
    .string()
    .min(10, 'Mô tả báo cáo tối thiểu 10 ký tự')
    .max(1000, 'Mô tả báo cáo tối đa 1000 ký tự')
    .optional(),
  postId: z.number().int().positive(),
})

export const UpdatePostReportStatusSchema = z.object({
  status: z.enum([ReportStatus.PROCESSED, ReportStatus.REJECTED]),
})

export const PostReportFilterSchema = z.object({
  status: z
    .enum([ReportStatus.PENDING, ReportStatus.PROCESSED, ReportStatus.REJECTED])
    .optional(),
  postId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const PostReportIncludeSchema = z.object({
  includePost: z.coerce.boolean().default(false),
  includeReportedBy: z.coerce.boolean().default(false),
  includeProcessedBy: z.coerce.boolean().default(false),
})

export const PostReportFilterWithIncludeSchema = PostReportFilterSchema.merge(
  PostReportIncludeSchema
)

export type CreatePostReportType = z.infer<typeof CreatePostReportSchema>
export type UpdatePostReportStatusType = z.infer<
  typeof UpdatePostReportStatusSchema
>
export type PostReportFilterType = z.infer<typeof PostReportFilterSchema>
export type PostReportIncludeType = z.infer<typeof PostReportIncludeSchema>
export type PostReportFilterWithIncludeType = z.infer<
  typeof PostReportFilterWithIncludeSchema
>
