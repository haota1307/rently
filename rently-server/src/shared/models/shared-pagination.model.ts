import { z } from 'zod'

// Schema cơ bản cho response phân trang
export const PaginatedResponseSchema = z.object({
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

// Types
export type PaginatedResponseType<T> = {
  data: T[]
  totalItems: number
  page: number
  limit: number
  totalPages: number
}

// Schema cho query phân trang
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
})

// Type cho query phân trang
export type PaginationQueryType = z.infer<typeof PaginationQuerySchema>
