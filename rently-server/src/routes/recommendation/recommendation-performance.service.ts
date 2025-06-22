import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { RecommendationCacheService } from './recommendation-cache.service'
import { RecommendationRepo } from './recommendation.repo'

interface PerformanceMetrics {
  avgResponseTime: number
  cacheHitRate: number
  queryCount: number
  errorRate: number
  topSlowQueries: Array<{
    method: string
    avgTime: number
    count: number
  }>
}

@Injectable()
export class RecommendationPerformanceService {
  private readonly logger = new Logger(RecommendationPerformanceService.name)
  private readonly metrics = new Map<string, any>()

  constructor(
    private readonly cacheService: RecommendationCacheService,
    private readonly recommendationRepo: RecommendationRepo
  ) {}

  /**
   * 📊 Track query performance
   */
  async trackQueryPerformance(data: {
    method: string
    executionTime: number
    resultCount: number
    cacheHit: boolean
    roomId: number
    userId?: number
  }): Promise<void> {
    try {
      const key = `perf:${data.method}:${new Date().toISOString().slice(0, 10)}`

      const existing = this.metrics.get(key) || {
        totalTime: 0,
        count: 0,
        cacheHits: 0,
        errors: 0,
        slowQueries: [],
      }

      existing.totalTime += data.executionTime
      existing.count += 1
      if (data.cacheHit) existing.cacheHits += 1

      // Track slow queries (>1000ms)
      if (data.executionTime > 1000) {
        existing.slowQueries.push({
          method: data.method,
          time: data.executionTime,
          roomId: data.roomId,
          timestamp: new Date(),
        })
      }

      this.metrics.set(key, existing)

      // Log warning cho slow queries
      if (data.executionTime > 2000) {
        this.logger.warn(
          `Slow recommendation query detected: ${data.method} took ${data.executionTime}ms for room ${data.roomId}`
        )
      }
    } catch (error) {
      this.logger.error('Error tracking query performance:', error)
    }
  }

