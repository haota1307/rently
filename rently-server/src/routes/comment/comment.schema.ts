import { z } from 'zod'

export const CommentSchema = z.object({
  id: z.number(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  userId: z.number(),
  postId: z.number(),
  parentId: z.number().nullable(),
})

export const UserInCommentSchema = z.object({
  id: z.number(),
  name: z.string(),
  avatar: z.string().nullable(),
})

export const CommentWithUserSchema = CommentSchema.extend({
  user: UserInCommentSchema,
})

// Recursive type để hỗ trợ comments lồng nhau
export const CommentWithRepliesSchema: z.ZodType<any> =
  CommentWithUserSchema.extend({
    replies: z.lazy(() => z.array(CommentWithRepliesSchema)),
  })

export const GetCommentsQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  postId: z.coerce.number(),
})

export const GetCommentRepliesQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  parentId: z.coerce.number(),
})

export const CreateCommentBodySchema = z.object({
  content: z.string().min(1, 'Nội dung bình luận không được để trống'),
  postId: z.number({
    required_error: 'ID bài đăng là bắt buộc',
    invalid_type_error: 'ID bài đăng phải là số',
  }),
  parentId: z.number().nullable().optional(),
})

export const UpdateCommentBodySchema = z.object({
  content: z.string().min(1, 'Nội dung bình luận không được để trống'),
})

export const CommentParamSchema = z.object({
  commentId: z.string().transform(val => Number(val)),
})

export const GetCommentsResSchema = z.object({
  data: z.array(CommentWithRepliesSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetCommentRepliesResSchema = z.object({
  data: z.array(CommentWithUserSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

// Type definitions
export type CommentType = z.infer<typeof CommentSchema>
export type UserInCommentType = z.infer<typeof UserInCommentSchema>
export type CommentWithUserType = z.infer<typeof CommentWithUserSchema>
export type CommentWithRepliesType = z.infer<typeof CommentWithRepliesSchema>
export type GetCommentsQueryType = z.infer<typeof GetCommentsQuerySchema>
export type GetCommentRepliesQueryType = z.infer<
  typeof GetCommentRepliesQuerySchema
>
export type CreateCommentBodyType = z.infer<typeof CreateCommentBodySchema>
export type UpdateCommentBodyType = z.infer<typeof UpdateCommentBodySchema>
export type CommentParamType = z.infer<typeof CommentParamSchema>
export type GetCommentsResType = z.infer<typeof GetCommentsResSchema>
export type GetCommentRepliesResType = z.infer<
  typeof GetCommentRepliesResSchema
>
