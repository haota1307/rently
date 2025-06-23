import { createZodDto } from 'nestjs-zod'
import {
  CreatePostBodySchema,
  CreateBulkPostsBodySchema,
  CreateBulkPostsResSchema,
  GetPostDetailResSchema,
  GetPostParamsSchema,
  GetPostsQuerySchema,
  GetPostsResSchema,
  UpdatePostBodySchema,
  UpdatePostStatusSchema,
} from 'src/routes/post/post.model'
import { z } from 'zod'

export class GetPostsResDTO extends createZodDto(GetPostsResSchema) {}
export class GetPostsQueryDTO extends createZodDto(GetPostsQuerySchema) {}
export class GetPostParamsDTO extends createZodDto(GetPostParamsSchema) {}
export class GetPostDetailResDTO extends createZodDto(GetPostDetailResSchema) {}
export class CreatePostBodyDTO extends createZodDto(CreatePostBodySchema) {}
export class CreateBulkPostsBodyDTO extends createZodDto(
  CreateBulkPostsBodySchema
) {}
export class CreateBulkPostsResDTO extends createZodDto(
  CreateBulkPostsResSchema
) {}
export class UpdatePostBodyDTO extends createZodDto(UpdatePostBodySchema) {}
export class UpdatePostStatusDTO extends createZodDto(UpdatePostStatusSchema) {}

// Thêm DTO cho API getNearbyPosts
export const GetNearbyPostsResSchema = z.object({
  data: z.array(
    z.object({
      id: z.coerce.number(),
      title: z.string(),
      price: z.number().or(z.string().transform(Number)),
      address: z.string(),
      area: z.number(),
      distance: z.number().nullable().optional(),
      images: z.array(
        z.object({
          url: z.string(),
          order: z.number(),
        })
      ),
      amenities: z.array(z.string()),
      status: z.string(),
    })
  ),
  totalItems: z.number(),
})

export class GetNearbyPostsResDTO extends createZodDto(
  GetNearbyPostsResSchema
) {}
