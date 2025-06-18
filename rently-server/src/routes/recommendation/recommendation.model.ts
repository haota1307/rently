import { z } from 'zod'
import { RoomSchema } from 'src/shared/models/shared-room.model'

// Enum cho loại recommendation algorithms
export enum RecommendationMethod {
  CONTENT_BASED = 'CONTENT_BASED',
  COLLABORATIVE = 'COLLABORATIVE',
  HYBRID = 'HYBRID',
  POPULARITY = 'POPULARITY',
  LOCATION_BASED = 'LOCATION_BASED',
}

// Schema cho similarity score breakdown
export const SimilarityBreakdownSchema = z.object({
  location: z.number().min(0).max(1),
  price: z.number().min(0).max(1),
  area: z.number().min(0).max(1),
  amenities: z.number().min(0).max(1),
  overall: z.number().min(0).max(1),
})

// Schema cho explanation của recommendation
export const RecommendationExplanationSchema = z.object({
  reasons: z.array(z.string()),
  distance: z.number().optional(),
  priceDifference: z.number().optional(),
  areaDifference: z.number().optional(),
  commonAmenities: z.array(z.string()).optional(),
})

// Schema cơ bản cho recommended room
export const RecommendedRoomSchema = RoomSchema.extend({
  similarityScore: z.number().min(0).max(1),
  method: z.nativeEnum(RecommendationMethod),
  explanation: RecommendationExplanationSchema,
  similarityBreakdown: SimilarityBreakdownSchema,
  rank: z.number().int().positive(),
  rental: z.object({
    id: z.number(),
    title: z.string(),
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
    distance: z.number().optional(),
    rentalImages: z
      .array(
        z.object({
          id: z.number(),
          imageUrl: z.string(),
          order: z.number(),
        })
      )
      .optional(),
  }),
})

// Schema cho query parameters
export const GetRecommendationsQuerySchema = z
  .object({
    roomId: z.coerce.number().int().positive(),
    userId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().default(8),
    method: z
      .nativeEnum(RecommendationMethod)
      .optional()
      .default(RecommendationMethod.HYBRID),
    includeExplanations: z.coerce.boolean().default(true),
    maxDistance: z.coerce.number().positive().default(5000), // meters
    priceVariance: z.coerce.number().min(0).max(1).default(0.3), // 30% variance
    areaVariance: z.coerce.number().min(0).max(1).default(0.4), // 40% variance
  })
  .strict()

// Schema cho response
export const GetRecommendationsResSchema = z.object({
  data: z.array(RecommendedRoomSchema),
  metadata: z.object({
    totalCandidates: z.number(),
    method: z.nativeEnum(RecommendationMethod),
    executionTime: z.number(), // milliseconds
    weights: z.object({
      location: z.number(),
      price: z.number(),
      area: z.number(),
      amenities: z.number(),
    }),
    targetRoom: z.object({
      id: z.number(),
      title: z.string(),
      price: z.number(),
      area: z.number(),
      isAvailable: z.boolean(),
    }),
  }),
})

// Schema cho tracking recommendation clicks
export const TrackRecommendationClickSchema = z
  .object({
    userId: z.number().int().positive(),
    sourceRoomId: z.number().int().positive(),
    targetRoomId: z.number().int().positive(),
    method: z.nativeEnum(RecommendationMethod),
    rank: z.number().int().positive(),
    similarityScore: z.number().min(0).max(1),
  })
  .strict()

// Schema cho analytics
export const RecommendationAnalyticsSchema = z
  .object({
    period: z.enum(['day', 'week', 'month']).default('week'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .strict()

// Schema cho analytics response
export const RecommendationAnalyticsResSchema = z.object({
  clickThroughRate: z.number(),
  conversionRate: z.number(),
  averageSimilarityScore: z.number(),
  methodPerformance: z.record(
    z.string(),
    z.object({
      clicks: z.number(),
      impressions: z.number(),
      ctr: z.number(),
    })
  ),
  topPerformingRooms: z.array(
    z.object({
      roomId: z.number(),
      title: z.string(),
      clicks: z.number(),
      ctr: z.number(),
    })
  ),
})

// Schema cho similarity weights configuration
export const SimilarityWeightsSchema = z
  .object({
    location: z.number().min(0).max(1).default(0.45),
    price: z.number().min(0).max(1).default(0.25),
    area: z.number().min(0).max(1).default(0.15),
    amenities: z.number().min(0).max(1).default(0.15),
  })
  .refine(
    data => {
      const sum = data.location + data.price + data.area + data.amenities
      return Math.abs(sum - 1) < 0.001 // Allow small floating point errors
    },
    {
      message: 'Weights must sum to 1.0',
    }
  )

// Types
export type RecommendationMethodType = RecommendationMethod
export type SimilarityBreakdownType = z.infer<typeof SimilarityBreakdownSchema>
export type RecommendationExplanationType = z.infer<
  typeof RecommendationExplanationSchema
>
export type RecommendedRoomType = z.infer<typeof RecommendedRoomSchema>
export type GetRecommendationsQueryType = z.infer<
  typeof GetRecommendationsQuerySchema
>
export type GetRecommendationsResType = z.infer<
  typeof GetRecommendationsResSchema
>
export type TrackRecommendationClickType = z.infer<
  typeof TrackRecommendationClickSchema
>
export type RecommendationAnalyticsType = z.infer<
  typeof RecommendationAnalyticsSchema
>
export type RecommendationAnalyticsResType = z.infer<
  typeof RecommendationAnalyticsResSchema
>
export type SimilarityWeightsType = z.infer<typeof SimilarityWeightsSchema>

// Configuration constants
export const DEFAULT_SIMILARITY_WEIGHTS: SimilarityWeightsType = {
  location: 0.45,
  price: 0.25,
  area: 0.15,
  amenities: 0.15,
}

export const RECOMMENDATION_CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds
export const ANALYTICS_CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds
