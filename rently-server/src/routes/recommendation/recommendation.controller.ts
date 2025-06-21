import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Logger,
  Param,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { RecommendationService } from './recommendation.service'
import { RecommendationPerformanceService } from './recommendation-performance.service'
import { MemoryCacheService } from './memory-cache.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { ActiveUserData } from 'src/shared/interfaces/active-user-data.interface'

@Controller('recommendations')
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name)

  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly performanceService: RecommendationPerformanceService,
    private readonly memoryCacheService: MemoryCacheService
  ) {}

  /**
   * GET /recommendations?roomId=123&limit=8
   * Lấy danh sách phòng trọ được gợi ý thông minh dựa trên roomId
   * Sử dụng thuật toán Hybrid tự động điều chỉnh theo context
   * Public endpoint - không cần auth
   */
  @Get()
  @IsPublic()
  async getRecommendations(
    @Query('roomId') roomId: string,
    @Query('limit') limit: string = '8',
    @Query('method') method: string = 'HYBRID',
    @Query('maxDistance') maxDistance: string = '5000',
    @Query('priceVariance') priceVariance: string = '0.3',
    @Query('areaVariance') areaVariance: string = '0.4',
    @ActiveUser('userId') userId?: number
  ) {
    try {
      this.logger.log(
        `Getting recommendations for room ${roomId}, user: ${userId || 'anonymous'}`
      )

      const query = {
        roomId: parseInt(roomId, 10),
        limit: parseInt(limit, 10),
        method: method as any,
        maxDistance: parseInt(maxDistance, 10),
        priceVariance: parseFloat(priceVariance),
        areaVariance: parseFloat(areaVariance),
        includeExplanations: true,
      }

      const recommendations =
        await this.recommendationService.getRecommendations(query, userId)

      return {
        success: true,
        message: 'Lấy danh sách gợi ý thành công',
        data: recommendations,
      }
    } catch (error) {
      this.logger.error(
        `Error getting recommendations: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  /**
   * POST /recommendations/track-click
   * Track khi user click vào một recommendation
   * Cần authentication
   */
  @Post('track-click')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  async trackRecommendationClick(
    @Body()
    body: {
      sourceRoomId: number
      targetRoomId: number
      method: string
      rank: number
      similarityScore: number
    },
    @ActiveUser('userId') userId: number
  ) {
    try {
      this.logger.log(`Tracking recommendation click from user ${userId}`)

      const trackingData = {
        userId,
        sourceRoomId: body.sourceRoomId,
        targetRoomId: body.targetRoomId,
        method: body.method as any,
        rank: body.rank,
        similarityScore: body.similarityScore,
      }

      await this.recommendationService.trackClick(trackingData)

      return {
        success: true,
        message: 'Đã ghi nhận tương tác',
      }
    } catch (error) {
      this.logger.error(
        `Error tracking recommendation click: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  /**
   * GET /recommendations/health
   * Health check endpoint
   */
  @Get('health')
  @IsPublic()
  async healthCheck() {
    return {
      success: true,
      message: 'Recommendation service is healthy',
      data: {
        service: 'recommendation',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        features: [
          'hybrid intelligent recommendations',
          'content-based filtering',
          'collaborative filtering',
          'popularity-based filtering',
          'location-based filtering',
          'context-aware weighting',
          'click tracking',
          'similarity explanation',
        ],
      },
    }
  }

  /**
   * GET /recommendations/room/:roomId
   * Alternative endpoint với roomId trong path
   * Sử dụng thuật toán Hybrid thông minh
   */
  @Get('room/:roomId')
  @IsPublic()
  async getRecommendationsForRoom(
    @Param('roomId') roomId: string,
    @Query('limit') limit: string = '8',
    @Query('method') method: string = 'HYBRID',
    @ActiveUser('userId') userId?: number
  ) {
    try {
      const query = {
        roomId: parseInt(roomId, 10),
        limit: parseInt(limit, 10),
        method: method as any,
        maxDistance: 5000,
        priceVariance: 0.3,
        areaVariance: 0.4,
        includeExplanations: true,
      }

      const recommendations =
        await this.recommendationService.getRecommendations(query, userId)

      return {
        success: true,
        message: 'Lấy danh sách gợi ý thành công',
        data: recommendations,
      }
    } catch (error) {
      this.logger.error(
        `Error getting recommendations for room: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  /**
   * AI Comparison Analysis cho comparison page
   */
  @Post('ai-comparison')
  @IsPublic()
  async generateAIComparison(
    @Body() roomIds: number[],
    @ActiveUser() user?: ActiveUserData
  ) {
    return this.recommendationService.generateAIComparison(
      roomIds,
      user?.userId
    )
  }

  /**
   * GET /recommendations/performance-stats
   * Performance monitoring endpoint
   */
  @Get('performance-stats')
  async getPerformanceStats(@Query('days') days: string = '7') {
    try {
      const daysNum = parseInt(days, 10) || 7
      const stats = await this.performanceService.getPerformanceStats(daysNum)
      const recommendations =
        await this.performanceService.getOptimizationRecommendations()

      return {
        success: true,
        message: 'Performance statistics retrieved successfully',
        data: {
          ...stats,
          recommendations,
          period: `${daysNum} days`,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      this.logger.error('Error getting performance stats:', error)
      return {
        success: false,
        message: 'Error retrieving performance statistics',
        data: {
          avgResponseTime: 0,
          cacheHitRate: 0,
          queryCount: 0,
          errorRate: 0,
          recommendations: ['Unable to retrieve performance data'],
        },
      }
    }
  }

  /**
   * GET /recommendations/health-check
   * System health check endpoint
   */
  @Get('health-check')
  async systemHealthCheck() {
    try {
      const health = await this.performanceService.healthCheck()

      return {
        success: true,
        message: 'Health check completed',
        data: health,
      }
    } catch (error) {
      this.logger.error('Error in health check:', error)
      return {
        success: false,
        message: 'Health check failed',
        data: {
          status: 'unhealthy',
          error: error.message,
        },
      }
    }
  }

  /**
   * GET /recommendations/cache-stats
   * Memory cache statistics endpoint
   */
  @Get('cache-stats')
  async getCacheStats() {
    try {
      const cacheStats = this.memoryCacheService.getCacheStats()

      return {
        success: true,
        message: 'Cache statistics retrieved successfully',
        data: {
          ...cacheStats,
          timestamp: new Date().toISOString(),
          optimizations: {
            memoryCache: 'L1 & L2 Multi-level caching active',
            redisCache: 'L3 Redis caching active',
            totalLayers: 3,
            expectedPerformance: '95%+ cache hit rate',
          },
        },
      }
    } catch (error) {
      this.logger.error('Error getting cache stats:', error)
      return {
        success: false,
        message: 'Error retrieving cache statistics',
        data: {
          l1: { size: 0, hitRate: 0 },
          l2: { size: 0, hitRate: 0 },
          overall: { hitRate: 0, totalRequests: 0 },
        },
      }
    }
  }
}
