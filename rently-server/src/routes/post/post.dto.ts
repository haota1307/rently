import { createZodDto } from 'nestjs-zod'
import {
  CreatePostBodySchema,
  GetPostDetailResSchema,
  GetPostParamsSchema,
  GetPostsQuerySchema,
  GetPostsResSchema,
  UpdatePostBodySchema,
} from 'src/routes/post/post.model'

export class GetPostsResDTO extends createZodDto(GetPostsResSchema) {}
export class GetPostsQueryDTO extends createZodDto(GetPostsQuerySchema) {}
export class GetPostParamsDTO extends createZodDto(GetPostParamsSchema) {}
export class GetPostDetailResDTO extends createZodDto(GetPostDetailResSchema) {}
export class CreatePostBodyDTO extends createZodDto(CreatePostBodySchema) {}
export class UpdatePostBodyDTO extends createZodDto(UpdatePostBodySchema) {}
