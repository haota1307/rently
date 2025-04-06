import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common'
import OpenAI from 'openai'
import { RentalService } from 'src/routes/rental/rental.service'
import { RoomService } from 'src/routes/room/room.service'
import { PostService } from 'src/routes/post/post.service'
import { PrismaService } from 'src/shared/services/prisma.service'

interface CacheEntry<T> {
  value: T
  timestamp: number
}

@Injectable()
export class ChatbotService {
  private openai: OpenAI
  // Bộ nhớ đệm cho kết quả trích xuất tiêu chí
  private criteriaCache: Map<string, CacheEntry<any>> = new Map()
  // Bộ nhớ đệm cho kết quả tìm kiếm
  private searchResultsCache: Map<string, CacheEntry<any[]>> = new Map()
  // Thời gian hiệu lực của cache (15 phút)
  private readonly CACHE_TTL = 15 * 60 * 1000

  constructor(
    private readonly rentalService: RentalService,
    private readonly roomService: RoomService,
    private readonly postService: PostService,
    private readonly prisma: PrismaService
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Kiểm tra và lấy giá trị từ cache
   */
  private getFromCache<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string
  ): T | null {
    const entry = cache.get(key)
    if (!entry) return null

    // Kiểm tra thời gian hiệu lực
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      cache.delete(key)
      return null
    }

