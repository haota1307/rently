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
    days: z.coerce.number().optional().default(7),
    limit: z.coerce.number().optional().default(5),
    transaction_content: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .strict()

// Schema cho dữ liệu doanh thu
export const RevenueDataSchema = z.object({
  name: z.string(),
  nạp: z.number(),
  rút: z.number(),
  date: z.string(),
})

// Schema cho phân phối phòng trọ
export const RoomDistributionSchema = z.object({
  name: z.string(),
  value: z.number(),
  color: z.string(),
})

// Schema cho bài đăng theo khu vực
export const AreaPostCountSchema = z.object({
  name: z.string(),
  posts: z.number(),
})

// Schema cho khu vực phổ biến
export const PopularAreaSchema = z.object({
  name: z.string(),
  count: z.number(),
  trend: z.string(),
})

// Types
export type StatisticsOverviewType = z.infer<typeof StatisticsOverviewSchema>
export type StatisticsQueryType = z.infer<typeof StatisticsQuerySchema>
export type RevenueDataType = z.infer<typeof RevenueDataSchema>
export type RoomDistributionType = z.infer<typeof RoomDistributionSchema>
export type AreaPostCountType = z.infer<typeof AreaPostCountSchema>
export type PopularAreaType = z.infer<typeof PopularAreaSchema>
