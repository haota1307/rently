import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { RecommendationRepo } from './recommendation.repo'
import { Decimal } from '@prisma/client/runtime/library'
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

  constructor(private readonly recommendationRepo: RecommendationRepo) {}

  private convertToNumber(value: number | Decimal): number {
    return value instanceof Decimal ? value.toNumber() : value
  }

  async getRecommendations(
    query: GetRecommendationsQueryType,
    userId?: number
  ): Promise<GetRecommendationsResType> {
    const startTime = Date.now()

    try {
      const targetRoom = await this.recommendationRepo.getRoomDetails(
        query.roomId
      )
      if (!targetRoom) {
        throw new NotFoundException(`Room with ID ${query.roomId} not found`)
      }

      const selectedMethod = await this.selectOptimalMethod(
        query.method,
        query.roomId,
        userId
      )
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
        default:
          recommendations = await this.getContentBasedRecommendations(
            targetRoom,
            query,
            userId
          )
      }

      const executionTime = Date.now() - startTime
      const weights = await this.recommendationRepo.getRecommendationWeights()

      return {
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
          },
        },
      }
    } catch (error) {
      this.logger.error('Error getting recommendations:', error)
      throw error
    }
  }

  private async getContentBasedRecommendations(
    targetRoom: any,
    query: GetRecommendationsQueryType,
    userId?: number
  ): Promise<RecommendedRoomType[]> {
    const candidateRooms = await this.recommendationRepo.getCandidateRooms(
      targetRoom.id,
      query,
      userId
    )

    if (candidateRooms.length === 0) return []

    const weights = await this.recommendationRepo.getRecommendationWeights()

    const scoredRooms = candidateRooms.map(room => {
      const similarity = this.calculateContentSimilarity(
        targetRoom,
        room,
        weights,
        query
      )

      return {
        ...this.recommendationRepo.formatRoom(room),
        similarityScore: similarity.overall,
        method: RecommendationMethod.CONTENT_BASED,
        explanation: this.generateContentBasedExplanation(
          targetRoom,
          room,
          similarity
        ),
        similarityBreakdown: similarity,
        rank: 0,
      }
    })

    const sortedRooms = this.diversifyAndSortResults(scoredRooms, query.limit)

    return sortedRooms.map((room, index) => ({
      ...room,
      rank: index + 1,
    }))
  }

  private async getPopularityBasedRecommendations(
    targetRoom: any,
    query: GetRecommendationsQueryType
  ): Promise<RecommendedRoomType[]> {
    const popularRooms = await this.recommendationRepo.getPopularRooms(
      targetRoom.id,
      query.limit
    )

    return popularRooms.map((room, index) => ({
      ...this.recommendationRepo.formatRoom(room),
      similarityScore: 0.5,
      method: RecommendationMethod.POPULARITY,
      explanation: {
        reasons: ['Phòng trọ phổ biến được nhiều người quan tâm'],
        distance: undefined,
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
    }))
  }

  private async getLocationBasedRecommendations(
    targetRoom: any,
    query: GetRecommendationsQueryType,
    userId?: number
  ): Promise<RecommendedRoomType[]> {
    const candidateRooms = await this.recommendationRepo.getCandidateRooms(
      targetRoom.id,
      query,
      userId
    )

    const locationScoredRooms = candidateRooms.map(room => {
      const distance = this.calculateDistance(
        this.convertToNumber(targetRoom.rental.lat),
        this.convertToNumber(targetRoom.rental.lng),
        this.convertToNumber(room.rental.lat),
        this.convertToNumber(room.rental.lng)
      )

      const locationScore = this.calculateLocationScore(
        distance,
        query.maxDistance
      )

      return {
        ...this.recommendationRepo.formatRoom(room),
        distance,
        similarityScore: locationScore,
        method: RecommendationMethod.LOCATION_BASED,
        explanation: {
          reasons: [`Cách phòng đang xem ${Math.round(distance)}m`],
          distance,
          priceDifference: undefined,
          areaDifference: undefined,
          commonAmenities: [],
        },
        similarityBreakdown: {
          location: locationScore,
          price: 0,
          area: 0,
          amenities: 0,
          overall: locationScore,
        },
        rank: 0,
      }
    })

    const sortedRooms = locationScoredRooms
      .sort((a, b) => a.distance - b.distance)
      .slice(0, query.limit)

    return sortedRooms.map((room, index) => ({
      ...room,
      rank: index + 1,
    }))
  }

  private calculateContentSimilarity(
    targetRoom: any,
    candidateRoom: any,
    weights: SimilarityWeightsType,
    query: GetRecommendationsQueryType
  ): SimilarityBreakdownType {
    const distance = this.calculateDistance(
      targetRoom.rental.lat,
      targetRoom.rental.lng,
      candidateRoom.rental.lat,
      candidateRoom.rental.lng
    )
    const locationScore = this.calculateLocationScore(
      distance,
      query.maxDistance
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
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  private calculateLocationScore(
    distance: number,
    maxDistance: number
  ): number {
    if (distance <= 500) return 1.0
    if (distance >= maxDistance) return 0.0
    return Math.max(0, 1 - (distance - 500) / (maxDistance - 500))
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
    similarity: SimilarityBreakdownType
  ): RecommendationExplanationType {
    const explanations: string[] = []
    const distance = this.calculateDistance(
      targetRoom.rental.lat,
      targetRoom.rental.lng,
      recommendedRoom.rental.lat,
      recommendedRoom.rental.lng
    )

    if (similarity.location > 0.8) {
      if (distance < 1000) {
        explanations.push(`Rất gần vị trí (${Math.round(distance)}m)`)
      } else {
        explanations.push(`Cùng khu vực`)
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
      distance: Math.round(distance),
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
    return preferredMethod
  }

  async trackClick(data: TrackRecommendationClickType): Promise<void> {
    try {
      await this.recommendationRepo.trackRecommendationClick(data)
      this.logger.log(`Tracked recommendation click: ${data.targetRoomId}`)
    } catch (error) {
      this.logger.warn('Failed to track recommendation click:', error)
    }
  }
}
