import { Injectable } from '@nestjs/common'
import { ChatbotMessageAnalysisSimplifiedService } from '../chatbot/services/message-analysis-simplified.service'
import { ChatbotSearchService } from '../chatbot/services/search.service'
import { ChatbotCacheService } from '../chatbot/services/cache.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import { SearchCriteria } from '../chatbot/interfaces/chatbot.interfaces'

export interface EnhancedSearchCriteria extends SearchCriteria {
  petFriendly?: boolean
  targetAudience?: string[]
  specialRequirements?: string[]
  semanticQuery?: string
}

@Injectable()
export class SmartSearchService {
  constructor(
    private readonly messageAnalysisService: ChatbotMessageAnalysisSimplifiedService,
    private readonly searchService: ChatbotSearchService,
    private readonly cacheService: ChatbotCacheService,
    private readonly prisma: PrismaService
  ) {}

  async intelligentSearch(
    query: string,
    options?: {
      userId?: number
      additionalFilters?: any
    }
  ) {
    try {
      // 1. Phân tích query bằng AI (tái sử dụng từ chatbot)
      const analysis = await this.messageAnalysisService.analyzeMessage(query)

      if (analysis.intent !== 'search') {
        // Nếu không phải intent search, cố gắng extract criteria trực tiếp
        const criteria =
          await this.messageAnalysisService.extractCriteria(query)
        const enhancedCriteria = await this.enhanceCriteria(criteria, query)
        const finalCriteria = this.mergeCriteria(
          enhancedCriteria,
          options?.additionalFilters
        )

        const searchResult = await this.searchService.searchRooms(finalCriteria)

        return {
          originalQuery: query,
          extractedCriteria: finalCriteria,
          intent: 'search',
          ...searchResult,
          suggestions: await this.getSearchSuggestions(query),
        }
      }

      // 2. Mở rộng criteria với logic mới
      const enhancedCriteria = await this.enhanceCriteria(
        analysis.criteria || {},
        query
      )

      // 3. Merge với filters bổ sung từ UI
      const finalCriteria = this.mergeCriteria(
        enhancedCriteria,
        options?.additionalFilters
      )

      // 4. Thực hiện search (tái sử dụng từ chatbot)
      const searchResult = await this.searchService.searchRooms(finalCriteria)

      // 5. Enhance kết quả với thông tin thêm
      const enhancedResults = await this.enhanceSearchResults(
        searchResult,
        query,
        options?.userId
      )

      return {
        originalQuery: query,
        extractedCriteria: finalCriteria,
        intent: analysis.intent,
        ...enhancedResults,
        suggestions: await this.getSearchSuggestions(query),
      }
    } catch (error) {
      console.error('Smart search error:', error)
      return {
        originalQuery: query,
        error: 'Có lỗi xảy ra khi tìm kiếm',
        results: [],
        totalFound: 0,
        summary: 'Không thể thực hiện tìm kiếm lúc này',
      }
    }
  }

  async enhanceCriteria(
    baseCriteria: SearchCriteria,
    originalQuery: string
  ): Promise<EnhancedSearchCriteria> {
    const query = originalQuery.toLowerCase()

    // Detect pet-friendly requirement
    const petFriendly = this.detectPetFriendly(query)

    // Detect target audience
    const targetAudience = this.detectTargetAudience(query)

    // Detect special requirements
    const specialRequirements = this.detectSpecialRequirements(query)

    return {
      ...baseCriteria,
      petFriendly,
      targetAudience,
      specialRequirements,
      semanticQuery: originalQuery,
    }
  }

  private detectPetFriendly(query: string): boolean {
    const petKeywords = [
      'thú cưng',
      'nuôi chó',
      'nuôi mèo',
      'pet',
      'thú nuôi',
      'cho phép nuôi',
      'được nuôi',
      'nuôi thú',
    ]
    return petKeywords.some(keyword => query.includes(keyword))
  }

  private detectTargetAudience(query: string): string[] {
    const audiences: string[] = []
    if (query.includes('sinh viên') || query.includes('học sinh'))
      audiences.push('STUDENT')
    if (
      query.includes('người đi làm') ||
      query.includes('nhân viên') ||
      query.includes('công sở')
    )
      audiences.push('WORKER')
    if (query.includes('gia đình') || query.includes('vợ chồng'))
      audiences.push('FAMILY')
    if (query.includes('nam') || query.includes('nam giới'))
      audiences.push('MALE')
    if (
      query.includes('nữ') ||
      query.includes('nữ giới') ||
      query.includes('female')
    )
      audiences.push('FEMALE')
    return audiences
  }

  private detectSpecialRequirements(query: string): string[] {
    const requirements: string[] = []
    if (query.includes('yên tĩnh') || query.includes('im lặng'))
      requirements.push('QUIET')
    if (query.includes('gần trường') || query.includes('gần đại học'))
      requirements.push('NEAR_SCHOOL')
    if (query.includes('gần chợ') || query.includes('gần siêu thị'))
      requirements.push('NEAR_MARKET')
    if (query.includes('an ninh') || query.includes('bảo vệ'))
      requirements.push('SECURITY')
    if (query.includes('mới') || query.includes('mới xây'))
      requirements.push('NEW_BUILDING')
    return requirements
  }

