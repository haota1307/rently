import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  GetRecommendationsQueryType,
  RecommendedRoomType,
  SimilarityWeightsType,
  DEFAULT_SIMILARITY_WEIGHTS,
  RecommendationMethod,
  TrackRecommendationClickType,
} from './recommendation.model'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class RecommendationRepo {
  private readonly logger = new Logger(RecommendationRepo.name)

  // 🧠 Smart Memory Cache for calculations
  private readonly calculationCache = new Map<string, any>()
  private readonly cacheExpiry = 5 * 60 * 1000 // 5 minutes
  private readonly maxCacheSize = 1000 // Maximum cached items

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 🧠 Smart cache for expensive calculations
   */
  private getCachedCalculation(key: string): any | null {
    const cached = this.calculationCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.value
    }
    if (cached) {
      this.calculationCache.delete(key) // Remove expired
    }
    return null
  }

  private setCachedCalculation(key: string, value: any): void {
    // 🚀 LRU cache management
    if (this.calculationCache.size >= this.maxCacheSize) {
      const firstKey = this.calculationCache.keys().next().value
      this.calculationCache.delete(firstKey)
    }

    this.calculationCache.set(key, {
      value,
      timestamp: Date.now(),
    })
  }

  /**
   * Lấy thông tin chi tiết của phòng target
   */
  async getRoomDetails(roomId: number) {
    try {
      return await this.prismaService.room.findUnique({
        where: {
          id: roomId,
          // Bỏ điều kiện isAvailable: true để cho phép lấy thông tin room ngay cả khi đã được cho thuê
          // Điều này cần thiết để API recommendations vẫn hoạt động cho room đã thuê
        },
        include: {
          rental: {
            include: {
              rentalImages: {
                orderBy: { order: 'asc' },
              },
            },
          },
          roomImages: {
            orderBy: { order: 'asc' },
          },
          roomAmenities: {
            include: {
              amenity: true,
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(`Error getting room details for ID ${roomId}:`, error)
      throw new InternalServerErrorException('Failed to get room details')
    }
  }

  /**
   * Lấy danh sách phòng ứng viên cho recommendation
   */
  async getCandidateRooms(
    excludeRoomId: number,
    query: GetRecommendationsQueryType,
    userId?: number
  ) {
    try {
      const whereClause: any = {
        id: { not: excludeRoomId },
        isAvailable: true,
        // Chỉ lấy phòng có bài đăng active
        RentalPost: {
          some: {
            status: 'ACTIVE',
            endDate: { gte: new Date() },
          },
        },
      }

      // Loại trừ phòng user đã tương tác (nếu có userId)
      if (userId) {
        whereClause.RentalPost.some.NOT = {
          OR: [
            // Phòng đã favorite
            {
              rental: {
                favorites: {
                  some: { userId },
                },
              },
            },
            // Phòng đã có rental request
            {
              landlordRentalRequests: {
                some: { tenantId: userId },
              },
            },
            // Phòng đã đặt lịch xem
            {
              viewingSchedules: {
                some: { tenantId: userId },
              },
            },
          ],
        }
      }

      return await this.prismaService.room.findMany({
        where: whereClause,
        include: {
          rental: {
            include: {
              rentalImages: {
                orderBy: { order: 'asc' },
                take: 3, // Chỉ lấy 3 ảnh đầu cho performance
              },
            },
          },
          roomImages: {
            orderBy: { order: 'asc' },
            take: 3,
          },
          roomAmenities: {
            include: {
              amenity: true,
            },
          },
          RentalPost: {
            where: {
              status: 'ACTIVE',
              endDate: { gte: new Date() },
            },
            take: 1,
            include: {
              landlord: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
        take: query.limit * 5, // Lấy nhiều hơn để có nhiều lựa chọn khi tính similarity
      })
    } catch (error) {
      this.logger.error('Error getting candidate rooms:', error)
      throw new InternalServerErrorException('Failed to get candidate rooms')
    }
  }

  /**
   * Lấy user interactions để tính collaborative filtering
   */
  async getUserInteractions(userId: number) {
    try {
      return await this.prismaService.user.findUnique({
        where: { id: userId },
        include: {
          favorites: {
            include: {
              post: {
                include: {
                  room: {
                    include: {
                      rental: true,
                      roomAmenities: {
                        include: { amenity: true },
                      },
                    },
                  },
                },
              },
            },
          },
          tenantViewingSchedules: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
              }, // Last 90 days
            },
            include: {
              post: {
                include: {
                  room: {
                    include: {
                      rental: true,
                      roomAmenities: {
                        include: { amenity: true },
                      },
                    },
                  },
                },
              },
            },
          },
          tenantRentalRequests: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
              }, // Last 180 days
            },
            include: {
              post: {
                include: {
                  room: {
                    include: {
                      rental: true,
                      roomAmenities: {
                        include: { amenity: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        `Error getting user interactions for user ${userId}:`,
        error
      )
      throw new InternalServerErrorException('Failed to get user interactions')
    }
  }

  /**
   * Lấy phòng phổ biến (popular rooms) dựa trên số lượng tương tác
   */
  async getPopularRooms(excludeRoomId: number, limit: number = 10) {
    try {
      // Lấy tất cả phòng có sẵn với các post active
      const availableRooms = await this.prismaService.room.findMany({
        where: {
          id: { not: excludeRoomId },
          isAvailable: true,
          RentalPost: {
            some: {
              status: 'ACTIVE',
              endDate: { gte: new Date() },
            },
          },
        },
        include: {
          rental: {
            include: {
              rentalImages: { orderBy: { order: 'asc' }, take: 3 },
            },
          },
          roomImages: { orderBy: { order: 'asc' }, take: 3 },
          roomAmenities: { include: { amenity: true } },
          RentalPost: {
            where: {
              status: 'ACTIVE',
              endDate: { gte: new Date() },
            },
            include: {
              viewingSchedules: true,
              rentalRequests: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (availableRooms.length === 0) {
        return []
      }

      // Tính toán popularity score cho mỗi phòng
      const roomsWithPopularity = availableRooms.map(room => {
        const viewingCount = room.RentalPost.reduce(
          (sum, post) => sum + post.viewingSchedules.length,
          0
        )
        const requestCount = room.RentalPost.reduce(
          (sum, post) => sum + post.rentalRequests.length,
          0
        )

        const popularityScore = viewingCount * 2 + requestCount * 3

        return {
          ...room,
          popularityScore,
        }
      })

      // Lọc và sắp xếp theo popularity score
      const popularRooms = roomsWithPopularity
        .filter(room => room.popularityScore > 0)
        .sort((a, b) => {
          if (b.popularityScore !== a.popularityScore) {
            return b.popularityScore - a.popularityScore
          }
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        })
        .slice(0, limit)

      // Nếu không có phòng popular, lấy phòng mới nhất
      if (popularRooms.length === 0) {
        return availableRooms.slice(0, limit)
      }

      return popularRooms
    } catch (error) {
      this.logger.error('Error getting popular rooms:', error)
      throw new InternalServerErrorException('Failed to get popular rooms')
    }
  }

  /**
   * Track recommendation click event
   */
  async trackRecommendationClick(data: TrackRecommendationClickType) {
    try {
      // Simple implementation without dedicated table
      this.logger.log(`Recommendation click tracked: ${JSON.stringify(data)}`)
      return true
    } catch (error) {
      // Non-critical error, just log it
      this.logger.warn('Failed to track recommendation click:', error)
      return false
    }
  }

  /**
   * Lấy analytics data cho recommendations
   */
  async getRecommendationAnalytics(startDate: Date, endDate: Date) {
    try {
      const [clickData, impressionData] = await Promise.all([
        this.prismaService.$queryRaw<any[]>`
          SELECT 
            method,
            COUNT(*) as clicks,
            AVG(similarity_score) as avg_similarity_score
          FROM recommendation_clicks 
          WHERE created_at BETWEEN ${startDate} AND ${endDate}
          GROUP BY method
        `,
        this.prismaService.$queryRaw<any[]>`
          SELECT 
            COUNT(*) as total_impressions
          FROM recommendation_impressions 
          WHERE created_at BETWEEN ${startDate} AND ${endDate}
        `,
      ])

      return {
        clickData,
        impressionData: impressionData[0]?.total_impressions || 0,
      }
    } catch (error) {
      this.logger.error('Error getting recommendation analytics:', error)
      return {
        clickData: [],
        impressionData: 0,
      }
    }
  }

  /**
   * Format room data cho response
   */
  formatRoom(room: any): any {
    return {
      ...room,
      price: room.price instanceof Decimal ? room.price.toNumber() : room.price,
      area: room.area instanceof Decimal ? room.area.toNumber() : room.area,
      rental: {
        ...room.rental,
        lat:
          room.rental.lat instanceof Decimal
            ? room.rental.lat.toNumber()
            : room.rental.lat,
        lng:
          room.rental.lng instanceof Decimal
            ? room.rental.lng.toNumber()
            : room.rental.lng,
        distance:
          room.rental.distance instanceof Decimal
            ? room.rental.distance.toNumber()
            : room.rental.distance,
      },
    }
  }

  /**
   * Cache key generators
   */
  generateCacheKey(method: string, roomId: number, userId?: number): string {
    return `recommendation:${method}:${roomId}:${userId || 'anonymous'}`
  }

  /**
   * Lấy system settings cho recommendation weights
   */
  async getRecommendationWeights(): Promise<SimilarityWeightsType> {
    try {
      const settings = await this.prismaService.systemSetting.findMany({
        where: {
          key: {
            in: [
              'rec_weight_location',
              'rec_weight_price',
              'rec_weight_area',
              'rec_weight_amenities',
            ],
          },
        },
      })

      const weights = { ...DEFAULT_SIMILARITY_WEIGHTS }

      settings.forEach(setting => {
        const value = parseFloat(setting.value)
        if (!isNaN(value) && value >= 0 && value <= 1) {
          switch (setting.key) {
            case 'rec_weight_location':
              weights.location = value
              break
            case 'rec_weight_price':
              weights.price = value
              break
            case 'rec_weight_area':
              weights.area = value
              break
            case 'rec_weight_amenities':
              weights.amenities = value
              break
          }
        }
      })

      // Đảm bảo tổng trọng số = 1
      const total =
        weights.location + weights.price + weights.area + weights.amenities
      if (Math.abs(total - 1) > 0.001) {
        // Normalize weights
        weights.location /= total
        weights.price /= total
        weights.area /= total
        weights.amenities /= total
      }

      return weights
    } catch (error) {
      this.logger.error('Error getting recommendation weights:', error)
      return DEFAULT_SIMILARITY_WEIGHTS
    }
  }

  /**
   * 🤝 COLLABORATIVE FILTERING SUPPORT
   * Lấy danh sách user active có tương tác để tính collaborative filtering
   */
  async getActiveUsers(excludeUserId: number, limit: number = 100) {
    try {
      return await this.prismaService.user.findMany({
        where: {
          id: { not: excludeUserId },
          role: {
            name: 'CLIENT',
          }, // Chỉ lấy user CLIENT
          // Có ít nhất 1 tương tác trong 6 tháng qua
          OR: [
            {
              favorites: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months
                  },
                },
              },
            },
            {
              tenantViewingSchedules: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
            {
              tenantRentalRequests: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          ],
        },
        include: {
          favorites: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
              },
            },
            include: {
              post: {
                include: {
                  room: {
                    include: {
                      rental: true,
                      roomAmenities: {
                        include: { amenity: true },
                      },
                    },
                  },
                },
              },
            },
          },
          tenantViewingSchedules: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
              },
            },
            include: {
              post: {
                include: {
                  room: {
                    include: {
                      rental: true,
                      roomAmenities: {
                        include: { amenity: true },
                      },
                    },
                  },
                },
              },
            },
          },
          tenantRentalRequests: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
              },
            },
            include: {
              post: {
                include: {
                  room: {
                    include: {
                      rental: true,
                      roomAmenities: {
                        include: { amenity: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        take: limit,
        orderBy: [
          // Ưu tiên user có nhiều tương tác gần đây
          { favorites: { _count: 'desc' } },
          { tenantViewingSchedules: { _count: 'desc' } },
          { tenantRentalRequests: { _count: 'desc' } },
        ],
      })
    } catch (error) {
      this.logger.error('Error getting active users:', error)
      throw new InternalServerErrorException('Failed to get active users')
    }
  }

  /**
   * Đếm số lượng tương tác của một user
   */
  async getUserInteractionCount(userId: number): Promise<number> {
    try {
      const [favoritesCount, viewingCount, requestCount] = await Promise.all([
        this.prismaService.favorite.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.prismaService.viewingSchedule.count({
          where: {
            tenantId: userId,
            createdAt: {
              gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.prismaService.rentalRequest.count({
          where: {
            tenantId: userId,
            createdAt: {
              gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ])

      return favoritesCount + viewingCount + requestCount
    } catch (error) {
      this.logger.error('Error getting user interaction count:', error)
      return 0
    }
  }

  /**
   * 🌍 Calculate geographic bounding box for optimized location filtering
   */
  private calculateBoundingBox(
    lat: number,
    lng: number,
    radiusMeters: number
  ): {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  } {
    const earthRadius = 6371000 // Earth radius in meters
    // 🔧 Handle both km and m inputs - if radiusMeters < 100, assume it's km
    const radiusInMeters =
      radiusMeters < 100 ? radiusMeters * 1000 : radiusMeters
    const latDelta = (radiusInMeters / earthRadius) * (180 / Math.PI)
    const lngDelta =
      ((radiusInMeters / earthRadius) * (180 / Math.PI)) /
      Math.cos((lat * Math.PI) / 180)

    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta,
    }
  }

  /**
   * 🚀 Optimized candidate rooms with geographic bounding box
   */
  async getCandidateRoomsOptimized(
    excludeRoomId: number,
    targetRoom: any,
    query: GetRecommendationsQueryType,
    userId?: number
  ) {
    try {
      const startTime = Date.now()

      // 🎯 Step 1: Geographic Bounding Box Filtering
      const { minLat, maxLat, minLng, maxLng } = this.calculateBoundingBox(
        targetRoom.rental.lat,
        targetRoom.rental.lng,
        query.maxDistance
      )

      // 💰 Step 2: Price Range Filtering (±50% of target price)
      const targetPrice = Number(targetRoom.price)
      const priceVariance = query.priceVariance || 0.5
      const minPrice = targetPrice * (1 - priceVariance)
      const maxPrice = targetPrice * (1 + priceVariance)

      // 📏 Step 3: Area Range Filtering (±60% of target area)
      const targetArea = Number(targetRoom.area)
      const areaVariance = query.areaVariance || 0.6
      const minArea = targetArea * (1 - areaVariance)
      const maxArea = targetArea * (1 + areaVariance)

      const whereClause: any = {
        id: { not: excludeRoomId },
        isAvailable: true,
        // 🌍 Geographic bounds filter (MAJOR optimization!)
        rental: {
          lat: { gte: minLat, lte: maxLat },
          lng: { gte: minLng, lte: maxLng },
        },
        // 💰 Price range filter
        price: { gte: minPrice, lte: maxPrice },
        // 📏 Area range filter
        area: { gte: minArea, lte: maxArea },
        // Chỉ lấy phòng có bài đăng active
        RentalPost: {
          some: {
            status: 'ACTIVE',
            endDate: { gte: new Date() },
          },
        },
      }

      // Loại trừ phòng user đã tương tác (nếu có userId)
      if (userId) {
        whereClause.RentalPost.some.NOT = {
          OR: [
            {
              rental: {
                favorites: {
                  some: { userId },
                },
              },
            },
            {
              landlordRentalRequests: {
                some: { tenantId: userId },
              },
            },
            {
              viewingSchedules: {
                some: { tenantId: userId },
              },
            },
          ],
        }
      }

      const candidateRooms = await this.prismaService.room.findMany({
        where: whereClause,
        include: {
          rental: {
            include: {
              rentalImages: {
                orderBy: { order: 'asc' },
                take: 3,
              },
            },
          },
          roomImages: {
            orderBy: { order: 'asc' },
            take: 3,
          },
          roomAmenities: {
            include: {
              amenity: true,
            },
          },
          RentalPost: {
            where: {
              status: 'ACTIVE',
              endDate: { gte: new Date() },
            },
            take: 1,
            include: {
              landlord: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
        take: query.limit * 4, // Giảm từ 5x xuống 4x do đã filter tốt hơn
        orderBy: [
          // Ưu tiên phòng gần nhất trước
          {
            rental: {
              lat: targetRoom.rental.lat > 0 ? 'asc' : 'desc',
            },
          },
        ],
      })

      const executionTime = Date.now() - startTime
      this.logger.debug(
        `🚀 Geographic optimization: Found ${candidateRooms.length} candidates in ${executionTime}ms ` +
          `(bounds: lat ${minLat.toFixed(4)}-${maxLat.toFixed(4)}, ` +
          `lng ${minLng.toFixed(4)}-${maxLng.toFixed(4)})`
      )

      return candidateRooms
    } catch (error) {
      this.logger.error('Error getting optimized candidate rooms:', error)
      // Fallback to original method
      return this.getCandidateRooms(excludeRoomId, query, userId)
    }
  }

  /**
   * 🚀 PARALLEL DATA FETCHING - Major Performance Boost!
   * Fetch all recommendation data in parallel instead of sequential
   */
  async getRecommendationDataParallel(
    roomId: number,
    query: GetRecommendationsQueryType,
    userId?: number
  ) {
    const startTime = Date.now()

    try {
      // 🔥 Execute ALL queries in parallel for maximum speed
      const [targetRoom, popularRooms, userInteractions, weights] =
        await Promise.all([
          // Query 1: Target room details
          this.getRoomDetails(roomId),

          // Query 2: Popular rooms (for popularity-based method)
          this.getPopularRooms(roomId, query.limit),

          // Query 3: User interactions (only if userId provided)
          userId ? this.getUserInteractions(userId) : Promise.resolve(null),

          // Query 4: Recommendation weights
          this.getRecommendationWeights(),
        ])

      if (!targetRoom) {
        throw new Error(`Room with ID ${roomId} not found`)
      }

      // 🚀 After getting target room, fetch optimized candidates in parallel
      const candidateRooms = await this.getCandidateRoomsOptimized(
        roomId,
        targetRoom,
        query,
        userId
      )

      const executionTime = Date.now() - startTime
      this.logger.debug(
        `🚀 Parallel data fetch completed in ${executionTime}ms (${candidateRooms.length} candidates)`
      )

      return {
        targetRoom,
        candidateRooms,
        popularRooms,
        userInteractions,
        weights,
        executionTime,
      }
    } catch (error) {
      this.logger.error('Error in parallel data fetch:', error)
      throw error
    }
  }

  /**
   * 🔥 OPTIMIZED BATCH QUERY for better database performance
   */
  async getBatchRoomDetails(roomIds: number[]) {
    const startTime = Date.now()

    try {
      // 🚀 Single query to fetch multiple rooms
      const rooms = await this.prismaService.room.findMany({
        where: {
          id: { in: roomIds },
        },
        include: {
          rental: {
            include: {
              rentalImages: {
                orderBy: { order: 'asc' },
                take: 3, // Limit images for performance
              },
            },
          },
          roomImages: {
            orderBy: { order: 'asc' },
            take: 3,
          },
          roomAmenities: {
            include: {
              amenity: true,
            },
          },
          RentalPost: {
            where: {
              status: 'ACTIVE',
              endDate: { gte: new Date() },
            },
            take: 1,
            include: {
              landlord: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
      })

      const executionTime = Date.now() - startTime
      this.logger.debug(
        `🔥 Batch room fetch: ${rooms.length} rooms in ${executionTime}ms`
      )

      // Convert to map for O(1) lookup
      const roomMap = new Map(rooms.map(room => [room.id, room]))
      return roomMap
    } catch (error) {
      this.logger.error('Error in batch room fetch:', error)
      throw error
    }
  }
}
