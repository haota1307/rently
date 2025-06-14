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

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Lấy thông tin chi tiết của phòng target
   */
  async getRoomDetails(roomId: number) {
    try {
      return await this.prismaService.room.findUnique({
        where: {
          id: roomId,
          isAvailable: true,
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
              rental: {
                include: {
                  rooms: {
                    where: { isAvailable: true },
                    include: {
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
              favorites: true, // Lấy favorites
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
        const favoriteCount = room.rental.favorites.length
        const viewingCount = room.RentalPost.reduce(
          (sum, post) => sum + post.viewingSchedules.length,
          0
        )
        const requestCount = room.RentalPost.reduce(
          (sum, post) => sum + post.rentalRequests.length,
          0
        )

        const popularityScore =
          favoriteCount * 1 + viewingCount * 2 + requestCount * 3

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

      // Ensure weights sum to 1
      const sum =
        weights.location + weights.price + weights.area + weights.amenities
      if (Math.abs(sum - 1) > 0.001) {
        this.logger.warn(`Recommendation weights sum to ${sum}, using defaults`)
        return DEFAULT_SIMILARITY_WEIGHTS
      }

      return weights
    } catch (error) {
      this.logger.warn(
        'Failed to get recommendation weights from settings, using defaults'
      )
      return DEFAULT_SIMILARITY_WEIGHTS
    }
  }
}
