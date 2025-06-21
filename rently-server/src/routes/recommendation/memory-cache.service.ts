import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { LRUCache } from 'lru-cache'
import {
  GetRecommendationsResType,
  RecommendationMethod,
} from './recommendation.model'

interface CacheOptions {
  ttl: number // Time to live in milliseconds
  maxAge: number // Max age before stale
  allowStale: boolean
}

interface CacheEntry<T> {
  data: T
  createdAt: number
  expiresAt: number
  hitCount: number
  method: RecommendationMethod
}

@Injectable()
export class MemoryCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(MemoryCacheService.name)

  // L1 Cache: Ultra-fast memory cache
  private readonly l1Cache = new LRUCache<
    string,
    CacheEntry<GetRecommendationsResType>
  >({
    max: 1000, // Store 1000 recommendation sets
    ttl: 1000 * 60 * 10, // 10 minutes default TTL
    allowStale: true,
    updateAgeOnGet: true,
    noDeleteOnFetchRejection: true,
  })

  // L2 Cache: Longer-term cache for popular queries
  private readonly l2Cache = new LRUCache<
    string,
    CacheEntry<GetRecommendationsResType>
  >({
    max: 500, // Store 500 popular recommendation sets
    ttl: 1000 * 60 * 30, // 30 minutes TTL
    allowStale: true,
    updateAgeOnGet: true,
  })

  // Cache statistics
  private stats = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    totalRequests: 0,
    averageResponseTime: 0,
  }

  /**
   * 🚀 Get cached recommendations với multi-level caching
   */
  async getCachedRecommendations(
    roomId: number,
    userId?: number,
    method?: RecommendationMethod
  ): Promise<CacheEntry<GetRecommendationsResType> | null> {
    const startTime = Date.now()
    this.stats.totalRequests++

    const key = this.generateCacheKey(roomId, userId, method)

    // L1 Cache check (ultra-fast)
    const l1Entry = this.l1Cache.get(key)
    if (l1Entry && !this.isExpired(l1Entry)) {
      l1Entry.hitCount++
      this.stats.l1Hits++

      this.logger.debug(`L1 Cache HIT for key: ${key}`)
      return l1Entry
    }

    // L2 Cache check (fast)
    const l2Entry = this.l2Cache.get(key)
    if (l2Entry && !this.isExpired(l2Entry)) {
      l2Entry.hitCount++
      this.stats.l2Hits++

      // Promote to L1 cache
      this.l1Cache.set(key, l2Entry)

      this.logger.debug(`L2 Cache HIT for key: ${key}, promoted to L1`)
      return l2Entry
    }

    // Cache miss
    if (!l1Entry) this.stats.l1Misses++
    if (!l2Entry) this.stats.l2Misses++

    this.updateAverageResponseTime(Date.now() - startTime)
    return null
  }

  /**
   * 💾 Cache recommendations với intelligent TTL
   */
  async setCachedRecommendations(
    roomId: number,
    data: GetRecommendationsResType,
    userId?: number,
    method?: RecommendationMethod
  ): Promise<void> {
    const key = this.generateCacheKey(roomId, userId, method)
    const ttl = this.calculateTTL(method, data.data.length)

    const entry: CacheEntry<GetRecommendationsResType> = {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      hitCount: 0,
      method: method || RecommendationMethod.HYBRID,
    }

    // Store in L1 cache
    this.l1Cache.set(key, entry, { ttl })

    // Store popular/good quality results in L2 cache
    if (this.shouldCacheInL2(data, method)) {
      this.l2Cache.set(key, entry, { ttl: ttl * 2 }) // Longer TTL for L2
    }

    this.logger.debug(
      `Cached recommendations for key: ${key}, TTL: ${ttl}ms, L2: ${this.shouldCacheInL2(data, method)}`
    )
  }

  /**
   * 🗑️ Smart cache invalidation
   */
  invalidateRoomCache(roomId: number): void {
    const pattern = `room:${roomId}:`
    let invalidatedCount = 0

    // Invalidate L1 cache
    for (const key of this.l1Cache.keys()) {
      if (key.includes(pattern)) {
        this.l1Cache.delete(key)
        invalidatedCount++
      }
    }

    // Invalidate L2 cache
    for (const key of this.l2Cache.keys()) {
      if (key.includes(pattern)) {
        this.l2Cache.delete(key)
        invalidatedCount++
      }
    }

    this.logger.log(
      `Invalidated ${invalidatedCount} cache entries for room ${roomId}`
    )
  }

  /**
   * 👤 Invalidate user-specific cache
   */
  invalidateUserCache(userId: number): void {
    const pattern = `user:${userId}:`
    let invalidatedCount = 0

    for (const key of this.l1Cache.keys()) {
      if (key.includes(pattern)) {
        this.l1Cache.delete(key)
        invalidatedCount++
      }
    }

    for (const key of this.l2Cache.keys()) {
      if (key.includes(pattern)) {
        this.l2Cache.delete(key)
        invalidatedCount++
      }
    }

    this.logger.log(
      `Invalidated ${invalidatedCount} cache entries for user ${userId}`
    )
  }

  /**
   * 📊 Get cache statistics
   */
  getCacheStats() {
    const l1Stats = {
      size: this.l1Cache.size,
      max: this.l1Cache.max,
      hitRate:
        (this.stats.l1Hits / (this.stats.l1Hits + this.stats.l1Misses)) * 100,
    }

    const l2Stats = {
      size: this.l2Cache.size,
      max: this.l2Cache.max,
      hitRate:
        (this.stats.l2Hits / (this.stats.l2Hits + this.stats.l2Misses)) * 100,
    }

    return {
      l1: l1Stats,
      l2: l2Stats,
      overall: {
        totalRequests: this.stats.totalRequests,
        totalHits: this.stats.l1Hits + this.stats.l2Hits,
        totalMisses: this.stats.l1Misses + this.stats.l2Misses,
        hitRate:
          ((this.stats.l1Hits + this.stats.l2Hits) / this.stats.totalRequests) *
          100,
        averageResponseTime: this.stats.averageResponseTime,
      },
    }
  }

  /**
   * 🧹 Clear cache (for testing/admin)
   */
  clearCache(): void {
    this.l1Cache.clear()
    this.l2Cache.clear()
    this.resetStats()
    this.logger.log('All cache cleared')
  }

  /**
   * 🔄 Preload popular rooms cache
   */
  async preloadPopularRooms(popularRoomIds: number[]): Promise<void> {
    this.logger.log(
      `Preloading cache for ${popularRoomIds.length} popular rooms`
    )

    // Create placeholder entries để avoid cache stampede
    for (const roomId of popularRoomIds) {
      const key = this.generateCacheKey(
        roomId,
        undefined,
        RecommendationMethod.POPULARITY
      )

      // Set a very short-lived placeholder
      const placeholder: CacheEntry<GetRecommendationsResType> = {
        data: { data: [], metadata: {} as any },
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000, // 1 second placeholder
        hitCount: 0,
        method: RecommendationMethod.POPULARITY,
      }

      this.l1Cache.set(key, placeholder, { ttl: 1000 })
    }
  }

  // Private helper methods
  private generateCacheKey(
    roomId: number,
    userId?: number,
    method?: RecommendationMethod
  ): string {
    const userPart = userId ? `user:${userId}` : 'anonymous'
    const methodPart = method || 'hybrid'
    return `room:${roomId}:${userPart}:${methodPart}`
  }

  private calculateTTL(
    method?: RecommendationMethod,
    resultCount?: number
  ): number {
    const baseTTL = {
      [RecommendationMethod.CONTENT_BASED]: 1000 * 60 * 15, // 15 minutes
      [RecommendationMethod.COLLABORATIVE]: 1000 * 60 * 10, // 10 minutes
      [RecommendationMethod.POPULARITY]: 1000 * 60 * 20, // 20 minutes
      [RecommendationMethod.LOCATION_BASED]: 1000 * 60 * 30, // 30 minutes
      [RecommendationMethod.HYBRID]: 1000 * 60 * 12, // 12 minutes
    }

    const methodTTL = baseTTL[method || RecommendationMethod.HYBRID]

    // Longer TTL for better results
    const qualityMultiplier = resultCount && resultCount > 5 ? 1.5 : 1.0

    return Math.floor(methodTTL * qualityMultiplier)
  }

  private shouldCacheInL2(
    data: GetRecommendationsResType,
    method?: RecommendationMethod
  ): boolean {
    // Cache in L2 if:
    // 1. Has good number of results (>= 3)
    // 2. Execution time is reasonable (< 500ms)
    // 3. Method is stable (not experimental)

    const hasGoodResults = data.data.length >= 3
    const reasonableExecutionTime = (data.metadata.executionTime || 0) < 500
    const stableMethod = method !== RecommendationMethod.COLLABORATIVE // Collaborative can be volatile

    return hasGoodResults && reasonableExecutionTime && stableMethod
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt
  }

  private updateAverageResponseTime(responseTime: number): void {
    // Simple moving average
    const alpha = 0.1 // Smoothing factor
    this.stats.averageResponseTime =
      (1 - alpha) * this.stats.averageResponseTime + alpha * responseTime
  }

  private resetStats(): void {
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      totalRequests: 0,
      averageResponseTime: 0,
    }
  }

  onModuleDestroy() {
    this.clearCache()
    this.logger.log('Memory cache service destroyed')
  }
}
