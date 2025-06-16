import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ChatbotOpenAIService } from './openai.service'
import { SearchCriteria, SearchResult } from '../interfaces/chatbot.interfaces'
import { ChatbotMessageAnalysisSimplifiedService } from 'src/routes/chatbot/services/message-analysis-simplified.service'

@Injectable()
export class ChatbotSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: ChatbotOpenAIService,
    private readonly messageAnalysisService: ChatbotMessageAnalysisSimplifiedService
  ) {}

  /**
   * Tìm kiếm các bài đăng (Post) dựa trên tiêu chí phòng
   */
  async searchPostsByRoomCriteria(criteria: SearchCriteria): Promise<any[]> {
    try {
      // Xử lý trường hợp có distance.max nhưng không có location
      if (
        criteria.distance &&
        criteria.distance.max &&
        !criteria.distance.location
      ) {
        // Thêm vị trí mặc định - Đại học Nam Cần Thơ là nơi phổ biến
        criteria.distance.location = {
          type: 'đại học',
          name: 'Nam Cần Thơ',
          text: 'Đại học Nam Cần Thơ',
          isUniversity: true,
          coordinates: {
            lat: 10.0175,
            lng: 105.7239,
          },
        }
        console.log('Đã thêm vị trí mặc định cho distance: Đại học Nam Cần Thơ')
      }

      // Xử lý tiện ích trước để giảm số lượng tham số cần xử lý trong các truy vấn sau
      let amenityIds: number[] = []
      if (criteria.amenities && criteria.amenities.length > 0) {
        // Tìm ID của các tiện ích từ tên
        const amenities = await this.prisma.amenity.findMany({
          where: {
            name: {
              in: criteria.amenities,
            },
          },
          select: { id: true },
        })
        amenityIds = amenities.map(a => a.id)
      }

      // Khởi tạo điều kiện cơ bản
      let roomWhereCondition: any = {
        isAvailable: true,
      }

      // Xử lý điều kiện giá
      if (criteria.price) {
        if (criteria.price.min) {
          roomWhereCondition.price = {
            ...(roomWhereCondition.price || {}),
            gte: criteria.price.min,
          }
        }
        if (criteria.price.max) {
          roomWhereCondition.price = {
            ...(roomWhereCondition.price || {}),
            lte: criteria.price.max,
          }
        }
      }

      // Xử lý điều kiện diện tích
      if (criteria.area) {
        if (criteria.area.min) {
          roomWhereCondition.area = {
            ...(roomWhereCondition.area || {}),
            gte: criteria.area.min,
          }
        }
        if (criteria.area.max) {
          roomWhereCondition.area = {
            ...(roomWhereCondition.area || {}),
            lte: criteria.area.max,
          }
        }
      }

      // Thêm điều kiện tiện ích nếu có
      if (amenityIds.length > 0) {
        roomWhereCondition.roomAmenities = {
          some: {
            amenityId: {
              in: amenityIds,
            },
          },
        }
      }

      // Thêm điều kiện địa chỉ nếu có
      let rentalWhereCondition: any = {}
      if (criteria.address) {
        rentalWhereCondition = {
          address: {
            contains: criteria.address,
            mode: 'insensitive',
          },
        }
      }

      // Thêm điều kiện khoảng cách nếu có
      if (criteria.distance && criteria.distance.max) {
        // Sử dụng trực tiếp trường distance trong database
        rentalWhereCondition.distance = {
          lte: criteria.distance.max,
          not: null, // Đảm bảo distance không phải null
        }
      }

      // Xác định cách sắp xếp kết quả
      let orderBy = { createdAt: 'desc' } as any

      // Kiểm tra có yêu cầu sắp xếp theo giá không
      if (criteria.sortBy === 'price') {
        if (criteria.sortOrder === 'desc') {
          // Sắp xếp theo giá cao nhất trước
          orderBy = { room: { price: 'desc' } }
        } else {
          // Sắp xếp theo giá thấp nhất trước (mặc định)
          orderBy = { room: { price: 'asc' } }
        }
      }

      // Lấy các bài đăng phù hợp với tiêu chí cơ bản
      const posts = await this.prisma.rentalPost.findMany({
        where: {
          status: 'ACTIVE',
          room: roomWhereCondition,
          rental: rentalWhereCondition,
        },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          room: {
            select: {
              id: true,
              price: true,
              area: true,
              roomImages: {
                select: {
                  imageUrl: true,
                },
              },
              roomAmenities: {
                select: {
                  amenity: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              rental: {
                select: {
                  id: true,
                  address: true,
                  lat: true,
                  lng: true,
                  distance: true, // Lấy giá trị distance đã lưu
                },
              },
            },
          },
        },
        orderBy: orderBy,
      })

      // Map kết quả trả về dạng dễ đọc và sắp xếp theo distance nếu có
      let results = posts.map(post => {
        const room = post.room
        const rental = room.rental

        // Lấy danh sách tiện ích
        const amenities = room.roomAmenities.map(ra => ra.amenity.name)

        return {
          postId: post.id,
          roomId: room.id,
          rentalId: rental.id,
          title: post.title,
          price: room.price,
          area: room.area,
          description: post.description,
          address: rental.address,
          amenities: amenities,
          imageUrls: room.roomImages.map(img => img.imageUrl),
          createdAt: post.createdAt,
          distance: rental.distance
            ? parseFloat(rental.distance.toString())
            : null,
        }
      })

      // Nếu có yêu cầu sắp xếp nhưng không thể áp dụng trong truy vấn Prisma, sắp xếp lại kết quả
      if (criteria.sortBy === 'price' && !orderBy.room) {
        results.sort((a, b) => {
          if (criteria.sortOrder === 'desc') {
            return Number(b.price) - Number(a.price) // Sắp xếp giá cao đến thấp
          } else {
            return Number(a.price) - Number(b.price) // Sắp xếp giá thấp đến cao
          }
        })
      }

      // Lọc kết quả theo khoảng cách nếu cần (chỉ để đảm bảo an toàn)
      if (criteria.distance && criteria.distance.max) {
        results = results.filter(item => {
          return (
            item.distance !== null &&
            item.distance <= (criteria.distance?.max || Infinity)
          )
        })

        // Sắp xếp theo khoảng cách gần nhất
        results.sort(
          (a, b) => (a.distance || Infinity) - (b.distance || Infinity)
        )
      }

      // Nếu người dùng yêu cầu chỉ lấy phòng giá cao nhất/rẻ nhất
      if (criteria.sortBy === 'price' && criteria.onlyTopResult === true) {
        if (results.length > 0) {
          if (criteria.sortOrder === 'desc') {
            // Sắp xếp lại một lần nữa để đảm bảo đúng thứ tự (phòng có giá cao nhất)
            results.sort((a, b) => Number(b.price) - Number(a.price))
            // Chỉ giữ lại 1 kết quả đầu tiên (phòng giá cao nhất)
            results = [results[0]]
          } else {
            // Sắp xếp lại một lần nữa để đảm bảo đúng thứ tự (phòng có giá thấp nhất)
            results.sort((a, b) => Number(a.price) - Number(b.price))
            // Chỉ giữ lại 1 kết quả đầu tiên (phòng giá thấp nhất)
            results = [results[0]]
          }
        }
      } else {
        // Giới hạn kết quả để không quá lớn
        results = results.slice(0, 10)
      }

      return results
    } catch (error) {
      console.error('Lỗi searchPostsByRoomCriteria:', error)
      throw new InternalServerErrorException(
        'Lỗi khi tìm kiếm bài đăng: ' + error.message
      )
    }
  }

  /**
   * Tạo phản hồi khi không tìm thấy kết quả, sử dụng RAG để đưa ra gợi ý thông minh hơn
   */
  async generateNoResultsResponse(
    message: string,
    criteria: SearchCriteria
  ): Promise<string> {
    try {
      // Thông tin về tiêu chí tìm kiếm
      const criteriaInfo = JSON.stringify(criteria, null, 2)

      // Lấy 3 bài đăng gần nhất dựa trên trường distance trong Rental
      const fallbackPosts = await this.prisma.rentalPost.findMany({
        where: {
          status: 'ACTIVE',
          ...(criteria.distance && criteria.distance.max
            ? { rental: { distance: { lte: criteria.distance.max * 2 } } }
            : {}),
        },
        orderBy: {
          rental: { distance: 'asc' },
        },
        take: 3,
        select: {
          room: {
            select: {
              price: true,
              area: true,
              roomImages: { take: 1, select: { imageUrl: true } },
            },
          },
          rental: { select: { address: true, distance: true } },
        },
      })
      // Chuẩn bị danh sách gợi ý
      const fallbackList = fallbackPosts
        .map((p, idx) => {
          const price = p.room.price.toString()
          const area = p.room.area
          const addr = p.rental.address
          const dist = p.rental.distance?.toString() || ''
          return `${idx + 1}. Giá ${price} VND, diện tích ${area}m² tại ${addr} (${dist} km)`
        })
        .join('\n')

      // Prompt gửi ChatGPT
      const prompt = `
      Bạn là trợ lý ảo Rently Assistant của một trang web cho thuê phòng trọ.
      
Người dùng đã tìm kiếm phòng trọ nhưng không tìm thấy kết quả phù hợp.
      
      Tiêu chí tìm kiếm của người dùng:
      ${criteriaInfo}
      
Dưới đây là một số gợi ý khác, gần với yêu cầu của bạn:
${fallbackList}
      
Hãy đưa ra phản hồi ngắn gọn, thân thiện với người dùng, bao gồm:
      1. Thông báo không tìm thấy kết quả phù hợp
2. Gợi ý xem qua các gợi ý bên dưới
3. Cách điều chỉnh tiêu chí tìm kiếm để có nhiều kết quả hơn
      Hãy giữ câu trả lời dưới 150 từ:`

      return await this.openaiService.generateCompletion(
        prompt,
        'gpt-4o-mini',
        0.3,
        300
      )
    } catch (error) {
      console.error('Lỗi generateNoResultsResponse:', error)
      // Fallback: gợi ý điều chỉnh tiêu chí
      const suggestions =
        this.messageAnalysisService.suggestCriteriaAdjustments(criteria)
      return `Không tìm thấy bài đăng nào phù hợp với yêu cầu của bạn. ${suggestions || 'Bạn có thể thử điều chỉnh tiêu chí tìm kiếm.'}`
    }
  }

  /**
   * Tính khoảng cách Haversine giữa hai tọa độ
   * @param lat1 Vĩ độ điểm 1
   * @param lng1 Kinh độ điểm 1
   * @param lat2 Vĩ độ điểm 2
   * @param lng2 Kinh độ điểm 2
   * @returns Khoảng cách tính bằng km
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371 // Bán kính trái đất (km)
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return parseFloat(distance.toFixed(2))
  }

  /**
   * Chuyển đổi từ độ sang radian
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Tìm kiếm phòng theo tiêu chí và trả về kết quả theo định dạng SearchResult
   */
  async searchRooms(criteria: SearchCriteria): Promise<SearchResult> {
    try {
      // Thực hiện tìm kiếm phòng theo tiêu chí
      const results = await this.searchPostsByRoomCriteria(criteria)

      // Tạo câu tóm tắt kết quả
      let summary = ''
      if (results.length === 0) {
        // Sử dụng RAG để đưa ra phản hồi thông minh khi không tìm thấy kết quả
        summary = await this.generateNoResultsResponse(
          'không tìm thấy phòng phù hợp',
          criteria
        )
      } else if (results.length === 1 && criteria.onlyTopResult) {
        // Nếu người dùng yêu cầu lấy kết quả cao nhất/thấp nhất và chỉ có 1 kết quả
        if (criteria.sortBy === 'price' && criteria.sortOrder === 'desc') {
          summary = `Đã tìm thấy phòng có giá cao nhất là ${results[0].price.toLocaleString('vi-VN')} VND.`
        } else if (
          criteria.sortBy === 'price' &&
          criteria.sortOrder === 'asc'
        ) {
          summary = `Đã tìm thấy phòng có giá thấp nhất là ${results[0].price.toLocaleString('vi-VN')} VND.`
        } else {
          summary = `Đã tìm thấy 1 bài đăng phù hợp với yêu cầu của bạn.`
        }
      } else {
        summary = `Tìm thấy ${results.length} bài đăng phù hợp với yêu cầu của bạn.`
      }

      return {
        criteria,
        summary,
        results,
        totalFound: results.length,
      }
    } catch (error) {
      console.error('Lỗi tìm kiếm phòng:', error)
      return {
        summary: 'Đã xảy ra lỗi khi tìm kiếm phòng trọ.',
        results: [],
        totalFound: 0,
        error: error.message,
      }
    }
  }
}
