import { z } from 'zod'

// Schema cho thống kê tổng quan
export const StatisticsOverviewSchema = z.object({
  totalRentals: z.number(),
  totalRooms: z.number(),
  totalPosts: z.number(),
  accountBalance: z.number(),
  percentageChanges: z.object({
    rentals: z.number(),
    rooms: z.number(),
    posts: z.number(),
    balance: z.number(),
  }),
})

// Schema cho query params
export const StatisticsQuerySchema = z
  .object({
    landlordId: z.coerce.number().optional(),
  })
  .strict()

// Types
export type StatisticsOverviewType = z.infer<typeof StatisticsOverviewSchema>
export type StatisticsQueryType = z.infer<typeof StatisticsQuerySchema>
