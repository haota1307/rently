import { Injectable } from '@nestjs/common'
import { ChatbotKnowledgeService } from './services/knowledge.service'
import { ChatbotMessageAnalysisSimplifiedService } from './services/message-analysis-simplified.service'
import { ChatbotSearchService } from './services/search.service'
import { ChatbotHistoryService } from './services/history.service'
import { SearchResult } from './interfaces/chatbot.interfaces'

@Injectable()
export class ChatbotService {
  // Thêm flag để chuyển đổi giữa phiên bản đầy đủ và phiên bản đơn giản
  private useLegacyAnalysis: boolean = false

  constructor(
    private readonly knowledgeService: ChatbotKnowledgeService,
    private readonly messageAnalysisSimplifiedService: ChatbotMessageAnalysisSimplifiedService,
    private readonly searchService: ChatbotSearchService,
    private readonly historyService: ChatbotHistoryService
  ) {}

  /**
   * Set phiên bản analysis - tạm thời để trong code, sau có thể chuyển sang biến môi trường
   * @param useLegacy True để sử dụng phiên bản cũ, false để sử dụng phiên bản mới đơn giản hóa
   */
  setAnalysisVersion(useLegacy: boolean) {
    this.useLegacyAnalysis = useLegacy
  }

  /**
   * Lấy dịch vụ phân tích tin nhắn phù hợp
   */
  private getMessageAnalysisService() {
    return this.messageAnalysisSimplifiedService
  }

  /**
   * Xử lý tin nhắn tìm kiếm từ người dùng
   */
  async search(
    message: string,
    userId?: number
  ): Promise<SearchResult | { content: string }> {
    // Lưu tin nhắn vào lịch sử nếu có userId
    if (userId) {
      await this.historyService.saveMessage(userId, message, 'user')
    }

    try {
      // Lấy dịch vụ phân tích phù hợp
      const analysisService = this.getMessageAnalysisService()

      // Phân tích tin nhắn để xác định ý định
      const analysis = await analysisService.analyzeMessage(message)

      // Dựa vào ý định để xử lý tin nhắn
      if (analysis.intent === 'search') {
        // Thực hiện tìm kiếm phòng trọ với các tiêu chí đã trích xuất
        const searchResult = await this.searchService.searchRooms(
          analysis.criteria
        )

        // Lưu kết quả vào lịch sử
        if (userId) {
          await this.historyService.saveMessage(
            userId,
            searchResult.summary,
            'bot',
            searchResult
          )
        }

        return searchResult
      } else {
        // Đây là tin nhắn thông thường, trả về nội dung đã được tạo
        // Lưu kết quả vào lịch sử
        if (userId) {
          await this.historyService.saveMessage(userId, analysis.content, 'bot')
        }

        return { content: analysis.content }
      }
    } catch (error) {
      console.error('Lỗi xử lý tin nhắn:', error)
      const errorMessage =
        'Xin lỗi, tôi đang gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.'

      // Ghi lại tin nhắn lỗi nếu có userId
      if (userId) {
        await this.historyService.saveMessage(userId, errorMessage, 'bot')
      }

      return { content: errorMessage }
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
