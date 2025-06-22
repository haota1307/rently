import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { RecommendationRepo } from './recommendation.repo'
import { RecommendationCacheService } from './recommendation-cache.service'
import { RecommendationPerformanceService } from './recommendation-performance.service'
import { MemoryCacheService } from './memory-cache.service'
import { Decimal } from '@prisma/client/runtime/library'
import { ChatbotOpenAIService } from '../chatbot/services/openai.service'
import {
  GetRecommendationsQueryType,
  GetRecommendationsResType,
  RecommendedRoomType,
  RecommendationMethod,
  SimilarityWeightsType,
  TrackRecommendationClickType,
  SimilarityBreakdownType,
  RecommendationExplanationType,
} from './recommendation.model'

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name)

  // 🧠 Smart calculation cache for performance
  private readonly distanceCache = new Map<string, number>()
  private readonly similarityCache = new Map<string, SimilarityBreakdownType>()
  private readonly cacheExpiry = 10 * 60 * 1000 // 10 minutes

  constructor(
    private readonly recommendationRepo: RecommendationRepo,
    private readonly cacheService: RecommendationCacheService,
    private readonly performanceService: RecommendationPerformanceService,
    private readonly memoryCacheService: MemoryCacheService,
    private readonly openaiService: ChatbotOpenAIService
  ) {}

  private convertToNumber(value: number | Decimal): number {
    return value instanceof Decimal ? value.toNumber() : value
  }

  async getRecommendations(
    query: GetRecommendationsQueryType,
    userId?: number
  ): Promise<GetRecommendationsResType> {
    const startTime = Date.now()

    try {
      // 🚀 Check L1 Memory Cache first (ultra-fast)
      const selectedMethod = await this.selectOptimalMethod(
        query.method,
        query.roomId,
        userId
      )

      const memoryCached =
        await this.memoryCacheService.getCachedRecommendations(
          query.roomId,
          userId,
          selectedMethod
        )
      if (memoryCached) {
        // 📊 Track memory cache hit performance
        await this.performanceService.trackQueryPerformance({
          method: selectedMethod,
          executionTime: Date.now() - startTime,
          resultCount: memoryCached.data.data.length,
          cacheHit: true,
          roomId: query.roomId,
          userId,
        })

        this.logger.log(
          `Memory Cache HIT for room ${query.roomId}, method ${selectedMethod}`
        )

        // 🎯 RESPONSE OPTIMIZATION: Compress and optimize response
        return this.optimizeResponse(memoryCached.data)
      }

      // 🚀 Check L2 Redis Cache if memory cache miss
      const cacheKey = this.cacheService.generateCacheKey(
        selectedMethod,
        query.roomId,
        userId
      )

      const cachedResult =
        await this.cacheService.getCachedRecommendations(cacheKey)
      if (cachedResult) {
        // 📊 Track cache hit performance
        await this.performanceService.trackQueryPerformance({
          method: selectedMethod,
          executionTime: Date.now() - startTime,
          resultCount: cachedResult.data.length,
          cacheHit: true,
          roomId: query.roomId,
          userId,
        })

        // Promote to memory cache for next time
        await this.memoryCacheService.setCachedRecommendations(
          query.roomId,
          cachedResult,
          userId,
          selectedMethod
        )

        this.logger.log(
          `Redis Cache HIT for room ${query.roomId}, method ${selectedMethod} (promoted to memory)`
        )

        // 🎯 RESPONSE OPTIMIZATION: Compress and optimize response
        return this.optimizeResponse(cachedResult)
      }
      const targetRoom = await this.recommendationRepo.getRoomDetails(
        query.roomId
      )
      if (!targetRoom) {
        throw new NotFoundException(`Room with ID ${query.roomId} not found`)
      }

      // Log warning nếu room không available để tracking
      if (!targetRoom.isAvailable) {
        this.logger.warn(
          `Getting recommendations for unavailable room ${query.roomId}. Room may have been rented.`
        )
      }

      let recommendations: RecommendedRoomType[]

      switch (selectedMethod) {
        case RecommendationMethod.CONTENT_BASED:
          recommendations = await this.getContentBasedRecommendations(
            targetRoom,
            query,
            userId
          )
          break
        case RecommendationMethod.POPULARITY:
          recommendations = await this.getPopularityBasedRecommendations(
            targetRoom,
            query
          )
          break
        case RecommendationMethod.LOCATION_BASED:
          recommendations = await this.getLocationBasedRecommendations(
            targetRoom,
            query,
            userId
          )
          break
        case RecommendationMethod.HYBRID:
          recommendations = await this.getHybridRecommendations(
            targetRoom,
            query,
            userId
          )
          break
        case RecommendationMethod.COLLABORATIVE:
          recommendations = await this.getCollaborativeRecommendations(
            targetRoom,
            query,
            userId
          )
          break
        default:
          recommendations = await this.getContentBasedRecommendations(
            targetRoom,
            query,
            userId
          )
      }

      const executionTime = Date.now() - startTime
      const weights = await this.recommendationRepo.getRecommendationWeights()

      const result: GetRecommendationsResType = {
        data: recommendations,
        metadata: {
          totalCandidates: recommendations.length,
          method: selectedMethod,
          executionTime,
          weights,
          targetRoom: {
            id: targetRoom.id,
            title: targetRoom.title,
            price: this.convertToNumber(targetRoom.price),
            area: this.convertToNumber(targetRoom.area),
            isAvailable: targetRoom.isAvailable,
          },
        },
      }

      // 💾 Cache the result in both memory and Redis for future requests
      await this.cacheService.setCachedRecommendations(cacheKey, result)
      await this.memoryCacheService.setCachedRecommendations(
        query.roomId,
        result,
        userId,
        selectedMethod
      )

      // 📊 Track performance metrics
      await this.performanceService.trackQueryPerformance({
        method: selectedMethod,
        executionTime,
        resultCount: recommendations.length,
        cacheHit: false,
        roomId: query.roomId,
        userId,
      })

      this.logger.log(
        `🎯 Recommendations generated: ${recommendations.length} rooms in ${executionTime}ms (method: ${selectedMethod})`
      )

      // 🎯 RESPONSE OPTIMIZATION: Compress and optimize response
      return this.optimizeResponse(result)
    } catch (error) {
      this.logger.error('Error getting recommendations:', error)
      throw error
    }
  }

  /**
   * 🎯 RESPONSE OPTIMIZATION - Reduce payload size and optimize JSON
   */
  private optimizeResponse(
    response: GetRecommendationsResType
  ): GetRecommendationsResType {
    return {
      data: response.data.map(room => ({
        ...room,
        // 🔧 Add distance to room level if it exists
        ...(room.rental?.distance !== undefined && {
          distance: Math.round(room.rental.distance * 1000) / 1000, // Round to 3 decimal places
        }),
        // 🔧 Truncate unnecessary data
        rental: {
          ...room.rental,
          // Remove heavy data that's not needed for UI
          rentalImages: room.rental.rentalImages?.slice(0, 2), // Max 2 images
          // Only truncate description if it exists
          ...((room.rental as any).description && {
            description:
              (room.rental as any).description.substring(0, 200) +
              ((room.rental as any).description.length > 200 ? '...' : ''),
          }),
        },
        roomImages: room.roomImages?.slice(0, 2), // Max 2 room images
        roomAmenities: room.roomAmenities?.slice(0, 5), // Max 5 amenities
        // Round numbers to 2 decimal places
        price: Math.round(room.price * 100) / 100,
        area: Math.round(room.area * 100) / 100,
        similarityScore: Math.round(room.similarityScore * 1000) / 1000,
      })),
      metadata: {
        ...response.metadata,
        // Optimize metadata
        executionTime: Math.round(response.metadata.executionTime),
        weights: {
          location: Math.round(response.metadata.weights.location * 100) / 100,
          price: Math.round(response.metadata.weights.price * 100) / 100,
          area: Math.round(response.metadata.weights.area * 100) / 100,
          amenities:
            Math.round(response.metadata.weights.amenities * 100) / 100,
        },
      },
    }
  }

  /**
   * 🎯 Content-based recommendations với Early Termination Algorithm
   */
  private async getContentBasedRecommendations(
    targetRoom: any,
    query: GetRecommendationsQueryType,
    userId?: number
  ): Promise<RecommendedRoomType[]> {
    const startTime = Date.now()

    // 🚀 Use parallel data fetching for maximum performance
    const { candidateRooms, weights } =
      await this.recommendationRepo.getRecommendationDataParallel(
        targetRoom.id,
        query,
        userId
      )

    this.logger.debug(
      `🔥 Content-based: Processing ${candidateRooms.length} candidates for room ${targetRoom.id}`
    )

    // 🎯 Apply early termination algorithm for faster processing
    const recommendations = await this.applyEarlyTerminationAlgorithm(
      targetRoom,
      candidateRooms,
      weights,
      query
    )

    const executionTime = Date.now() - startTime
    this.logger.debug(
      `✅ Content-based completed: ${recommendations.length} recommendations in ${executionTime}ms`
    )

    return recommendations
  }

  /**
   * 🚀 Early Termination Algorithm - Core optimization
   */
  private async applyEarlyTerminationAlgorithm(
    targetRoom: any,
    candidateRooms: any[],
    weights: SimilarityWeightsType,
    query: GetRecommendationsQueryType
  ): Promise<RecommendedRoomType[]> {
    const startTime = Date.now()
    const results: Array<any> = []
    const processedCount = { value: 0 }
    const earlySkipCount = { value: 0 }

    const maxCandidates = query.limit * 3 // Dynamic threshold
    const scoreThreshold = 0.25 // Skip rooms with very low similarity
    const excellentThreshold = 0.9 // Excellent recommendation threshold

    this.logger.debug(
      `🎯 Early termination: Processing up to ${maxCandidates} candidates`
    )

    // 🚀 PARALLEL BATCH PROCESSING for better performance
    const batchSize = 20 // Process 20 rooms at a time
    const totalBatches = Math.ceil(candidateRooms.length / batchSize)

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize
      const batchEnd = Math.min(batchStart + batchSize, candidateRooms.length)
      const batch = candidateRooms.slice(batchStart, batchEnd)

      // 🔥 Process batch in parallel
      const batchPromises = batch.map(candidateRoom => {
        processedCount.value++

        // 🚀 OPTIMIZED: Use pre-computed distance to university
        const distanceToUniversity = this.convertToNumber(
          candidateRoom.rental.distance || 0
        )

        // Skip if too far (beyond maxDistance) - distance already in km
        if (distanceToUniversity > query.maxDistance / 1000) {
          // Convert maxDistance from meters to km
          earlySkipCount.value++
          return null
        }

        // Calculate full similarity
        const similarity = this.calculateContentSimilarityCached(
          targetRoom,
          candidateRoom,
          weights,
          query
        )

        // 🎯 Early skip low-quality matches
        if (similarity.overall < scoreThreshold) {
          earlySkipCount.value++
          return null
        }

        // 🏠 Create recommended room object
        const recommendedRoom: RecommendedRoomType = {
          ...this.recommendationRepo.formatRoom(candidateRoom),
          similarityScore: similarity.overall,
          method: RecommendationMethod.CONTENT_BASED,
          explanation: this.generateContentBasedExplanation(
            targetRoom,
            candidateRoom,
            similarity,
            distanceToUniversity
          ),
          similarityBreakdown: similarity,
          rank: 0, // Will be set after sorting
          rental: {
            ...candidateRoom.rental,
            distance: distanceToUniversity, // 🔧 Distance to university in km
          },
        }

        return recommendedRoom
      })

      // Wait for batch completion and collect results
      const batchResults = (await Promise.all(batchPromises)).filter(Boolean)
      results.push(...batchResults)

      // 🎯 EARLY TERMINATION CONDITIONS
      const executionTime = Date.now() - startTime
      const excellentResults = results.filter(
        r => r.similarityScore >= excellentThreshold
      )

      // Condition 1: Enough excellent results
      if (excellentResults.length >= query.limit) {
        this.logger.debug(
          `✅ Early termination: Found ${excellentResults.length} excellent results`
        )
        break
      }

      // Condition 2: Processed enough candidates
      if (processedCount.value >= maxCandidates) {
        this.logger.debug(
          `✅ Early termination: Processed ${processedCount.value} candidates (limit reached)`
        )
        break
      }

      // Condition 3: Good results + time limit
      if (results.length >= query.limit && executionTime > 500) {
        this.logger.debug(
          `✅ Early termination: Time limit (${executionTime}ms) with ${results.length} results`
        )
        break
      }

      // Condition 4: Diminishing returns
      if (results.length >= query.limit * 2 && executionTime > 300) {
        this.logger.debug(
          `✅ Early termination: Diminishing returns after ${executionTime}ms`
        )
        break
      }
    }

    // 📊 Optimization tracking
    const finalExecutionTime = Date.now() - startTime
    const reductionPercentage = (
      ((candidateRooms.length - processedCount.value) / candidateRooms.length) *
      100
    ).toFixed(1)

    this.logger.debug(
      `🎯 Early termination stats: ${processedCount.value}/${candidateRooms.length} processed ` +
        `(${reductionPercentage}% reduction), ${earlySkipCount.value} early skips, ${finalExecutionTime}ms`
    )

    // 🎯 Final sorting and limiting with diversity
    return this.diversifyAndSortResults(results, query.limit)
  }

  private async getPopularityBasedRecommendations(
    targetRoom: any,
    query: GetRecommendationsQueryType
  ): Promise<RecommendedRoomType[]> {
    const popularRooms = await this.recommendationRepo.getPopularRooms(
      targetRoom.id,
      query.limit
    )

    return popularRooms.map((room, index) => {
      // Use pre-computed distance to university
      const distanceToUniversity = this.convertToNumber(
        room.rental?.distance || 0
      )

      return {
        ...this.recommendationRepo.formatRoom(room),
        similarityScore: 0.5,
        method: RecommendationMethod.POPULARITY,
        explanation: {
          reasons: [
            'Phòng trọ phổ biến được nhiều người quan tâm',
            distanceToUniversity < 0.5
              ? `Rất gần Đại học Nam Cần Thơ (${Math.round(distanceToUniversity * 1000)}m)`
              : distanceToUniversity < 2
                ? `Gần Đại học Nam Cần Thơ (${distanceToUniversity.toFixed(1)}km)`
                : `Cách Đại học Nam Cần Thơ ${distanceToUniversity.toFixed(1)}km`,
          ],
          distance: Math.round(distanceToUniversity * 1000),
          priceDifference: undefined,
          areaDifference: undefined,
          commonAmenities: [],
        },
        similarityBreakdown: {
          location: 0,
          price: 0,
          area: 0,
          amenities: 0,
          overall: 0.5,
        },
        rank: index + 1,
        rental: {
          ...room.rental,
          distance: distanceToUniversity, // Pre-computed distance to university
        },
      }
    })
  }

  /**
   * 🗺️ Location-based recommendations với Geographic Optimization
   */
  private async getLocationBasedRecommendations(
    targetRoom: any,
    query: GetRecommendationsQueryType,
    userId?: number
  ): Promise<RecommendedRoomType[]> {
    // 🚀 Use optimized candidate fetching với tighter geographic constraints
    const optimizedQuery = {
      ...query,
      maxDistance: Math.min(query.maxDistance, 3000), // Giới hạn 3km cho location-based
    }

    const candidateRooms =
      await this.recommendationRepo.getCandidateRoomsOptimized(
        targetRoom.id,
        targetRoom,
        optimizedQuery,
        userId
      )

    if (candidateRooms.length === 0) {
      return []
    }

    // 🎯 Apply early termination với distance-first sorting
    const startTime = Date.now()
    const scoredRooms: RecommendedRoomType[] = []

    // Sort by distance to university first để ưu tiên phòng gần trường nhất
    candidateRooms.sort((a, b) => {
      const distA = this.convertToNumber(a.rental.distance || 0)
      const distB = this.convertToNumber(b.rental.distance || 0)
      return distA - distB
    })

    const MAX_DISTANCE_THRESHOLD = optimizedQuery.maxDistance
    let processedCount = 0
    const maxProcess = query.limit * 2 // Ít hơn so với content-based do đã sort theo distance

    for (const candidateRoom of candidateRooms) {
      if (scoredRooms.length >= query.limit && processedCount >= maxProcess) {
        break
      }

      // Use pre-computed distance to university
      const distanceToUniversity = this.convertToNumber(
        candidateRoom.rental.distance || 0
      )

      // Skip nếu quá xa (distance already in km)
      if (distanceToUniversity > MAX_DISTANCE_THRESHOLD / 1000) {
        continue
      }

      const locationScore = this.calculateLocationScore(
        distanceToUniversity,
        MAX_DISTANCE_THRESHOLD / 1000 // Convert to km
      )

      // Early skip nếu location score quá thấp
      if (locationScore < 0.3) {
        processedCount++
        continue
      }

      const recommendedRoom: RecommendedRoomType = {
        ...this.recommendationRepo.formatRoom(candidateRoom),
        similarityScore: locationScore,
        method: RecommendationMethod.LOCATION_BASED,
        explanation: {
          reasons: [
            `Cách Đại học Nam Cần Thơ ${distanceToUniversity.toFixed(1)}km`,
            distanceToUniversity < 0.5
              ? 'Rất gần trường, có thể đi bộ'
              : distanceToUniversity < 1.5
                ? 'Khoảng cách hợp lý đến trường'
                : 'Trong khu vực gần trường',
          ],
          distance: Math.round(distanceToUniversity * 1000),
        },
        similarityBreakdown: {
          location: locationScore,
          price: 0,
          area: 0,
          amenities: 0,
          overall: locationScore,
        },
        rank: 0,
        rental: {
          ...candidateRoom.rental,
          distance: distanceToUniversity,
        },
      }

      scoredRooms.push(recommendedRoom)
      processedCount++
    }

    const finalResults = scoredRooms
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, query.limit)
      .map((room, index) => ({ ...room, rank: index + 1 }))

    const executionTime = Date.now() - startTime
    this.logger.log(
      `🗺️ Location-based optimization: ${finalResults.length} rooms ` +
        `(processed ${processedCount}/${candidateRooms.length}) in ${executionTime}ms`
    )

    return finalResults
  }

  private calculateDistanceCached(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const cacheKey = `${lat1.toFixed(6)},${lng1.toFixed(6)}-${lat2.toFixed(6)},${lng2.toFixed(6)}`

    // Check cache first
    const cached = this.distanceCache.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    // Calculate and cache
    const distance = this.calculateDistance(lat1, lng1, lat2, lng2)
    this.distanceCache.set(cacheKey, distance)

    // 🧹 Cache cleanup when too large
    if (this.distanceCache.size > 1000) {
      const firstKey = this.distanceCache.keys().next().value
      this.distanceCache.delete(firstKey)
    }

    return distance
  }

  private calculateContentSimilarityCached(
    targetRoom: any,
    candidateRoom: any,
    weights: SimilarityWeightsType,
    query: GetRecommendationsQueryType
  ): SimilarityBreakdownType {
    const cacheKey = `${targetRoom.id}-${candidateRoom.id}-${JSON.stringify(weights)}`

    // Check cache first
    const cached = this.similarityCache.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    // Calculate and cache
    const similarity = this.calculateContentSimilarity(
      targetRoom,
      candidateRoom,
      weights,
      query
    )
    this.similarityCache.set(cacheKey, similarity)

    // 🧹 Cache cleanup
    if (this.similarityCache.size > 500) {
      const firstKey = this.similarityCache.keys().next().value
      this.similarityCache.delete(firstKey)
    }

    return similarity
  }

  /**
   * 🎯 Core similarity calculation method
   */
  private calculateContentSimilarity(
    targetRoom: any,
    candidateRoom: any,
    weights: SimilarityWeightsType,
    query: GetRecommendationsQueryType
  ): SimilarityBreakdownType {
    // Use pre-computed distance to university for location scoring
    const distanceToUniversity = this.convertToNumber(
      candidateRoom.rental.distance || 0
    )

    // Calculate location score based on distance to university
    const locationScore = this.calculateLocationScore(
      distanceToUniversity,
      query.maxDistance / 1000 // Convert maxDistance to km
    )

    const priceScore = this.calculatePriceScore(
      this.convertToNumber(targetRoom.price),
      this.convertToNumber(candidateRoom.price),
      query.priceVariance
    )

    const areaScore = this.calculateAreaScore(
      this.convertToNumber(targetRoom.area),
      this.convertToNumber(candidateRoom.area),
      query.areaVariance
    )

    const amenitiesScore = this.calculateAmenitiesScore(
      targetRoom.roomAmenities,
      candidateRoom.roomAmenities
    )

    const overall =
      weights.location * locationScore +
      weights.price * priceScore +
      weights.area * areaScore +
      weights.amenities * amenitiesScore

    return {
      location: Math.round(locationScore * 100) / 100,
      price: Math.round(priceScore * 100) / 100,
      area: Math.round(areaScore * 100) / 100,
      amenities: Math.round(amenitiesScore * 100) / 100,
      overall: Math.round(overall * 100) / 100,
    }
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371 // 🔧 Earth radius in KILOMETERS (not meters)
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Returns distance in KILOMETERS
  }

  private calculateLocationScore(
    distance: number,
    maxDistance: number
  ): number {
    // 🔧 Update thresholds for KILOMETERS
    if (distance <= 0.5) return 1.0 // Within 500m
    if (distance >= maxDistance) return 0.0
    return Math.max(0, 1 - (distance - 0.5) / (maxDistance - 0.5))
  }

  private calculatePriceScore(
    price1: number,
    price2: number,
    variance: number
  ): number {
    const priceDiff = Math.abs(price1 - price2)
    const avgPrice = (price1 + price2) / 2
    const relativeDiff = priceDiff / avgPrice

    if (relativeDiff <= variance * 0.5) return 1.0
    if (relativeDiff >= variance) return 0.0

    return Math.max(0, 1 - (relativeDiff - variance * 0.5) / (variance * 0.5))
  }

  private calculateAreaScore(
    area1: number,
    area2: number,
    variance: number
  ): number {
    const areaDiff = Math.abs(area1 - area2)
    const avgArea = (area1 + area2) / 2
    const relativeDiff = areaDiff / avgArea

    if (relativeDiff <= variance * 0.5) return 1.0
    if (relativeDiff >= variance) return 0.0

    return Math.max(0, 1 - (relativeDiff - variance * 0.5) / (variance * 0.5))
  }

  private calculateAmenitiesScore(
    amenities1: any[],
    amenities2: any[]
  ): number {
    const set1 = new Set(amenities1.map(a => a.amenityId))
    const set2 = new Set(amenities2.map(a => a.amenityId))

    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return union.size > 0 ? intersection.size / union.size : 0
  }

  private generateContentBasedExplanation(
    targetRoom: any,
    recommendedRoom: any,
    similarity: SimilarityBreakdownType,
    distanceToUniversity?: number
  ): RecommendationExplanationType {
    const explanations: string[] = []

    // Use pre-computed distance to university instead of calculating between rooms
    const distanceKm =
      distanceToUniversity ||
      this.convertToNumber(recommendedRoom.rental.distance || 0)

    if (similarity.location > 0.8) {
      if (distanceKm < 0.5) {
        explanations.push(
          `Rất gần Đại học Nam Cần Thơ (${Math.round(distanceKm * 1000)}m)`
        )
      } else if (distanceKm < 2) {
        explanations.push(
          `Gần Đại học Nam Cần Thơ (${distanceKm.toFixed(1)}km)`
        )
      } else {
        explanations.push(`Cùng khu vực với Đại học Nam Cần Thơ`)
      }
    }

    if (similarity.price > 0.8) {
      const targetPrice = this.convertToNumber(targetRoom.price)
      const recommendedPrice = this.convertToNumber(recommendedRoom.price)
      const priceDiff = Math.abs(targetPrice - recommendedPrice)
      const pricePercent = (priceDiff / targetPrice) * 100
      explanations.push(
        `Giá tương đương (chênh lệch ${Math.round(pricePercent)}%)`
      )
    }

    if (similarity.area > 0.8) {
      explanations.push(`Diện tích tương tự`)
    }

    const commonAmenities = this.getCommonAmenities(
      targetRoom.roomAmenities,
      recommendedRoom.roomAmenities
    )

    if (commonAmenities.length > 0) {
      explanations.push(`Cùng có ${commonAmenities.slice(0, 2).join(', ')}`)
    }

    if (explanations.length === 0) {
      explanations.push(`Phòng trọ phù hợp với sở thích của bạn`)
    }

    return {
      reasons: explanations,
      distance: Math.round(distanceKm * 1000),
      priceDifference: Math.abs(targetRoom.price - recommendedRoom.price),
      areaDifference: Math.abs(targetRoom.area - recommendedRoom.area),
      commonAmenities,
    }
  }

  private getCommonAmenities(amenities1: any[], amenities2: any[]): string[] {
    const set1 = new Map(amenities1.map(a => [a.amenityId, a.amenity.name]))
    const set2 = new Set(amenities2.map(a => a.amenityId))

    const commonAmenities: string[] = []
    set1.forEach((name, id) => {
      if (set2.has(id)) {
        commonAmenities.push(name)
      }
    })

    return commonAmenities
  }

  private diversifyAndSortResults(
    scoredRooms: any[],
    limit: number
  ): RecommendedRoomType[] {
    const sortedRooms = scoredRooms.sort(
      (a, b) => b.similarityScore - a.similarityScore
    )

    const diversified: RecommendedRoomType[] = []
    const seenRentals = new Set<number>()
    const priceRanges = new Set<string>()

    for (const room of sortedRooms) {
      if (diversified.length >= limit) break

      const rentalId = room.rental.id
      const priceRange = this.getPriceRange(room.price)

      if (
        diversified.length < limit * 0.7 ||
        !seenRentals.has(rentalId) ||
        !priceRanges.has(priceRange)
      ) {
        diversified.push(room)
        seenRentals.add(rentalId)
        priceRanges.add(priceRange)
      }
    }

    return diversified
  }

  private getPriceRange(price: number): string {
    if (price < 2000000) return 'low'
    if (price < 4000000) return 'medium'
    if (price < 6000000) return 'high'
    return 'premium'
  }

  private async selectOptimalMethod(
    preferredMethod: RecommendationMethod,
    roomId: number,
    userId?: number
  ): Promise<RecommendationMethod> {
    // Luôn sử dụng HYBRID để có kết quả tối ưu nhất
    // HYBRID sẽ tự động điều chỉnh trọng số dựa trên context
    return RecommendationMethod.HYBRID
  }

  async trackClick(data: TrackRecommendationClickType): Promise<void> {
    try {
      await this.recommendationRepo.trackRecommendationClick(data)
      this.logger.log(`Tracked recommendation click: ${data.targetRoomId}`)
    } catch (error) {
      this.logger.warn('Failed to track recommendation click:', error)
    }
  }

  /**
   * 🤝 COLLABORATIVE FILTERING IMPLEMENTATION
   * Gợi ý dựa trên hành vi của những user tương tự
   */
  private async getCollaborativeRecommendations(
    targetRoom: any,
    query: GetRecommendationsQueryType,
    userId?: number
  ): Promise<RecommendedRoomType[]> {
    if (!userId) {
      // Fallback to content-based if no user
      return this.getContentBasedRecommendations(targetRoom, query, userId)
    }

    try {
      // 1. Lấy interaction history của user hiện tại
      const currentUserInteractions =
        await this.recommendationRepo.getUserInteractions(userId)

      if (
        !currentUserInteractions ||
        this.getUserInteractionCount(currentUserInteractions) < 3
      ) {
        // Không đủ dữ liệu → fallback to content-based
        return this.getContentBasedRecommendations(targetRoom, query, userId)
      }

      // 2. Tìm những user có hành vi tương tự
      const similarUsers = await this.findSimilarUsers(
        userId,
        currentUserInteractions
      )

      if (similarUsers.length === 0) {
        return this.getContentBasedRecommendations(targetRoom, query, userId)
      }

      // 3. Lấy phòng mà similar users đã tương tác
      const candidateRooms = await this.getRecommendationsFromSimilarUsers(
        similarUsers,
        targetRoom.id,
        query.limit * 2
      )

      // 4. Tính collaborative score cho mỗi phòng
      const scoredRooms = candidateRooms.map(room => {
        const collaborativeScore = this.calculateCollaborativeScore(
          room,
          similarUsers,
          currentUserInteractions
        )

        // Use pre-computed distance to university for collaborative recommendations
        const distanceToUniversity = this.convertToNumber(
          room.rental.distance || 0
        )

        return {
          ...this.recommendationRepo.formatRoom(room),
          similarityScore: collaborativeScore.overall,
          method: RecommendationMethod.COLLABORATIVE,
          explanation: this.generateCollaborativeExplanation(
            room,
            collaborativeScore,
            similarUsers.length,
            distanceToUniversity
          ),
          similarityBreakdown: {
            location: 0,
            price: 0,
            area: 0,
            amenities: 0,
            overall: collaborativeScore.overall,
          },
          rank: 0,
          rental: {
            ...room.rental,
            distance: distanceToUniversity, // Add distance to rental object
          },
        }
      })

      // 5. Sắp xếp và lọc kết quả
      const sortedRooms = this.diversifyAndSortResults(scoredRooms, query.limit)

      return sortedRooms.map((room, index) => ({
        ...room,
        rank: index + 1,
      }))
    } catch (error) {
      this.logger.error('Error in collaborative filtering:', error)
      // Fallback to content-based on error
      return this.getContentBasedRecommendations(targetRoom, query, userId)
    }
  }

  /**
   * Tìm những user có hành vi tương tự
   */
  private async findSimilarUsers(
    userId: number,
    currentUserInteractions: any
  ): Promise<Array<{ userId: number; similarity: number; interactions: any }>> {
    try {
      // Lấy danh sách user khác có tương tác
      const otherUsers = await this.recommendationRepo.getActiveUsers(
        userId,
        100
      )

      const similarUsers: Array<{
        userId: number
        similarity: number
        interactions: any
      }> = []

      for (const otherUser of otherUsers) {
        const similarity = this.calculateUserSimilarity(
          currentUserInteractions,
          otherUser
        )

        if (similarity > 0.2) {
          // Ngưỡng tương đồng tối thiểu
          similarUsers.push({
            userId: otherUser.id,
            similarity,
            interactions: {
              favorites: (otherUser as any).favorites || [],
              tenantRentalRequests:
                (otherUser as any).tenantRentalRequests || [],
              tenantViewingSchedules:
                (otherUser as any).tenantViewingSchedules || [],
            },
          })
        }
      }

      // Sắp xếp theo độ tương đồng giảm dần
      return similarUsers
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 20) // Lấy top 20 similar users
    } catch (error) {
      this.logger.error('Error finding similar users:', error)
      return []
    }
  }

  /**
   * Tính độ tương đồng giữa 2 user dựa trên Jaccard similarity
   */
  private calculateUserSimilarity(userA: any, userB: any): number {
    try {
      // Lấy set các phòng mà user A đã tương tác
      const roomsA = new Set([
        ...userA.favorites.map((f: any) => f.post?.room?.id).filter(Boolean),
        ...userA.tenantViewingSchedules
          .map((v: any) => v.post.room?.id)
          .filter(Boolean),
        ...userA.tenantRentalRequests
          .map((r: any) => r.post.room?.id)
          .filter(Boolean),
      ])

      // Lấy set các phòng mà user B đã tương tác
      const roomsB = new Set([
        ...userB.favorites.map((f: any) => f.post?.room?.id).filter(Boolean),
        ...userB.tenantViewingSchedules
          .map((v: any) => v.post.room?.id)
          .filter(Boolean),
        ...userB.tenantRentalRequests
          .map((r: any) => r.post.room?.id)
          .filter(Boolean),
      ])

      // Tính Jaccard similarity
      const intersection = new Set([...roomsA].filter(x => roomsB.has(x)))
      const union = new Set([...roomsA, ...roomsB])

      if (union.size === 0) return 0

      const jaccardSimilarity = intersection.size / union.size

      // Bonus cho user có nhiều tương tác chung
      const interactionBonus = Math.min(intersection.size / 5, 0.2)

      return Math.min(jaccardSimilarity + interactionBonus, 1.0)
    } catch (error) {
      this.logger.error('Error calculating user similarity:', error)
      return 0
    }
  }

  /**
   * Lấy phòng được gợi ý từ similar users
   */
  private async getRecommendationsFromSimilarUsers(
    similarUsers: Array<{
      userId: number
      similarity: number
      interactions: any
    }>,
    excludeRoomId: number,
    limit: number
  ): Promise<any[]> {
    try {
      const roomScores = new Map<
        number,
        { room: any; score: number; count: number }
      >()

      // Duyệt qua từng similar user
      for (const similarUser of similarUsers) {
        const userWeight = similarUser.similarity

        // Lấy các phòng mà user này đã tương tác
        const interactedRooms = [
          ...similarUser.interactions.favorites.map((f: any) => ({
            room: f.post?.room,
            weight: 1.0, // favorite
          })),
          ...similarUser.interactions.tenantRentalRequests.map((r: any) => ({
            room: r.post?.room,
            weight: 2.0, // rental request (quan trọng hơn)
          })),
          ...similarUser.interactions.tenantViewingSchedules.map((v: any) => ({
            room: v.post?.room,
            weight: 1.5, // viewing schedule
          })),
        ].filter(item => item.room && item.room.id !== excludeRoomId)

        // Tính điểm cho mỗi phòng
        for (const { room, weight } of interactedRooms) {
          const roomId = room.id
          const score = userWeight * weight

          if (roomScores.has(roomId)) {
            const existing = roomScores.get(roomId)!
            roomScores.set(roomId, {
              room: existing.room,
              score: existing.score + score,
              count: existing.count + 1,
            })
          } else {
            roomScores.set(roomId, { room, score, count: 1 })
          }
        }
      }

      // Sắp xếp theo điểm số và lấy top results
      const sortedRooms = Array.from(roomScores.values())
        .filter(item => item.count >= 2) // Ít nhất 2 similar users phải thích
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.room)

      return sortedRooms
    } catch (error) {
      this.logger.error(
        'Error getting recommendations from similar users:',
        error
      )
      return []
    }
  }

  /**
   * Tính collaborative score cho một phòng
   */
  private calculateCollaborativeScore(
    room: any,
    similarUsers: Array<{
      userId: number
      similarity: number
      interactions: any
    }>,
    currentUserInteractions: any
  ): { overall: number; confidence: number } {
    try {
      let totalScore = 0
      let totalWeight = 0
      let supportingUsers = 0

      for (const similarUser of similarUsers) {
        const userSimilarity = similarUser.similarity

        // Kiểm tra user này có tương tác với phòng không
        const hasInteraction = this.userHasInteractionWithRoom(
          similarUser.interactions,
          room.id
        )

        if (hasInteraction.hasInteraction) {
          totalScore += userSimilarity * hasInteraction.weight
          totalWeight += userSimilarity
          supportingUsers++
        }
      }

      if (totalWeight === 0) {
        return { overall: 0, confidence: 0 }
      }

      const baseScore = totalScore / totalWeight

      // Confidence dựa trên số lượng supporting users
      const confidence = Math.min(supportingUsers / 5, 1.0)

      // Điều chỉnh score theo confidence
      const finalScore = baseScore * (0.5 + 0.5 * confidence)

      return {
        overall: Math.min(finalScore, 1.0),
        confidence,
      }
    } catch (error) {
      this.logger.error('Error calculating collaborative score:', error)
      return { overall: 0, confidence: 0 }
    }
  }

  /**
   * Kiểm tra user có tương tác với phòng không
   */
  private userHasInteractionWithRoom(
    userInteractions: any,
    roomId: number
  ): { hasInteraction: boolean; weight: number } {
    try {
      // Kiểm tra favorites
      const hasFavorite = userInteractions.favorites.some(
        (f: any) => f.post?.room?.id === roomId
      )
      if (hasFavorite) return { hasInteraction: true, weight: 1.0 }

      // Kiểm tra rental requests (quan trọng nhất)
      const hasRentalRequest = userInteractions.tenantRentalRequests.some(
        (r: any) => r.post?.room?.id === roomId
      )
      if (hasRentalRequest) return { hasInteraction: true, weight: 2.0 }

      // Kiểm tra viewing schedules
      const hasViewingSchedule = userInteractions.tenantViewingSchedules.some(
        (v: any) => v.post?.room?.id === roomId
      )
      if (hasViewingSchedule) return { hasInteraction: true, weight: 1.5 }

      return { hasInteraction: false, weight: 0 }
    } catch (error) {
      return { hasInteraction: false, weight: 0 }
    }
  }

  /**
   * Tạo explanation cho collaborative recommendation
   */
  private generateCollaborativeExplanation(
    room: any,
    collaborativeScore: { overall: number; confidence: number },
    similarUsersCount: number,
    distance?: number
  ): RecommendationExplanationType {
    const reasons: string[] = []

    if (collaborativeScore.confidence > 0.8) {
      reasons.push(
        `${similarUsersCount} người có sở thích tương tự đã quan tâm`
      )
    } else if (collaborativeScore.confidence > 0.5) {
      reasons.push(`Một số người có sở thích tương tự đã thích phòng này`)
    } else {
      reasons.push(`Phòng được gợi ý dựa trên hành vi người dùng`)
    }

    if (collaborativeScore.overall > 0.8) {
      reasons.push(`Độ phù hợp cao với sở thích của bạn`)
    }

    // Add distance to university information if available
    if (distance !== undefined) {
      if (distance < 0.5) {
        reasons.push(
          `Rất gần Đại học Nam Cần Thơ (${Math.round(distance * 1000)}m)`
        )
      } else if (distance < 2) {
        reasons.push(`Gần Đại học Nam Cần Thơ (${distance.toFixed(1)}km)`)
      } else {
        reasons.push(`Cách Đại học Nam Cần Thơ ${distance.toFixed(1)}km`)
      }
    }

    return {
      reasons,
      distance:
        distance !== undefined ? Math.round(distance * 1000) : undefined,
      priceDifference: undefined,
      areaDifference: undefined,
      commonAmenities: [],
    }
  }

  /**
   * Đếm số lượng tương tác của user
   */
  private getUserInteractionCount(userInteractions: any): number {
    if (!userInteractions) return 0

    return (
      (userInteractions.favorites?.length || 0) +
      (userInteractions.tenantViewingSchedules?.length || 0) +
      (userInteractions.tenantRentalRequests?.length || 0)
    )
  }

  /**
   * 🔄 HYBRID METHOD IMPLEMENTATION
   * Kết hợp thông minh nhiều phương pháp gợi ý
   */
  private async getHybridRecommendations(
    targetRoom: any,
    query: GetRecommendationsQueryType,
    userId?: number
  ): Promise<RecommendedRoomType[]> {
    const startTime = Date.now()

    try {
      // 1. Phân tích context để quyết định strategy
      const context = await this.analyzeRecommendationContext(
        targetRoom,
        userId
      )

      // 2. Tính toán trọng số động cho từng phương pháp
      const methodWeights = this.calculateMethodWeights(context)

      // 3. Chạy song song các phương pháp (với optimization)
      const [
        contentResults,
        collaborativeResults,
        popularityResults,
        locationResults,
      ] = await Promise.allSettled([
        this.getContentBasedRecommendations(targetRoom, query, userId),
        // Chỉ chạy collaborative nếu có user và weight > 0.1
        userId && methodWeights.collaborative > 0.1
          ? this.getCollaborativeRecommendations(targetRoom, query, userId)
          : Promise.resolve([]),
        // Chỉ chạy popularity nếu weight > 0.1
        methodWeights.popularity > 0.1
          ? this.getPopularityBasedRecommendations(targetRoom, query)
          : Promise.resolve([]),
        // Chỉ chạy location nếu có GPS data và weight > 0.1
        context.hasLocationData && methodWeights.location > 0.1
          ? this.getLocationBasedRecommendations(targetRoom, query, userId)
          : Promise.resolve([]),
      ])

      // 4. Kết hợp kết quả với trọng số
      const combinedResults = this.combineRecommendationResults(
        {
          content:
            contentResults.status === 'fulfilled' ? contentResults.value : [],
          collaborative:
            collaborativeResults.status === 'fulfilled'
              ? collaborativeResults.value
              : [],
          popularity:
            popularityResults.status === 'fulfilled'
              ? popularityResults.value
              : [],
          location:
            locationResults.status === 'fulfilled' ? locationResults.value : [],
        },
        methodWeights
      )

      // 5. Đa dạng hóa và sắp xếp kết quả cuối cùng
      const finalResults = this.diversifyAndSortResults(
        combinedResults,
        query.limit
      )

      const executionTime = Date.now() - startTime
      this.logger.log(
        `Hybrid execution time: ${executionTime}ms, results: ${finalResults.length}`
      )

      return finalResults.map((room, index) => ({
        ...room,
        method: RecommendationMethod.HYBRID,
        rank: index + 1,
        explanation: {
          ...room.explanation,
          reasons: [
            ...room.explanation.reasons,
            `Gợi ý thông minh kết hợp ${this.getActiveMethodsDescription(methodWeights)}`,
          ],
        },
      }))
    } catch (error) {
      this.logger.error('Error in hybrid recommendations:', error)

      return this.getContentBasedRecommendations(targetRoom, query, userId)
    }
  }

  /**
   * Phân tích context để quyết định strategy
   */
  private async analyzeRecommendationContext(
    targetRoom: any,
    userId?: number
  ): Promise<{
    userInteractionCount: number
    roomDataQuality: number
    userAge: number // days since registration
    hasLocationData: boolean
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    isWeekend: boolean
  }> {
    try {
      let userInteractionCount = 0
      let userAge = 0

      if (userId) {
        const userInteractions =
          await this.recommendationRepo.getUserInteractions(userId)
        userInteractionCount = this.getUserInteractionCount(userInteractions)

        // Tính tuổi user (giả sử có createdAt)
        // userAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        userAge = 30 // Default for now
      }

      // Đánh giá chất lượng dữ liệu phòng
      const roomDataQuality = this.assessRoomDataQuality(targetRoom)

      // Context thời gian
      const now = new Date()
      const hour = now.getHours()
      const timeOfDay =
        hour < 6
          ? 'night'
          : hour < 12
            ? 'morning'
            : hour < 18
              ? 'afternoon'
              : 'evening'

      const isWeekend = now.getDay() === 0 || now.getDay() === 6

      return {
        userInteractionCount,
        roomDataQuality,
        userAge,
        hasLocationData: !!(targetRoom.rental?.lat && targetRoom.rental?.lng),
        timeOfDay,
        isWeekend,
      }
    } catch (error) {
      this.logger.error('Error analyzing context:', error)
      return {
        userInteractionCount: 0,
        roomDataQuality: 0.5,
        userAge: 0,
        hasLocationData: false,
        timeOfDay: 'afternoon',
        isWeekend: false,
      }
    }
  }

  /**
   * Tính toán trọng số động cho từng phương pháp
   */
  private calculateMethodWeights(context: any): {
    content: number
    collaborative: number
    popularity: number
    location: number
  } {
    let weights = {
      content: 0.4, // Base weight
      collaborative: 0.2,
      popularity: 0.2,
      location: 0.2,
    }

    // Điều chỉnh dựa trên số lượng tương tác của user
    if (context.userInteractionCount > 10) {
      // User có nhiều tương tác → tăng collaborative
      weights.collaborative += 0.2
      weights.content -= 0.1
      weights.popularity -= 0.1
    } else if (context.userInteractionCount < 3) {
      // User mới → tăng popularity và content
      weights.popularity += 0.15
      weights.content += 0.1
      weights.collaborative -= 0.25
    }

    // Điều chỉnh dựa trên chất lượng dữ liệu phòng
    if (context.roomDataQuality > 0.8) {
      // Dữ liệu phòng tốt → tăng content-based
      weights.content += 0.1
      weights.popularity -= 0.05
      weights.location -= 0.05
    }

    // Điều chỉnh dựa trên location data
    if (context.hasLocationData) {
      weights.location += 0.1
      weights.content -= 0.05
      weights.popularity -= 0.05
    }

    // Điều chỉnh theo thời gian (người dùng có thể có hành vi khác nhau)
    if (context.timeOfDay === 'evening' || context.isWeekend) {
      // Buổi tối/cuối tuần → người dùng có thời gian explore hơn
      weights.collaborative += 0.05
      weights.popularity -= 0.05
    }

    // Normalize weights để tổng = 1
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
    Object.keys(weights).forEach(key => {
      weights[key as keyof typeof weights] /= total
    })

    return weights
  }

  /**
   * Đánh giá chất lượng dữ liệu phòng
   */
  private assessRoomDataQuality(room: any): number {
    let score = 0
    let maxScore = 0

    // Có giá
    maxScore += 1
    if (room.price && room.price > 0) score += 1

    // Có diện tích
    maxScore += 1
    if (room.area && room.area > 0) score += 1

    // Có vị trí
    maxScore += 1
    if (room.rental?.lat && room.rental?.lng) score += 1

    // Có tiện ích
    maxScore += 1
    if (room.roomAmenities && room.roomAmenities.length > 0) score += 1

    // Có hình ảnh
    maxScore += 1
    if (room.roomImages && room.roomImages.length > 0) score += 1

    // Có mô tả
    maxScore += 1
    if (room.title && room.title.length > 10) score += 1

    return maxScore > 0 ? score / maxScore : 0
  }

  /**
   * Kết hợp kết quả từ các phương pháp khác nhau
   */
  private combineRecommendationResults(
    results: {
      content: RecommendedRoomType[]
      collaborative: RecommendedRoomType[]
      popularity: RecommendedRoomType[]
      location: RecommendedRoomType[]
    },
    weights: {
      content: number
      collaborative: number
      popularity: number
      location: number
    }
  ): RecommendedRoomType[] {
    const roomScores = new Map<
      number,
      {
        room: RecommendedRoomType
        totalScore: number
        methodContributions: string[]
      }
    >()

    // Xử lý kết quả từ mỗi phương pháp
    const processResults = (
      methodResults: RecommendedRoomType[],
      methodWeight: number,
      methodName: string
    ) => {
      methodResults.forEach((room, index) => {
        const roomId = room.id
        // Score giảm dần theo rank (rank 1 = score cao nhất)
        const positionScore = Math.max(0, 1 - index / methodResults.length)
        const weightedScore =
          room.similarityScore * positionScore * methodWeight

        if (roomScores.has(roomId)) {
          const existing = roomScores.get(roomId)!
          roomScores.set(roomId, {
            room: {
              ...existing.room,
              // Preserve distance if new room has it and existing doesn't
              ...(room.rental?.distance !== undefined &&
                existing.room.rental?.distance === undefined && {
                  rental: {
                    ...existing.room.rental,
                    distance: room.rental.distance,
                  },
                }),
            },
            totalScore: existing.totalScore + weightedScore,
            methodContributions: [...existing.methodContributions, methodName],
          })
        } else {
          roomScores.set(roomId, {
            room,
            totalScore: weightedScore,
            methodContributions: [methodName],
          })
        }
      })
    }

    // Xử lý từng phương pháp
    processResults(results.content, weights.content, 'Content-Based')
    processResults(
      results.collaborative,
      weights.collaborative,
      'Collaborative'
    )
    processResults(results.popularity, weights.popularity, 'Popularity')
    processResults(results.location, weights.location, 'Location-Based')

    // Sắp xếp theo tổng điểm
    const sortedResults = Array.from(roomScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .map(item => ({
        ...item.room,
        similarityScore: Math.min(item.totalScore, 1.0), // Cap at 1.0
        explanation: {
          ...item.room.explanation,
          reasons: [
            ...item.room.explanation.reasons,
            `Được gợi ý bởi: ${item.methodContributions.join(', ')}`,
          ],
        },
      }))

    return sortedResults
  }

  /**
   * Mô tả các phương pháp đang active
   */
  private getActiveMethodsDescription(weights: any): string {
    const activeMethods: string[] = []
    if (weights.content > 0.1) activeMethods.push('phân tích nội dung')
    if (weights.collaborative > 0.1) activeMethods.push('hành vi người dùng')
    if (weights.popularity > 0.1) activeMethods.push('độ phổ biến')
    if (weights.location > 0.1) activeMethods.push('vị trí địa lý')

    return activeMethods.join(', ')
  }

  /**
   * AI Comparison Analysis cho comparison page
   */
  async generateAIComparison(roomIds: number[], userId?: number) {
    try {
      this.logger.log(
        `Generating AI comparison for rooms: ${roomIds.join(', ')}`
      )

      // Lấy thông tin chi tiết các phòng
      const roomsData = await Promise.all(
        roomIds.map(async roomId => {
          const room = await this.recommendationRepo.getRoomDetails(roomId)
          if (!room) {
            throw new NotFoundException(`Room with ID ${roomId} not found`)
          }
          return room
        })
      )

      // Tạo prompt cho AI analysis
      const prompt = this.createAIComparisonPrompt(roomsData)

      // Gọi OpenAI để phân tích
      const aiResponse = await this.openaiService.generateCompletion(
        prompt,
        'gpt-4o-mini',
        0.7,
        2000
      )

      return {
        success: true,
        message: 'AI analysis completed successfully',
        data: {
          analysis: aiResponse,
          roomsCount: roomsData.length,
          timestamp: new Date().toISOString(),
          rooms: roomsData.map(room => ({
            id: room.id,
            title: room.title,
            price: this.convertToNumber(room.price),
            area: this.convertToNumber(room.area),
            address: room.rental?.address || 'N/A',
            isAvailable: room.isAvailable,
            amenitiesCount: room.roomAmenities?.length || 0,
          })),
        },
      }
    } catch (error) {
      this.logger.error('Error generating AI comparison:', error)
      throw error
    }
  }

  /**
   * Tạo prompt cho AI comparison analysis
   */
  private createAIComparisonPrompt(rooms: any[]): string {
    const roomsInfo = rooms
      .map((room, index) => {
        const amenitiesCount = room.roomAmenities?.length || 0
        const distance = room.rental?.distance || 'N/A'

        return `
📍 **Phòng ${index + 1}: ${room.title}**
- Giá: ${this.convertToNumber(room.price).toLocaleString('vi-VN')} VNĐ/tháng
- Diện tích: ${this.convertToNumber(room.area)} m²
- Địa chỉ: ${room.rental?.address || 'N/A'}
- Khoảng cách đến trường: ${distance === 'N/A' ? 'N/A' : distance + ' km'}
- Số lượng tiện ích: ${amenitiesCount} tiện ích
- Trạng thái: ${room.isAvailable ? 'Có sẵn' : 'Đã cho thuê'}
- Tỷ lệ giá/diện tích: ${(this.convertToNumber(room.price) / this.convertToNumber(room.area)).toLocaleString('vi-VN')} VNĐ/m²`
      })
      .join('\n\n')

    return `
Bạn là chuyên gia tư vấn bất động sản thông minh của Rently. Hãy phân tích so sánh các phòng trọ sau đây và đưa ra báo cáo chi tiết:

${roomsInfo}

🎯 **YÊU CẦU PHÂN TÍCH:**

**1. ĐÁNH GIÁ VÀ XẾP HẠNG:**
- Xếp hạng các phòng từ tốt nhất đến kém nhất (1-${rooms.length})
- Cho điểm từng phòng theo 4 tiêu chí: Giá cả (30%), Vị trí (30%), Diện tích (20%), Tiện ích (20%)
- Điểm tổng từ 0-100 cho mỗi phòng

**2. PHÂN TÍCH ƯU NHƯỢC ĐIỂM:**
- Ưu điểm nổi bật của từng phòng
- Nhược điểm cần lưu ý
- So sánh tương đối giữa các phòng

**3. GỢI Ý THÔNG MINH:**
- Phòng nào phù hợp với sinh viên có ngân sách hạn chế?
- Phòng nào tốt nhất cho người ưu tiên tiện nghi?
- Phòng nào có tỷ lệ giá/chất lượng tốt nhất?

**4. KẾT LUẬN VÀ KHUYẾN NGHỊ:**
- Phòng được khuyến nghị hàng đầu và lý do
- Lời khuyên cuối cùng cho người thuê

Hãy viết bằng tiếng Việt, phong cách chuyên nghiệp nhưng thân thiện, dễ hiểu. Sử dụng emoji và format markdown để dễ đọc.
`
  }
}
