import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common'
import { RentalService } from 'src/routes/rental/rental.service'
import { RoomService } from 'src/routes/room/room.service'
import { PostService } from 'src/routes/post/post.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ChatbotKnowledgeService } from './services/knowledge.service'
import { ChatbotOpenAIService } from './services/openai.service'
import { ChatbotCacheService } from './services/cache.service'
import { ChatbotMessageAnalysisService } from './services/message-analysis.service'
import { ChatbotSearchService } from './services/search.service'
import { ChatbotHistoryService } from './services/history.service'
import { SearchCriteria, SearchResult } from './interfaces/chatbot.interfaces'

@Injectable()
export class ChatbotService {
  constructor(
    private readonly rentalService: RentalService,
    private readonly roomService: RoomService,
    private readonly postService: PostService,
    private readonly prisma: PrismaService,
    private readonly knowledgeService: ChatbotKnowledgeService,
    private readonly openaiService: ChatbotOpenAIService,
    private readonly cacheService: ChatbotCacheService,
    private readonly messageAnalysisService: ChatbotMessageAnalysisService,
    private readonly searchService: ChatbotSearchService,
    private readonly historyService: ChatbotHistoryService
  ) {}

  /**
   * Chuyển đổi từ tin nhắn người dùng sang kết quả tìm kiếm
   * Với cơ chế retry, fallback và tích hợp RAG
   */
  async search(message: string, userId?: number): Promise<SearchResult> {
    try {
      // Phân tích tin nhắn để xác định ý định
      const analysis = await this.messageAnalysisService.analyzeMessage(message)

      // Nếu là câu hỏi toán học hoặc câu hỏi chung
      if (analysis.intent === 'math' || analysis.intent === 'general') {
        const result = {
          summary: analysis.content,
          results: [],
          totalFound: 0,
        }

        // Lưu cuộc hội thoại vào database
        await this.historyService.saveChatMessage(
          message,
          result.summary,
          null,
          [],
          userId
        )

        return result
      }

      // Nếu là yêu cầu tư vấn - sử dụng RAG để trả lời chi tiết hơn
      if (analysis.intent === 'advice') {
        const adviceResponse =
          await this.messageAnalysisService.generateAdviceResponse(message)
        const result = {
          summary: adviceResponse,
          results: [],
          totalFound: 0,
        }

        // Lưu cuộc hội thoại vào database
        await this.historyService.saveChatMessage(
          message,
          result.summary,
          null,
          [],
          userId
        )

        return result
      }

      // Nếu là hướng dẫn đăng bài
      if (analysis.intent === 'posting_guide') {
        const postingGuideResponse =
          await this.messageAnalysisService.generateRAGResponse(
            message,
            'posting_guide'
          )
        const result = {
          summary: postingGuideResponse,
          results: [],
          totalFound: 0,
        }

        // Lưu cuộc hội thoại vào database
        await this.historyService.saveChatMessage(
          message,
          result.summary,
          null,
          [],
          userId
        )

        return result
      }

      // Với ý định tìm kiếm, tiếp tục xử lý với RAG để cải thiện kết quả
      // Số lần thử lại tối đa
      const MAX_RETRIES = 2
      let retries = 0
      let searchResults: any[] = []
      const criteria = analysis.criteria as SearchCriteria

      // Luồng hoạt động chính
      while (retries <= MAX_RETRIES && searchResults.length === 0) {
        try {
          // Mỗi lần retry, giảm bớt các tiêu chí khắt khe để tìm được nhiều kết quả hơn
          let currentCriteria = criteria
          if (retries > 0) {
            currentCriteria = this.messageAnalysisService.relaxCriteria(
              criteria,
              retries
            )
          }

          // Tìm kiếm các bài đăng phù hợp
          searchResults =
            await this.searchService.searchPostsByRoomCriteria(currentCriteria)

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
        // Sử dụng RAG để đưa ra phản hồi thông minh khi không tìm thấy kết quả
        summary = await this.searchService.generateNoResultsResponse(
          message,
          criteria
        )
      } else if (searchResults.length === 1 && criteria.onlyTopResult) {
        // Nếu người dùng yêu cầu lấy kết quả cao nhất/thấp nhất và chỉ có 1 kết quả
        if (criteria.sortBy === 'price' && criteria.sortOrder === 'desc') {
          summary = `Đã tìm thấy phòng có giá cao nhất là ${searchResults[0].price.toLocaleString('vi-VN')} VND.`
        } else if (
          criteria.sortBy === 'price' &&
          criteria.sortOrder === 'asc'
        ) {
          summary = `Đã tìm thấy phòng có giá thấp nhất là ${searchResults[0].price.toLocaleString('vi-VN')} VND.`
        } else {
          summary = `Đã tìm thấy 1 bài đăng phù hợp với yêu cầu của bạn.`
        }
      } else {
        summary = `Tìm thấy ${searchResults.length} bài đăng phù hợp với yêu cầu của bạn.`
      }

      const result = {
        criteria,
        summary,
        results: searchResults,
        totalFound: searchResults.length,
      }

      // Lưu cuộc hội thoại vào database
      await this.historyService.saveChatMessage(
        message,
        summary,
        criteria,
        searchResults,
        userId
      )

      return result
    } catch (error: any) {
      console.error('Lỗi search:', error)
      const errorMessage = 'Đã xảy ra lỗi khi xử lý tin nhắn của bạn.'

      // Lưu cuộc hội thoại lỗi vào database
      await this.historyService.saveChatMessage(
        message,
        errorMessage,
        null,
        [],
        userId
      )

      return {
        error: error.message,
        summary: errorMessage,
        results: [],
        totalFound: 0,
      }
    }
  }

  /**
   * Các phương thức proxy để gọi đến các service khác
   */

  // Knowledge service methods
  async addKnowledge(content: string, category: string) {
    return this.knowledgeService.addKnowledge(content, category)
  }

  async addKnowledgeFromFile(file: any, category: string) {
    return this.knowledgeService.addKnowledgeFromFile(file, category)
  }

  async listKnowledge(category?: string) {
    return this.knowledgeService.listKnowledge(category)
  }

  async deleteKnowledge(id: string) {
    return this.knowledgeService.deleteKnowledge(id)
  }

  async searchKnowledge(query: string) {
    return this.knowledgeService.searchKnowledge(query)
  }

  // History service method
  async getChatHistory(userId: number, limit: number = 10, offset: number = 0) {
    return this.historyService.getChatHistory(userId, limit, offset)
  }
}
