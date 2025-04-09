import { createZodDto } from 'nestjs-zod'
import {
  CommentParamSchema,
  CreateCommentBodySchema,
  GetCommentRepliesQuerySchema,
  GetCommentRepliesResSchema,
  GetCommentsQuerySchema,
  GetCommentsResSchema,
  UpdateCommentBodySchema,
} from './comment.schema'

export class GetCommentsQueryDTO extends createZodDto(GetCommentsQuerySchema) {}

export class GetCommentRepliesQueryDTO extends createZodDto(
  GetCommentRepliesQuerySchema
) {}

export class CreateCommentBodyDTO extends createZodDto(
  CreateCommentBodySchema
) {}

export class UpdateCommentBodyDTO extends createZodDto(
  UpdateCommentBodySchema
) {}

export class CommentParamDTO extends createZodDto(CommentParamSchema) {}

export class GetCommentsResDTO extends createZodDto(GetCommentsResSchema) {}

export class GetCommentRepliesResDTO extends createZodDto(
  GetCommentRepliesResSchema
) {}