  private mergeCriteria(
    enhanced: EnhancedSearchCriteria,
    additional?: any
  ): EnhancedSearchCriteria {
    if (!additional) return enhanced

    return {
      ...enhanced,
      ...additional,
      amenities: [
        ...(enhanced.amenities || []),
        ...(additional.amenities || []),
      ],
      targetAudience: [
        ...(enhanced.targetAudience || []),
        ...(additional.targetAudience || []),
      ],
    }
  }

  async enhanceSearchResults(
    searchResult: any,
    query: string,
    userId?: number
  ) {
    // Thêm thông tin bổ sung cho kết quả
    const enhancedResults = searchResult.results.map((result: any) => ({
      ...result,
      matchScore: this.calculateMatchScore(result, query),
      isRecommended: this.isRecommended(result, query),
    }))

    // Sắp xếp lại theo điểm match
    enhancedResults.sort((a: any, b: any) => b.matchScore - a.matchScore)

    return {
      ...searchResult,
      results: enhancedResults,
    }
  }

  private calculateMatchScore(result: any, query: string): number {
    let score = 0
    const queryLower = query.toLowerCase()

    // Điểm cho title match
    if (result.title?.toLowerCase().includes(queryLower.split(' ')[0]))
      score += 10

    // Điểm cho amenities match
    const queryAmenities = this.extractAmenitiesFromQuery(queryLower)
    const matchedAmenities =
      result.amenities?.filter((amenity: string) =>
        queryAmenities.some(qa => amenity.toLowerCase().includes(qa))
      ).length || 0
    score += matchedAmenities * 5

    // Điểm cho address match
    if (
      result.address?.toLowerCase().includes('cần thơ') &&
      queryLower.includes('cần thơ')
    )
      score += 8

    return score
  }

  private extractAmenitiesFromQuery(query: string): string[] {
    const amenityKeywords = [
      'máy lạnh',
      'wifi',
      'tủ lạnh',
      'máy giặt',
      'bếp',
      'ban công',
      'gác lửng',
    ]
    return amenityKeywords.filter(keyword => query.includes(keyword))
  }

  private isRecommended(result: any, query: string): boolean {
    const score = this.calculateMatchScore(result, query)
    return score >= 15
  }

  async getSearchSuggestions(
    query: string
  ): Promise<{ suggestions: string[] }> {
    const cacheKey = `suggestions_${query.toLowerCase().substring(0, 20)}`
    const cached = this.cacheService.getFromCache('responses', cacheKey)
    if (cached) return { suggestions: cached as string[] }

    const suggestions = [
      'Phòng trọ sinh viên có máy lạnh wifi',
      'Căn hộ mini gần đại học Nam Cần Thơ',
      'Phòng trọ cho nuôi thú cưng có bếp',
      'Nhà nguyên căn cho gia đình thuê',
      'Phòng trọ giá rẻ dưới 2 triệu',
      'Căn hộ cao cấp đầy đủ nội thất',
    ]

    const filteredSuggestions = suggestions.filter(
      s =>
        s.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(s.toLowerCase().split(' ')[0])
    )

    this.cacheService.saveToCache(
      'responses',
      cacheKey,
      filteredSuggestions,
      60 * 30
    )

    return { suggestions: filteredSuggestions }
  }

  async analyzeQuery(query: string) {
    try {
      const analysis = await this.messageAnalysisService.analyzeMessage(query)
      const criteria =
        analysis.intent === 'search'
          ? analysis.criteria
          : await this.messageAnalysisService.extractCriteria(query)
      const enhanced = await this.enhanceCriteria(criteria || {}, query)

      return {
        query,
        intent: analysis.intent,
        criteria: enhanced,
        summary: this.generateCriteriaSummary(enhanced),
      }
    } catch (error) {
      console.error('Query analysis error:', error)
      return {
        query,
        intent: 'unknown',
        criteria: {},
        summary: 'Không thể phân tích truy vấn',
      }
    }
  }

  private generateCriteriaSummary(criteria: EnhancedSearchCriteria): string {
    const parts: string[] = []

    if (criteria.price) {
      const priceText = criteria.price.max
        ? `giá dưới ${(criteria.price.max / 1000000).toFixed(1)} triệu`
        : `giá từ ${(criteria.price.min! / 1000000).toFixed(1)} triệu`
      parts.push(priceText)
    }

    if (criteria.area) {
      parts.push(
        `diện tích ${criteria.area.min || 'từ'}${criteria.area.max ? ` - ${criteria.area.max}` : '+'}m²`
      )
    }

    if (criteria.amenities?.length) {
      parts.push(`có ${criteria.amenities.join(', ')}`)
    }

    if (criteria.targetAudience?.length) {
      const audienceMap: Record<string, string> = {
        STUDENT: 'sinh viên',
        WORKER: 'người đi làm',
        FAMILY: 'gia đình',
      }
      const audiences = criteria.targetAudience
        .map(a => audienceMap[a] || a)
        .join(', ')
      parts.push(`phù hợp cho ${audiences}`)
    }

    if (criteria.petFriendly) {
      parts.push('cho phép nuôi thú cưng')
    }

    if (criteria.address) {
      parts.push(`tại ${criteria.address}`)
    }

    return parts.length > 0
      ? `Tìm phòng ${parts.join(', ')}`
      : 'Tìm kiếm phòng trọ'
  }
}
