import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import {
  CreatePostReportSchema,
  PostReportFilterSchema,
  PostReportFilterWithIncludeSchema,
  UpdatePostReportStatusSchema,
} from './post-report.model'

export class CreatePostReportBodyDTO extends createZodDto(
  CreatePostReportSchema
) {}
export class UpdatePostReportStatusBodyDTO extends createZodDto(
  UpdatePostReportStatusSchema
) {}
export class PostReportFilterQueryDTO extends createZodDto(
  PostReportFilterSchema
) {}
export class PostReportFilterWithIncludeQueryDTO extends createZodDto(
  PostReportFilterWithIncludeSchema
) {}

// Response DTOs
export class PostReportResDTO extends createZodDto(
  z.object({
    id: z.number(),
    reason: z.string(),
    description: z.string().nullable(),
    status: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    processedAt: z.date().nullable(),
    postId: z.number(),
    reportedById: z.number(),
    processedById: z.number().nullable(),
  })
) {}

export class PaginatedPostReportResDTO extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.number(),
        reason: z.string(),
        description: z.string().nullable(),
        status: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        processedAt: z.date().nullable(),
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
          .nullable()
          .optional(),
      })
    ),
    meta: z.object({
      page: z.number(),
      limit: z.number(),
      totalItems: z.number(),
      totalPages: z.number(),
      hasPreviousPage: z.boolean(),
      hasNextPage: z.boolean(),
    }),
  })
) {}
