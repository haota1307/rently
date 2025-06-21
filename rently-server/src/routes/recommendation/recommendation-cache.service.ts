import { Injectable, Logger } from '@nestjs/common'
import { Redis } from 'ioredis'
import {
  RecommendedRoomType,
  GetRecommendationsResType,
  RecommendationMethod,
} from './recommendation.model'

@Injectable()
export class RecommendationCacheService {
  private readonly logger = new Logger(RecommendationCacheService.name)
  private readonly redis: Redis
  private readonly defaultTTL = 5 * 60 // 5 minutes
  private readonly longTTL = 30 * 60 // 30 minutes

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })

    this.redis.on('error', error => {
      this.logger.error('Redis connection error:', error)
    })

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis for recommendation caching')
    })
  }

  /**
   * 🔑 Generate smart cache key with time window
   */
  generateCacheKey(
    method: RecommendationMethod,
    roomId: number,
    userId?: number,
    timeWindow: number = 5
  ): string {
    const windowTimestamp = Math.floor(Date.now() / (timeWindow * 60 * 1000))
    const userContext = userId ? `u:${userId}` : 'anon'
    return `rec:${method}:${roomId}:${userContext}:${windowTimestamp}`
  }

  /**
   * 📋 Get cached recommendations
   */
  async getCachedRecommendations(
    cacheKey: string
  ): Promise<GetRecommendationsResType | null> {
    try {
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        this.logger.debug(`Cache HIT for key: ${cacheKey}`)
        return JSON.parse(cached)
      }
      this.logger.debug(`Cache MISS for key: ${cacheKey}`)
      return null
    } catch (error) {
      this.logger.error('Error getting cached recommendations:', error)
      return null
    }
  }

  /**
   * 💾 Set cached recommendations with intelligent TTL
   */
  async setCachedRecommendations(
    cacheKey: string,
    data: GetRecommendationsResType,
    customTTL?: number
  ): Promise<void> {
    try {
      // Intelligent TTL based on data quality and method
      const ttl = customTTL || this.calculateIntelligentTTL(data)

      await this.redis.setex(cacheKey, ttl, JSON.stringify(data))

      // Track cache metrics
      await this.trackCacheMetrics('set', data.metadata.method)

      this.logger.debug(
        `Cached recommendations for key: ${cacheKey}, TTL: ${ttl}s`
      )
    } catch (error) {
      this.logger.error('Error setting cached recommendations:', error)
    }
  }

  /**
   * 🧠 Calculate intelligent TTL based on data characteristics
   */
  private calculateIntelligentTTL(data: GetRecommendationsResType): number {
    let ttl = this.defaultTTL

    // Longer cache for stable algorithms
    if (data.metadata.method === RecommendationMethod.CONTENT_BASED) {
      ttl = this.longTTL
    }

    // Shorter cache for dynamic algorithms
    if (data.metadata.method === RecommendationMethod.COLLABORATIVE) {
      ttl = Math.floor(this.defaultTTL * 0.7)
    }

    // Adjust based on result count (more results = more stable)
    if (data.data.length >= 8) {
      ttl = Math.floor(ttl * 1.2)
    }

    // Adjust based on execution time (slower queries cache longer)
    if (data.metadata.executionTime > 500) {
      ttl = Math.floor(ttl * 1.5)
    }

    return Math.min(ttl, this.longTTL * 2) // Cap at 1 hour
  }

  /**
   * 🗑️ Invalidate user-specific cache
   */
  async invalidateUserCache(userId: number): Promise<void> {
    try {
      const patterns = [
        `rec:*:*:u:${userId}:*`,
        `similarity:user:${userId}:*`,
        `user_interactions:${userId}`,
      ]

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
          this.logger.debug(
            `Invalidated ${keys.length} cache keys for user ${userId}`
          )
        }
      }
    } catch (error) {
      this.logger.error(`Error invalidating cache for user ${userId}:`, error)
    }
  }

  /**
   * 🎯 Invalidate room-specific cache
   */
  async invalidateRoomCache(roomId: number): Promise<void> {
    try {
      const patterns = [
        `rec:*:${roomId}:*`,
        `similarity:room:${roomId}:*`,
        `room_details:${roomId}`,
      ]

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
          this.logger.debug(
            `Invalidated ${keys.length} cache keys for room ${roomId}`
          )
        }
      }
    } catch (error) {
      this.logger.error(`Error invalidating cache for room ${roomId}:`, error)
    }
  }

  /**
   * 💾 Cache user interactions for collaborative filtering
   */
  async cacheUserInteractions(
    userId: number,
    interactions: any,
    ttl: number = 30 * 60
  ): Promise<void> {
    try {
      const key = `user_interactions:${userId}`
      await this.redis.setex(key, ttl, JSON.stringify(interactions))
    } catch (error) {
      this.logger.error('Error caching user interactions:', error)
    }
  }

  /**
   * 📊 Get cached user interactions
   */
  async getCachedUserInteractions(userId: number): Promise<any | null> {
    try {
      const cached = await this.redis.get(`user_interactions:${userId}`)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      this.logger.error('Error getting cached user interactions:', error)
      return null
    }
  }

  /**
   * 🎲 Cache similarity matrix cho precomputed similarities
   */
  async cacheSimilarityMatrix(
    roomId: number,
    similarities: Array<{ roomId: number; score: number }>,
    ttl: number = 4 * 60 * 60
  ): Promise<void> {
    try {
      const key = `similarity:room:${roomId}`
      await this.redis.setex(key, ttl, JSON.stringify(similarities))
    } catch (error) {
      this.logger.error('Error caching similarity matrix:', error)
    }
  }

  /**
   * 📈 Get cached similarity matrix
   */
  async getCachedSimilarityMatrix(
    roomId: number
  ): Promise<Array<{ roomId: number; score: number }> | null> {
    try {
      const cached = await this.redis.get(`similarity:room:${roomId}`)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      this.logger.error('Error getting cached similarity matrix:', error)
      return null
    }
  }

  /**
   * 📊 Track cache metrics
   */
  private async trackCacheMetrics(
    operation: 'hit' | 'miss' | 'set',
    method: RecommendationMethod
  ): Promise<void> {
    try {
      const key = `cache_metrics:${method}`
      await this.redis.hincrby(key, operation, 1)
      await this.redis.expire(key, 24 * 60 * 60) // Expire daily
    } catch (error) {
      // Non-critical, just log
      this.logger.warn('Error tracking cache metrics:', error)
    }
  }

  /**
   * 📈 Get cache statistics
   */
  async getCacheStats(): Promise<Record<string, any>> {
    try {
      const methods = Object.values(RecommendationMethod)
      const stats: Record<string, any> = {}

      for (const method of methods) {
        const key = `cache_metrics:${method}`
        const methodStats = await this.redis.hgetall(key)
        stats[method] = {
          hits: parseInt(methodStats.hit || '0'),
          misses: parseInt(methodStats.miss || '0'),
          sets: parseInt(methodStats.set || '0'),
        }

        // Calculate hit rate
        const total = stats[method].hits + stats[method].misses
        stats[method].hitRate = total > 0 ? stats[method].hits / total : 0
      }

      return stats
    } catch (error) {
      this.logger.error('Error getting cache stats:', error)
      return {}
    }
  }

  /**
   * 🔄 Warm up cache cho popular rooms
   */
  async warmUpCache(popularRoomIds: number[]): Promise<void> {
    try {
      this.logger.log(`Warming up cache for ${popularRoomIds.length} rooms`)

      // This would be called by a background job
      // Implementation depends on your specific needs
      for (const roomId of popularRoomIds.slice(0, 10)) {
        // Only warm up top 10
        const key = `cache_warmup:${roomId}`
        await this.redis.setex(key, 60, 'warming') // Prevent duplicate warmup
      }
    } catch (error) {
      this.logger.error('Error warming up cache:', error)
    }
  }

  /**
   * 🧹 Clean up expired cache keys
   */
  async cleanupExpiredKeys(): Promise<void> {
    try {
      // Redis handles TTL automatically, but we can clean up our metrics
      const keys = await this.redis.keys('cache_metrics:*')
      for (const key of keys) {
        const ttl = await this.redis.ttl(key)
        if (ttl < 0) {
          // Key exists but has no expiry, set one
          await this.redis.expire(key, 24 * 60 * 60)
        }
      }
    } catch (error) {
      this.logger.error('Error cleaning up cache:', error)
    }
  }

  /**
   * 🔧 Health check cho cache service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    details: any
  }> {
    try {
      const start = Date.now()
      await this.redis.ping()
      const latency = Date.now() - start

      const info = await this.redis.info('memory')
      const memoryUsed = info.match(/used_memory_human:(.+)/)?.[1]?.trim()

      return {
        status: 'healthy',
        details: {
          latency: `${latency}ms`,
          memoryUsed,
          connected: this.redis.status === 'ready',
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          connected: false,
        },
      }
    }
  }

  /**
   * 🚪 Graceful shutdown
   */
  async onApplicationShutdown(): Promise<void> {
    try {
      await this.redis.quit()
      this.logger.log('Redis connection closed gracefully')
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error)
    }
  }
}
