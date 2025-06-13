import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const SmartSearchRequestSchema = z.object({
  query: z.string().min(1, 'Query không được để trống'),
  filters: z
    .object({
      price: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
      area: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
      amenities: z.array(z.string()).optional(),
      address: z.string().optional(),
    })
    .optional(),
})

export const QueryAnalysisRequestSchema = z.object({
  query: z.string().min(1, 'Query không được để trống'),
})

export class SmartSearchRequestDto extends createZodDto(
  SmartSearchRequestSchema
) {}
export class QueryAnalysisRequestDto extends createZodDto(
  QueryAnalysisRequestSchema
) {}

// Response DTOs (không cần validation, chỉ để type safety)
export interface SmartSearchResponseDto {
  originalQuery: string
  extractedCriteria: any
  intent: string
  results: Array<{
    id: number
    title: string
    address: string
    price: number
    area: number
    images: string[]
    amenities: string[]
    matchScore: number
    isRecommended: boolean
  }>
  totalFound: number
  summary: string
  suggestions: {
    suggestions: string[]
  }
  error?: string
}

export interface QueryAnalysisResponseDto {
  query: string
  intent: string
  criteria: any
  summary: string
}

export interface SearchSuggestionsResponseDto {
  suggestions: string[]
}