  /**
   * 📈 Get performance statistics
   */
  async getPerformanceStats(days: number = 7): Promise<PerformanceMetrics> {
    try {
      const stats: PerformanceMetrics = {
        avgResponseTime: 0,
        cacheHitRate: 0,
        queryCount: 0,
        errorRate: 0,
        topSlowQueries: [],
      }

      let totalTime = 0
      let totalCount = 0
      let totalCacheHits = 0
      let totalErrors = 0
      const slowQueries: any[] = []

      // Aggregate metrics from the last N days
      for (const [key, data] of this.metrics.entries()) {
        if (this.isWithinDays(key, days)) {
          totalTime += data.totalTime
          totalCount += data.count
          totalCacheHits += data.cacheHits
          totalErrors += data.errors
          slowQueries.push(...data.slowQueries)
        }
      }

      if (totalCount > 0) {
        stats.avgResponseTime = Math.round(totalTime / totalCount)
        stats.cacheHitRate =
          Math.round((totalCacheHits / totalCount) * 100) / 100
        stats.queryCount = totalCount
        stats.errorRate = Math.round((totalErrors / totalCount) * 100) / 100
      }

      // Group slow queries by method
      const slowQueriesByMethod = slowQueries.reduce((acc, query) => {
        if (!acc[query.method]) {
          acc[query.method] = { totalTime: 0, count: 0 }
        }
        acc[query.method].totalTime += query.time
        acc[query.method].count += 1
        return acc
      }, {})

      stats.topSlowQueries = Object.entries(slowQueriesByMethod)
        .map(([method, data]: [string, any]) => ({
          method,
          avgTime: Math.round(data.totalTime / data.count),
          count: data.count,
        }))
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 5)

      return stats
    } catch (error) {
      this.logger.error('Error getting performance stats:', error)
      return {
        avgResponseTime: 0,
        cacheHitRate: 0,
        queryCount: 0,
        errorRate: 0,
        topSlowQueries: [],
      }
    }
  }

  /**
   * 🧹 Cleanup old metrics (daily job)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldMetrics(): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 30) // Keep 30 days

      let deletedCount = 0
      for (const key of this.metrics.keys()) {
        if (this.isOlderThan(key, cutoffDate)) {
          this.metrics.delete(key)
          deletedCount++
        }
      }

      this.logger.log(`Cleaned up ${deletedCount} old performance metrics`)
    } catch (error) {
      this.logger.error('Error cleaning up old metrics:', error)
    }
  }

  /**
   * 🔄 Cache warm-up job (runs every 4 hours)
   */
  @Cron('0 */4 * * *')
  async warmUpPopularRooms(): Promise<void> {
    try {
      this.logger.log('Starting cache warm-up for popular rooms...')

      // Get top 20 popular rooms
      const popularRooms = await this.recommendationRepo.getPopularRooms(0, 20)
      const popularRoomIds = popularRooms.map(room => room.id)

      await this.cacheService.warmUpCache(popularRoomIds)

      this.logger.log(
        `Cache warm-up completed for ${popularRoomIds.length} rooms`
      )
    } catch (error) {
      this.logger.error('Error during cache warm-up:', error)
    }
  }

  /**
   * 📊 Generate daily performance report
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async generateDailyReport(): Promise<void> {
    try {
      const stats = await this.getPerformanceStats(1) // Yesterday's stats
      const cacheStats = await this.cacheService.getCacheStats()

      this.logger.log('📊 Daily Recommendation Performance Report', {
        date: new Date().toISOString().slice(0, 10),
        avgResponseTime: `${stats.avgResponseTime}ms`,
        cacheHitRate: `${(stats.cacheHitRate * 100).toFixed(1)}%`,
        totalQueries: stats.queryCount,
        errorRate: `${(stats.errorRate * 100).toFixed(2)}%`,
        slowQueries: stats.topSlowQueries.length,
        cacheStats,
      })

      // Alert if performance degrades
      if (stats.avgResponseTime > 1000) {
        this.logger.warn('⚠️  High average response time detected!')
      }

      if (stats.cacheHitRate < 0.7) {
        this.logger.warn('⚠️  Low cache hit rate detected!')
      }

      if (stats.errorRate > 0.05) {
        this.logger.warn('⚠️  High error rate detected!')
      }
    } catch (error) {
      this.logger.error('Error generating daily report:', error)
    }
  }

  /**
   * 🔧 Health check for recommendation system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: any
  }> {
    try {
      const stats = await this.getPerformanceStats(1)
      const cacheHealth = await this.cacheService.healthCheck()

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

      // Determine health status
      if (
        stats.avgResponseTime > 2000 ||
        stats.errorRate > 0.1 ||
        cacheHealth.status === 'unhealthy'
      ) {
        status = 'unhealthy'
      } else if (stats.avgResponseTime > 1000 || stats.cacheHitRate < 0.5) {
        status = 'degraded'
      }

      return {
        status,
        details: {
          performance: stats,
          cache: cacheHealth,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  /**
   * 🎯 Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    try {
      const recommendations: string[] = []
      const stats = await this.getPerformanceStats(7)

      if (stats.avgResponseTime > 1000) {
        recommendations.push('Consider optimizing slow database queries')
        recommendations.push('Review and add missing database indexes')
      }

      if (stats.cacheHitRate < 0.7) {
        recommendations.push('Increase cache TTL for stable data')
        recommendations.push('Implement cache pre-warming for popular content')
      }

      if (stats.topSlowQueries.length > 0) {
        recommendations.push(
          'Focus on optimizing these slow query methods: ' +
            stats.topSlowQueries.map(q => q.method).join(', ')
        )
      }

      if (recommendations.length === 0) {
        recommendations.push(
          'System is performing well - no optimization needed'
        )
      }

      return recommendations
    } catch (error) {
      this.logger.error('Error getting optimization recommendations:', error)
      return ['Unable to generate recommendations due to error']
    }
  }

  /**
   * 🕒 Helper: Check if key is within N days
   */
  private isWithinDays(key: string, days: number): boolean {
    try {
      const dateStr = key.split(':')[2] // Extract date from key
      const keyDate = new Date(dateStr)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      return keyDate >= cutoffDate
    } catch {
      return false
    }
  }

  /**
   * 🗓️ Helper: Check if key is older than date
   */
  private isOlderThan(key: string, cutoffDate: Date): boolean {
    try {
      const dateStr = key.split(':')[2]
      const keyDate = new Date(dateStr)
      return keyDate < cutoffDate
    } catch {
      return true // If can't parse, consider it old
    }
  }

  /**
   * 📊 Track optimization performance metrics
   */
  async trackOptimizationPerformance(data: {
    method: string
    optimizationType: 'early_termination' | 'geographic_bounding' | 'combined'
    candidatesReduced: number
    totalCandidates: number
    processedCandidates: number
    executionTime: number
    roomId: number
    userId?: number
  }): Promise<void> {
    try {
      const key = `opt:${data.optimizationType}:${new Date().toISOString().slice(0, 10)}`

      const existing = this.metrics.get(key) || {
        totalQueries: 0,
        totalCandidatesReduced: 0,
        totalCandidatesOriginal: 0,
        totalCandidatesProcessed: 0,
        totalExecutionTime: 0,
        averageReductionRate: 0,
        averageProcessingRate: 0,
      }

      existing.totalQueries += 1
      existing.totalCandidatesReduced += data.candidatesReduced
      existing.totalCandidatesOriginal += data.totalCandidates
      existing.totalCandidatesProcessed += data.processedCandidates
      existing.totalExecutionTime += data.executionTime

      // Calculate rates
      existing.averageReductionRate =
        (existing.totalCandidatesReduced / existing.totalCandidatesOriginal) *
        100
      existing.averageProcessingRate =
        (existing.totalCandidatesProcessed / existing.totalCandidatesOriginal) *
        100

      this.metrics.set(key, existing)

      // Log significant optimizations
      if (data.candidatesReduced > data.totalCandidates * 0.5) {
        this.logger.log(
          `🚀 Significant optimization: ${data.optimizationType} reduced ` +
            `${data.candidatesReduced}/${data.totalCandidates} candidates ` +
            `(${((data.candidatesReduced / data.totalCandidates) * 100).toFixed(1)}%)`
        )
      }
    } catch (error) {
      this.logger.error('Error tracking optimization performance:', error)
    }
  }

  /**
   * 📈 Get optimization statistics
   */
  async getOptimizationStats(days: number = 7): Promise<{
    earlyTermination: any
    geographicBounding: any
    combined: any
  }> {
    try {
      const stats = {
        earlyTermination: this.getOptimizationStatsByType(
          'early_termination',
          days
        ),
        geographicBounding: this.getOptimizationStatsByType(
          'geographic_bounding',
          days
        ),
        combined: this.getOptimizationStatsByType('combined', days),
      }

      return stats
    } catch (error) {
      this.logger.error('Error getting optimization stats:', error)
      return {
        earlyTermination: null,
        geographicBounding: null,
        combined: null,
      }
    }
  }

  private getOptimizationStatsByType(type: string, days: number) {
    let totalQueries = 0
    let totalReduced = 0
    let totalOriginal = 0
    let totalProcessed = 0
    let totalTime = 0

    for (const [key, data] of this.metrics.entries()) {
      if (key.includes(`opt:${type}:`) && this.isWithinDays(key, days)) {
        totalQueries += data.totalQueries || 0
        totalReduced += data.totalCandidatesReduced || 0
        totalOriginal += data.totalCandidatesOriginal || 0
        totalProcessed += data.totalCandidatesProcessed || 0
        totalTime += data.totalExecutionTime || 0
      }
    }

    return {
      totalQueries,
      averageReductionRate:
        totalOriginal > 0 ? (totalReduced / totalOriginal) * 100 : 0,
      averageProcessingRate:
        totalOriginal > 0 ? (totalProcessed / totalOriginal) * 100 : 0,
      averageExecutionTime: totalQueries > 0 ? totalTime / totalQueries : 0,
      candidatesSaved: totalReduced,
      efficiencyGain:
        totalOriginal > 0
          ? ((totalOriginal - totalProcessed) / totalOriginal) * 100
          : 0,
    }
  }
}
