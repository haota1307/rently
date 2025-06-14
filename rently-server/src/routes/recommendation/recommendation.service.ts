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
        similarityScore: locationScore,
        method: RecommendationMethod.LOCATION_BASED,
        explanation: {
          reasons: [
            distance < 1000
              ? `Rất gần (${Math.round(distance)}m)`
              : `Cùng khu vực (${(distance / 1000).toFixed(1)}km)`,
          ],
          distance: Math.round(distance),
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
      .filter(room => room.similarityScore > 0.1)
      .sort((a, b) => b.similarityScore - a.similarityScore)
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

        return {
          ...this.recommendationRepo.formatRoom(room),
          similarityScore: collaborativeScore.overall,
          method: RecommendationMethod.COLLABORATIVE,
          explanation: this.generateCollaborativeExplanation(
            room,
            collaborativeScore,
            similarUsers.length
          ),
          similarityBreakdown: {
            location: 0,
            price: 0,
            area: 0,
            amenities: 0,
            overall: collaborativeScore.overall,
          },
          rank: 0,
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
              favorites: otherUser.favorites,
              tenantRentalRequests: otherUser.tenantRentalRequests,
              tenantViewingSchedules: otherUser.tenantViewingSchedules,
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
        ...userA.favorites
          .map((f: any) => f.rental.rooms[0]?.id)
          .filter(Boolean),
        ...userA.tenantViewingSchedules
          .map((v: any) => v.post.room?.id)
          .filter(Boolean),
        ...userA.tenantRentalRequests
          .map((r: any) => r.post.room?.id)
          .filter(Boolean),
      ])

      // Lấy set các phòng mà user B đã tương tác
      const roomsB = new Set([
        ...userB.favorites
          .map((f: any) => f.rental.rooms[0]?.id)
          .filter(Boolean),
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
            room: f.rental.rooms[0],
            weight: 1.0, // favorite
          })),
          ...similarUser.interactions.tenantRentalRequests.map((r: any) => ({
            room: r.post.room,
            weight: 2.0, // rental request (quan trọng hơn)
          })),
          ...similarUser.interactions.tenantViewingSchedules.map((v: any) => ({
            room: v.post.room,
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
        (f: any) => f.rental.rooms[0]?.id === roomId
      )
      if (hasFavorite) return { hasInteraction: true, weight: 1.0 }

      // Kiểm tra rental requests (quan trọng nhất)
      const hasRentalRequest = userInteractions.tenantRentalRequests.some(
        (r: any) => r.post.room?.id === roomId
      )
      if (hasRentalRequest) return { hasInteraction: true, weight: 2.0 }

      // Kiểm tra viewing schedules
      const hasViewingSchedule = userInteractions.tenantViewingSchedules.some(
        (v: any) => v.post.room?.id === roomId
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
    similarUsersCount: number
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

    return {
      reasons,
      distance: undefined,
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

      this.logger.log(`Hybrid context: ${JSON.stringify(context)}`)
      this.logger.log(`Hybrid weights: ${JSON.stringify(methodWeights)}`)

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

      // Log kết quả từng method
      this.logger.log(
        `Content results: ${contentResults.status === 'fulfilled' ? contentResults.value.length : 0}`
      )
      this.logger.log(
        `Collaborative results: ${collaborativeResults.status === 'fulfilled' ? collaborativeResults.value.length : 0}`
      )
      this.logger.log(
        `Popularity results: ${popularityResults.status === 'fulfilled' ? popularityResults.value.length : 0}`
      )
      this.logger.log(
        `Location results: ${locationResults.status === 'fulfilled' ? locationResults.value.length : 0}`
      )

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
      // Fallback to content-based với logging
      this.logger.warn('Falling back to content-based recommendations')
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
            room: existing.room,
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
}