    return entry.value
  }

  /**
   * Lưu giá trị vào cache
   */
  private saveToCache<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    value: T
  ): void {
    cache.set(key, {
      value,
      timestamp: Date.now(),
    })

    // Kiểm tra và xóa các mục hết hạn theo định kỳ
    if (cache.size > 100) {
      this.cleanupCache(cache)
    }
  }

  /**
   * Dọn dẹp cache, xóa các mục hết hạn
   */
  private cleanupCache<T>(cache: Map<string, CacheEntry<T>>): void {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        cache.delete(key)
      }
    }
  }

  /**
   * Phân tích tin nhắn người dùng và trích xuất tiêu chí tìm phòng theo định dạng JSON
   * với khả năng xử lý lỗi và fallback
   */
  private async extractCriteria(message: string): Promise<any> {
    // Chuẩn hóa tin nhắn để làm khóa cache (loại bỏ khoảng trắng thừa, chuyển về chữ thường)
    const cacheKey = message.toLowerCase().trim().replace(/\s+/g, ' ')

    // Kiểm tra cache
    const cachedCriteria = this.getFromCache(this.criteriaCache, cacheKey)
    if (cachedCriteria) {
      return cachedCriteria
    }

    // Phân tích cơ bản không cần AI trong trường hợp OpenAI API không khả dụng
    const basicCriteria = this.extractBasicCriteria(message)

    try {
      const prompt = `
          Trong hệ thống tìm phòng trọ của chúng tôi:
          1. Bài đăng (Post) chứa thông tin về phòng cần cho thuê, bao gồm tiêu đề, mô tả, ngày bắt đầu/kết thúc.
          2. Mỗi phòng (Room) có giá thuê (price), diện tích (area), và các tiện ích (amenities).
          3. Phòng thuộc về một nhà trọ (Rental) có địa chỉ cụ thể (address).

          Hãy phân tích tin nhắn của người dùng và trích xuất tiêu chí tìm kiếm dưới dạng JSON với các trường sau:
          - "price": (object | null) mức giá mong muốn với 2 trường con "min" và "max" tính bằng VND. Ví dụ: { "min": 1500000, "max": 3000000 }. Nếu người dùng nói "khoảng 2 triệu", đặt giá min=1800000, max=2200000.
          - "area": (object | null) diện tích mong muốn với 2 trường con "min" và "max" tính bằng m². Ví dụ: { "min": 20, "max": 30 }.
          - "amenities": (array) danh sách tiện ích cần có, có thể bao gồm: ["máy lạnh", "wifi", "ban công", "tủ lạnh", "máy giặt", "bàn làm việc", "gác lửng", "nhà vệ sinh riêng", "bếp"]
          - "address": (string | null) khu vực hoặc địa chỉ mà người dùng quan tâm.
          - "userType": (string | null) đối tượng người thuê, ví dụ "sinh viên", "người đi làm", "gia đình".
          - "roomType": (string | null) loại phòng, ví dụ "phòng trọ", "căn hộ mini", "nhà nguyên căn".

    Tin nhắn: "${message}"

          Output JSON (chỉ trả về JSON, không trả về text khác):`

      // Thiết lập timeout cho OpenAI API
      const openaiPromise = this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      })

      // Tạo một promise sẽ reject sau 5 giây
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI API timeout')), 5000)
      })

      // Race giữa kết quả API và timeout
      const completion: any = await Promise.race([
        openaiPromise,
        timeoutPromise,
      ])

      const content = completion.choices[0]?.message?.content
      if (!content) {
        console.warn(
          'Không nhận được phản hồi từ ChatGPT, sử dụng phân tích cơ bản'
        )
        // Lưu kết quả phân tích cơ bản vào cache và trả về
        this.saveToCache(this.criteriaCache, cacheKey, basicCriteria)
        return basicCriteria
      }

      try {
        // Trích xuất phần JSON từ phản hồi
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[0] : content
        const criteria = JSON.parse(jsonString)

        // Kết hợp kết quả phân tích cơ bản và phân tích AI
        // để đảm bảo không bỏ sót thông tin
        const mergedCriteria = this.mergeCriteria(basicCriteria, criteria)

        // Lưu kết quả vào cache
        this.saveToCache(this.criteriaCache, cacheKey, mergedCriteria)

        return mergedCriteria
      } catch (parseError) {
        console.error('Lỗi phân tích JSON:', parseError, 'Content:', content)
        // Fallback sang phân tích cơ bản
        this.saveToCache(this.criteriaCache, cacheKey, basicCriteria)
        return basicCriteria
      }
    } catch (error: any) {
      console.error('Lỗi extractCriteria:', error)
      // Fallback sang phân tích cơ bản
      this.saveToCache(this.criteriaCache, cacheKey, basicCriteria)
      return basicCriteria
    }
  }

  /**
   * Phân tích cơ bản không sử dụng AI để trích xuất tiêu chí từ tin nhắn
   */
  private extractBasicCriteria(message: string): any {
    const criteria: {
      price: {
        min?: number
        max?: number
      } | null
      area: {
        min?: number
        max?: number
      } | null
      amenities: string[]
      address: string | null
      userType: string | null
      roomType: string | null
    } = {
      price: null,
      area: null,
      amenities: [],
      address: null,
      userType: null,
      roomType: null,
    }

    const lowerMessage = message.toLowerCase()

    // Phân tích giá
    const priceRegex = /(\d+(\.\d+)?)\s*(tr|triệu|m|nghìn|ngàn|k)/g
    const priceMatches = [...lowerMessage.matchAll(priceRegex)]

    if (priceMatches.length > 0) {
      const prices = priceMatches
        .map(match => {
          const value = parseFloat(match[1])
          const unit = match[3]

          if (unit === 'tr' || unit === 'triệu') {
            return value * 1000000
          } else if (
            unit === 'm' ||
            unit === 'nghìn' ||
            unit === 'ngàn' ||
            unit === 'k'
          ) {
            return value * 1000
          }

          return value
        })
        .sort((a, b) => a - b)

      if (prices.length === 1) {
        // Nếu chỉ có một giá, giả định đó là mức giá tối đa
        criteria.price = { max: prices[0] }

        // Kiểm tra nếu có từ "khoảng" hoặc "tầm" thì thêm mức giá tối thiểu
        if (/(khoảng|tầm|từ) *\d+/i.test(lowerMessage)) {
          criteria.price.min = prices[0] * 0.8
        }
      } else if (prices.length >= 2) {
        // Nếu có ít nhất hai giá, giả định đó là khoảng giá
        criteria.price = { min: prices[0], max: prices[prices.length - 1] }
      }
    } else if (/(rẻ|giá rẻ|hợp lý|vừa phải)/i.test(lowerMessage)) {
      // Nếu chỉ đề cập đến giá rẻ
      criteria.price = { min: 1000000, max: 3000000 }
    }

    // Phân tích diện tích
    const areaRegex = /(\d+(\.\d+)?)\s*(m2|m²|met vuong|mét vuông)/g
    const areaMatches = [...lowerMessage.matchAll(areaRegex)]

    if (areaMatches.length > 0) {
      const areas = areaMatches
        .map(match => parseFloat(match[1]))
        .sort((a, b) => a - b)

      if (areas.length === 1) {
        criteria.area = { min: areas[0] * 0.8, max: areas[0] * 1.2 }
      } else if (areas.length >= 2) {
        criteria.area = { min: areas[0], max: areas[areas.length - 1] }
      }
    }

    // Phân tích tiện ích
    const amenityKeywords = [
      { keyword: 'máy lạnh|điều hòa', name: 'máy lạnh' },
      { keyword: 'wifi|internet|mạng', name: 'wifi' },
      { keyword: 'ban công', name: 'ban công' },
      { keyword: 'tủ lạnh', name: 'tủ lạnh' },
      { keyword: 'máy giặt', name: 'máy giặt' },
      { keyword: 'bàn làm việc', name: 'bàn làm việc' },
      { keyword: 'gác lửng|gác', name: 'gác lửng' },
      {
        keyword: 'nhà vệ sinh riêng|wc riêng|toilet riêng',
        name: 'nhà vệ sinh riêng',
      },
      { keyword: 'bếp|nấu ăn', name: 'bếp' },
      { keyword: 'an ninh|bảo vệ|camera|cổng bảo vệ', name: 'an ninh' },
    ]

    for (const amenity of amenityKeywords) {
      if (new RegExp(amenity.keyword, 'i').test(lowerMessage)) {
        criteria.amenities.push(amenity.name)
      }
    }

    // Phân tích địa chỉ
    const districtRegex =
      /(quận|huyện|phường|q\.|q) *(\d+|[^\d\s,\.]+)|((bình thạnh)|(tân bình)|(phú nhuận)|(gò vấp)|(bình tân)|(thủ đức))/gi
    const districtMatch = lowerMessage.match(districtRegex)

    if (districtMatch) {
      criteria.address = districtMatch[0]
    }

    return criteria
  }

  /**
   * Kết hợp kết quả từ phân tích cơ bản và phân tích AI
   */
  private mergeCriteria(basicCriteria: any, aiCriteria: any): any {
    const result = { ...aiCriteria }

    // Nếu AI không trích xuất được giá, sử dụng kết quả phân tích cơ bản
    if (!aiCriteria.price && basicCriteria.price) {
      result.price = basicCriteria.price
    }

    // Nếu AI không trích xuất được diện tích, sử dụng kết quả phân tích cơ bản
    if (!aiCriteria.area && basicCriteria.area) {
      result.area = basicCriteria.area
    }

    // Kết hợp danh sách tiện ích từ cả hai nguồn
    const amenities = new Set<string>([
      ...(aiCriteria.amenities || []),
      ...(basicCriteria.amenities || []),
    ])
    result.amenities = Array.from(amenities)

    // Nếu AI không trích xuất được địa chỉ, sử dụng kết quả phân tích cơ bản
    if (!aiCriteria.address && basicCriteria.address) {
      result.address = basicCriteria.address
    }

    return result
  }

  /**
   * Tìm kiếm các bài đăng (Post) dựa trên tiêu chí phòng
   */
  private async searchPostsByRoomCriteria(criteria: any): Promise<any[]> {
    // Tạo khóa cache từ tiêu chí
    const cacheKey = JSON.stringify(criteria)

    // Kiểm tra cache
    const cachedResults = this.getFromCache(this.searchResultsCache, cacheKey)
    if (cachedResults) {
      return cachedResults
    }

    try {
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
          select: { id: true }, // Chỉ lấy ID để giảm kích thước dữ liệu
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
      let rentalWhereCondition = {}
      if (criteria.address) {
        rentalWhereCondition = {
          address: {
            contains: criteria.address,
            mode: 'insensitive',
          },
        }
      }

      // Tìm bài đăng phù hợp với truy vấn một lần thay vì nhiều lần
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
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      })

      // Map kết quả trả về dạng dễ đọc
      const results = posts.map(post => {
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
        }
      })

      // Lưu kết quả vào cache
      this.saveToCache(this.searchResultsCache, cacheKey, results)

      return results
    } catch (error) {
      console.error('Lỗi searchPostsByRoomCriteria:', error)
      throw new InternalServerErrorException(
        'Lỗi khi tìm kiếm bài đăng: ' + error.message
      )
    }
  }

  /**
   * Chuyển đổi từ tin nhắn người dùng sang kết quả tìm kiếm
   * Với cơ chế retry và fallback
   */
  async search(message: string): Promise<{
    criteria: any
    summary: string
    results: any[]
    totalFound: number
    error?: string
  }> {
    try {
      // Số lần thử lại tối đa
      const MAX_RETRIES = 2
      let retries = 0
      let searchResults: any[] = []
      let criteria = null

      // Luồng hoạt động chính
      while (retries <= MAX_RETRIES && searchResults.length === 0) {
        try {
          // Phân tích tin nhắn để trích xuất tiêu chí tìm kiếm
          criteria = await this.extractCriteria(message)

          // Mỗi lần retry, giảm bớt các tiêu chí khắt khe để tìm được nhiều kết quả hơn
          if (retries > 0) {
            criteria = this.relaxCriteria(criteria, retries)
          }

          // Tìm kiếm các bài đăng phù hợp
          searchResults = await this.searchPostsByRoomCriteria(criteria)

          if (searchResults.length > 0) {
            break // Nếu tìm thấy kết quả, thoát khỏi vòng lặp
          }

          retries++
        } catch (error) {
          console.error(`Lỗi lần thử ${retries}:`, error)
          retries++
        }
      }

      // Tạo câu trả lời tổng hợp
      let summary = ''
      if (searchResults.length === 0) {
        summary = 'Không tìm thấy bài đăng nào phù hợp với yêu cầu của bạn.'

        // Nếu không tìm thấy kết quả, gợi ý những tiêu chí có thể điều chỉnh
        const suggestions = this.suggestCriteriaAdjustments(criteria)
        if (suggestions) {
          summary += ' ' + suggestions
        }
      } else {
        summary = `Tìm thấy ${searchResults.length} bài đăng phù hợp với yêu cầu của bạn.`
      }

      return {
        criteria,
        summary,
        results: searchResults,
        totalFound: searchResults.length,
      }
    } catch (error: any) {
      console.error('Lỗi search:', error)
      return {
        error: error.message,
        criteria: null,
        summary: 'Đã xảy ra lỗi khi tìm kiếm phòng.',
        results: [],
        totalFound: 0,
      }
    }
  }

  /**
   * Nới lỏng các tiêu chí tìm kiếm khi không tìm thấy kết quả
   */
  private relaxCriteria(criteria: any, retryCount: number): any {
    const relaxedCriteria = { ...criteria }

    // Mỗi lần retry, nới lỏng tiêu chí khác nhau
    if (retryCount === 1) {
      // Lần retry đầu tiên: nới lỏng tiêu chí về giá và diện tích
      if (relaxedCriteria.price) {
        if (relaxedCriteria.price.min) {
          relaxedCriteria.price.min = Math.floor(
            relaxedCriteria.price.min * 0.8
          )
        }
        if (relaxedCriteria.price.max) {
          relaxedCriteria.price.max = Math.ceil(relaxedCriteria.price.max * 1.2)
        }
      }

      if (relaxedCriteria.area) {
        if (relaxedCriteria.area.min) {
          relaxedCriteria.area.min = Math.floor(relaxedCriteria.area.min * 0.8)
        }
        if (relaxedCriteria.area.max) {
          relaxedCriteria.area.max = Math.ceil(relaxedCriteria.area.max * 1.2)
        }
      }
    } else if (retryCount === 2) {
      // Lần retry thứ hai: giữ lại chỉ tiêu chí cần thiết và bỏ bớt tiện ích
      // Giữ lại tối đa 2 tiện ích quan trọng nhất
      if (relaxedCriteria.amenities && relaxedCriteria.amenities.length > 2) {
        // Ưu tiên tiện ích quan trọng như máy lạnh, wifi...
        const priorityAmenities = [
          'máy lạnh',
          'wifi',
          'nhà vệ sinh riêng',
          'an ninh',
        ]
        const keptAmenities = relaxedCriteria.amenities
          .filter(a => priorityAmenities.includes(a))
          .slice(0, 2)

        if (keptAmenities.length > 0) {
          relaxedCriteria.amenities = keptAmenities
        } else {
          // Nếu không có tiện ích ưu tiên nào, giữ lại 2 tiện ích đầu tiên
          relaxedCriteria.amenities = relaxedCriteria.amenities.slice(0, 2)
        }
      }

      // Làm mờ tiêu chí về địa chỉ nếu quá cụ thể
      if (relaxedCriteria.address && relaxedCriteria.address.length > 20) {
        // Chỉ giữ lại tên quận/huyện
        const districtMatch = relaxedCriteria.address.match(
          /(quận|huyện|q\.)\s*\d+|((bình thạnh)|(tân bình)|(phú nhuận)|(gò vấp))/i
        )
        if (districtMatch) {
          relaxedCriteria.address = districtMatch[0]
        }
      }
    }

    return relaxedCriteria
  }

  /**
   * Đề xuất điều chỉnh tiêu chí khi không tìm thấy kết quả
   */
  private suggestCriteriaAdjustments(criteria: any): string {
    const suggestions: string[] = []

    if (criteria && criteria.price) {
      suggestions.push('điều chỉnh mức giá để phù hợp hơn')
    }

    if (criteria && criteria.area) {
      suggestions.push('mở rộng phạm vi diện tích bạn chấp nhận được')
    }

    if (criteria && criteria.amenities && criteria.amenities.length > 2) {
      suggestions.push('giảm số lượng tiện ích yêu cầu')
    }

    if (criteria && criteria.address) {
      suggestions.push('mở rộng khu vực tìm kiếm hoặc thử khu vực khác')
    }

    if (suggestions.length === 0) {
      return 'Bạn có thể thử tìm kiếm với những tiêu chí khác.'
    }

    return `Bạn có thể thử ${suggestions.join(', ')} để tìm thấy nhiều lựa chọn hơn.`
  }
}
