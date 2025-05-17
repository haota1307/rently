import { Injectable } from '@nestjs/common'
import { ChatbotOpenAIService } from './openai.service'
import { ChatbotKnowledgeService } from './knowledge.service'
import { ChatbotCacheService } from './cache.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  MessageAnalysisResult,
  SearchCriteria,
  KnowledgeChunk,
} from '../interfaces/chatbot.interfaces'
import { ChatCompletionMessageParam } from 'openai/resources'

@Injectable()
export class ChatbotMessageAnalysisSimplifiedService {
  // Danh sách các tiện ích có trong hệ thống
  private amenities: { id: number; name: string }[] = []

  constructor(
    private readonly openaiService: ChatbotOpenAIService,
    private readonly knowledgeService: ChatbotKnowledgeService,
    private readonly cacheService: ChatbotCacheService,
    private readonly prisma: PrismaService
  ) {
    // Lấy danh sách tiện ích từ CSDL
    this.loadAmenities()
  }

  /**
   * Lấy danh sách tất cả tiện ích từ cơ sở dữ liệu
   */
  private async loadAmenities() {
    try {
      this.amenities = await this.prisma.amenity.findMany({
        select: {
          id: true,
          name: true,
        },
      })
      console.log(`Đã tải ${this.amenities.length} tiện ích từ cơ sở dữ liệu`)
    } catch (error) {
      console.error('Lỗi khi tải danh sách tiện ích:', error)
      // Đặt một danh sách mặc định trong trường hợp không thể tải từ CSDL
      this.amenities = [
        { id: 1, name: 'máy lạnh' },
        { id: 2, name: 'wifi' },
        { id: 3, name: 'nhà vệ sinh riêng' },
        { id: 4, name: 'tủ lạnh' },
        { id: 5, name: 'máy giặt' },
        { id: 6, name: 'gác lửng' },
        { id: 7, name: 'ban công' },
        { id: 8, name: 'bếp' },
        { id: 9, name: 'bàn làm việc' },
      ]
    }
  }

  /**
   * Phân tích tin nhắn người dùng để xác định ý định và trả về kết quả phù hợp
   * Đơn giản hóa bằng cách sử dụng function calling của OpenAI
   */
  async analyzeMessage(message: string): Promise<MessageAnalysisResult> {
    try {
      // Chuẩn hóa tin nhắn để làm khóa cache
      const cacheKey = `intent_${message.toLowerCase().trim().replace(/\s+/g, ' ')}`

      // Kiểm tra cache trước
      const cachedResult =
        this.cacheService.getFromCache<MessageAnalysisResult>(
          'intents',
          cacheKey
        )
      if (cachedResult) {
        return cachedResult
      }

      // Kiểm tra xem có phải toán học đơn giản không
      const mathRegex = /(\d+\s*[\+\-\*\/]\s*\d+)/
      const mathMatch = message.match(mathRegex)
      if (mathMatch) {
        try {
          // eslint-disable-next-line no-eval
          const result = eval(mathMatch[0].replace(/\s/g, ''))
          return {
            intent: 'math',
            content: `Kết quả của phép tính ${mathMatch[0]} là ${result}.`,
          }
        } catch (e) {
          // Nếu không tính được, coi là câu hỏi thông thường
        }
      }

      // Sử dụng OpenAI để phân loại ý định
      const classification = await this.classifyIntent(message)
      let result: MessageAnalysisResult

      // Xử lý theo ý định phân loại được
      switch (classification.intent) {
        case 'search':
          const criteria = await this.extractCriteria(message)
          result = { intent: 'search', content: '', criteria }
          break

        case 'posting_guide':
          result = {
            intent: 'posting_guide',
            content: await this.generateRAGResponse(message, 'posting_guide'),
          }
          break

        case 'advice':
          result = {
            intent: 'advice',
            content: await this.generateRAGResponse(message, 'advice'),
          }
          break

        default:
          result = {
            intent: 'general',
            content: await this.generateRAGResponse(message, 'general'),
          }
      }

      // Lưu kết quả vào cache
      this.cacheService.saveToCache('intents', cacheKey, result, 30 * 60)

      return result
    } catch (error) {
      console.error('Lỗi analyzeMessage:', error)
      return {
        intent: 'general',
        content:
          'Xin lỗi, tôi đang gặp sự cố khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.',
      }
    }
  }

  /**
   * Sử dụng OpenAI để phân loại ý định của người dùng
   */
  private async classifyIntent(message: string): Promise<{ intent: string }> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `Phân loại ý định người dùng thành một trong các loại sau:
            - search: Tìm kiếm phòng trọ, nhà ở
            - posting_guide: Hỏi về cách đăng tin, đăng bài
            - advice: Tìm kiếm lời khuyên về thuê trọ
            - general: Các câu hỏi chung khác
            
            Chỉ trả về loại, không giải thích.`,
        },
        {
          role: 'user',
          content: message,
        },
      ]

      const functions = [
        {
          name: 'classifyIntent',
          description: 'Phân loại ý định của người dùng',
          parameters: {
            type: 'object',
            properties: {
              intent: {
                type: 'string',
                enum: ['search', 'posting_guide', 'advice', 'general'],
                description: 'Ý định của người dùng',
              },
            },
            required: ['intent'],
          },
        },
      ]

      const response = await this.openaiService.createFunctionCall({
        messages,
        functions,
        function_call: { name: 'classifyIntent' },
        model: 'gpt-4o-mini',
      })

      // Kiểm tra null/undefined
      if (!response.function_call) {
        console.warn('Không nhận được function call từ OpenAI')
        return { intent: 'general' }
      }

      return JSON.parse(response.function_call.arguments)
    } catch (error) {
      console.error('Lỗi phân loại ý định:', error)
      return { intent: 'general' }
    }
  }

  /**
   * Tạo câu trả lời sử dụng RAG với prompt engineering đơn giản hóa
   */
  async generateRAGResponse(
    message: string,
    type: 'general' | 'advice' | 'posting_guide'
  ): Promise<string> {
    try {
      // Cache key
      const cacheKey = `rag_${type}_${message.toLowerCase().trim().replace(/\s+/g, '_').substring(0, 50)}`
      const cachedResponse = this.cacheService.getFromCache<string>(
        'responses',
        cacheKey
      )
      if (cachedResponse) {
        return cachedResponse
      }

      // Số lượng đoạn kiến thức cần truy xuất
      const topK = 5

      // Lấy kiến thức liên quan dựa trên loại yêu cầu
      let relevantChunks: KnowledgeChunk[] = []

      if (type === 'posting_guide') {
        // Ưu tiên các đoạn kiến thức về hướng dẫn đăng bài
        const guideChunks =
          this.knowledgeService.getKnowledgeByCategory('posting_guide')
        const embeddingChunks =
          await this.knowledgeService.retrieveRelevantKnowledge(message, 3)
        relevantChunks = [...guideChunks, ...embeddingChunks].slice(0, topK)
      } else if (type === 'advice') {
        // Đối với các câu hỏi tư vấn
        const adviceChunks =
          this.knowledgeService.getKnowledgeByCategory('advice')
        const rentalProcessChunks =
          this.knowledgeService.getKnowledgeByCategory('rental_process')
        const embeddingChunks =
          await this.knowledgeService.retrieveRelevantKnowledge(message, 3)
        relevantChunks = [
          ...adviceChunks,
          ...rentalProcessChunks,
          ...embeddingChunks,
        ].slice(0, topK)
      } else {
        // Tìm kiếm ngữ nghĩa các đoạn kiến thức liên quan
        relevantChunks = await this.knowledgeService.retrieveRelevantKnowledge(
          message,
          topK
        )
      }

      // Kết hợp các đoạn thành context
      const context = relevantChunks
        .map(chunk => {
          const category = chunk.metadata?.category || 'general'
          return `[${category.toUpperCase()}]: ${chunk.content}`
        })
        .join('\n\n')

      // Tạo prompt phù hợp với loại câu hỏi
      const systemPrompt = this.createSystemPrompt(type, context)

      // Sinh câu trả lời với mức độ sáng tạo phù hợp
      const temperature =
        type === 'posting_guide' ? 0.3 : type === 'advice' ? 0.5 : 0.7
      const maxTokens = type === 'general' ? 600 : 800

      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ]

      const chatResponse = await this.openaiService.chatCompletion(
        messages,
        'gpt-4o-mini',
        {
          temperature,
          max_tokens: maxTokens,
        }
      )

      const response =
        chatResponse.choices[0]?.message?.content ||
        'Xin lỗi, tôi không thể tạo câu trả lời lúc này.'

      // Lưu kết quả vào cache
      this.cacheService.saveToCache('responses', cacheKey, response, 30 * 60)

      return response
    } catch (error) {
      console.error('Lỗi generateRAGResponse:', error)
      return 'Xin lỗi, tôi đang gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.'
    }
  }

  /**
   * Tạo system prompt dựa trên loại câu hỏi
   */
  private createSystemPrompt(
    type: 'general' | 'advice' | 'posting_guide',
    context: string
  ): string {
    if (type === 'advice') {
      return `
      Bạn là trợ lý ảo Rently Assistant - chuyên gia tư vấn phòng trọ tại Việt Nam.
      
      KIẾN THỨC CƠ SỞ:
      ${context}
      
      HƯỚNG DẪN TRẢ LỜI:
      - Dựa vào thông tin từ kiến thức cơ sở, không thêm thông tin không có trong nguồn
      - Ngắn gọn khoảng 120-150 từ
      - Phong cách thân thiện, chuyên nghiệp
      - Tóm tắt thông tin quan trọng nhất đầu tiên
      `
    } else if (type === 'posting_guide') {
      return `
      Bạn là trợ lý ảo Rently Assistant của một trang web cho thuê phòng trọ tại Việt Nam.
      
      THÔNG TIN QUY TRÌNH ĐĂNG BÀI:
      ${context}
      
      HƯỚNG DẪN TRẢ LỜI:
      - Hướng dẫn theo các bước rõ ràng, đánh số từ 1-2-3
      - Mỗi bước có giải thích ngắn gọn TẠI SAO điều đó quan trọng
      - Nhấn mạnh: hình ảnh chất lượng, cách viết tiêu đề/mô tả, đặt giá hợp lý
      - Ngôn ngữ đơn giản, dễ hiểu
      `
    } else {
      return `
      Bạn là trợ lý ảo Rently Assistant của một trang web cho thuê phòng trọ hàng đầu tại Việt Nam.
      
      KIẾN THỨC LIÊN QUAN:
      ${context}
      
      HƯỚNG DẪN TRẢ LỜI:
      - Sử dụng thông tin từ kiến thức liên quan ở trên
      - Ngắn gọn, tối đa 5-6 câu
      - Phong cách thân thiện, chuyên nghiệp
      - Sắp xếp thông tin quan trọng nhất lên đầu
      - Nếu không có thông tin, thừa nhận giới hạn thay vì bịa ra
      `
    }
  }

  /**
   * Phân tích tin nhắn người dùng và trích xuất tiêu chí tìm phòng sử dụng function calling
   */
  async extractCriteria(message: string): Promise<SearchCriteria> {
    // Chuẩn hóa tin nhắn để làm khóa cache
    const cacheKey = message.toLowerCase().trim().replace(/\s+/g, ' ')

    // Kiểm tra cache
    const cachedCriteria = this.cacheService.getFromCache<SearchCriteria>(
      'criteria',
      cacheKey
    )
    if (cachedCriteria) {
      return cachedCriteria
    }

    try {
      // Lấy danh sách tiện ích để đưa vào schema
      const amenitiesList = this.amenities.map(a => a.name)

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `Trích xuất tiêu chí tìm phòng trọ từ yêu cầu của người dùng. 
          Phân tích cẩn thận các chi tiết về giá cả, diện tích, tiện ích, vị trí...
          Đặc biệt xử lý tốt các cách ghi giá tiền trong tiếng Việt như "1m5" (1.5 triệu), "2 rưỡi" (2.5 triệu).`,
        },
        {
          role: 'user',
          content: message,
        },
      ]

      const functions = [
        {
          name: 'extractRentalCriteria',
          description:
            'Trích xuất tiêu chí tìm phòng từ yêu cầu của người dùng',
          parameters: {
            type: 'object',
            properties: {
              price: {
                type: 'object',
                properties: {
                  min: { type: 'number', description: 'Giá tối thiểu (VND)' },
                  max: { type: 'number', description: 'Giá tối đa (VND)' },
                },
              },
              area: {
                type: 'object',
                properties: {
                  min: {
                    type: 'number',
                    description: 'Diện tích tối thiểu (m2)',
                  },
                  max: { type: 'number', description: 'Diện tích tối đa (m2)' },
                },
              },
              amenities: {
                type: 'array',
                items: { type: 'string', enum: amenitiesList },
                description: 'Danh sách tiện ích cần có',
              },
              address: {
                type: 'string',
                description: 'Khu vực hoặc địa chỉ quan tâm',
              },
              distance: {
                type: 'object',
                properties: {
                  max: {
                    type: 'number',
                    description: 'Khoảng cách tối đa (km)',
                  },
                  location: {
                    type: 'string',
                    description: 'Địa điểm tham chiếu',
                  },
                },
              },
              userType: {
                type: 'string',
                description:
                  'Đối tượng người thuê (sinh viên, người đi làm...)',
              },
              roomType: {
                type: 'string',
                description: 'Loại phòng (phòng trọ, căn hộ mini...)',
              },
              sortBy: {
                type: 'string',
                enum: ['price', 'area', 'created_at'],
                description: 'Tiêu chí sắp xếp kết quả',
              },
              sortOrder: {
                type: 'string',
                enum: ['asc', 'desc'],
                description: 'Thứ tự sắp xếp (asc: tăng dần, desc: giảm dần)',
              },
              onlyTopResult: {
                type: 'boolean',
                description: 'Chỉ lấy kết quả cao nhất/thấp nhất',
              },
            },
          },
        },
      ]

      const response = await this.openaiService.createFunctionCall({
        messages,
        functions,
        function_call: { name: 'extractRentalCriteria' },
        model: 'gpt-4o-mini',
      })

      // Kiểm tra null/undefined
      if (!response.function_call) {
        console.warn('Không nhận được function call từ OpenAI')
        return {}
      }

      const criteria = JSON.parse(response.function_call.arguments)

      // Lưu kết quả vào cache
      this.cacheService.saveToCache('criteria', cacheKey, criteria)

      return criteria
    } catch (error) {
      console.error('Lỗi extractCriteria:', error)

      // Trả về đối tượng trống nếu có lỗi
      return {}
    }
  }

  /**
   * Đề xuất điều chỉnh tiêu chí khi không tìm thấy kết quả
   */
  suggestCriteriaAdjustments(criteria: SearchCriteria): string {
    const suggestions: string[] = []

    if (criteria?.price) {
      suggestions.push('điều chỉnh mức giá để phù hợp hơn')
    }

    if (criteria?.area) {
      suggestions.push('mở rộng phạm vi diện tích bạn chấp nhận được')
    }

    if (criteria?.amenities && criteria.amenities.length > 2) {
      suggestions.push('giảm số lượng tiện ích yêu cầu')
    }

    if (criteria?.address) {
      suggestions.push('mở rộng khu vực tìm kiếm hoặc thử khu vực khác')
    }

    if (suggestions.length === 0) {
      return 'Bạn có thể thử tìm kiếm với những tiêu chí khác.'
    }

    return `Bạn có thể thử ${suggestions.join(', ')} để tìm thấy nhiều lựa chọn hơn.`
  }

  /**
   * Nới lỏng các tiêu chí tìm kiếm khi không tìm thấy kết quả
   */
  relaxCriteria(criteria: SearchCriteria): SearchCriteria {
    // Sử dụng OpenAI để điều chỉnh tiêu chí thông minh hơn
    return {
      ...criteria,
      price: criteria.price
        ? {
            min: criteria.price.min
              ? Math.floor(criteria.price.min * 0.8)
              : undefined,
            max: criteria.price.max
              ? Math.ceil(criteria.price.max * 1.2)
              : undefined,
          }
        : undefined,
      area: criteria.area
        ? {
            min: criteria.area.min
              ? Math.floor(criteria.area.min * 0.8)
              : undefined,
            max: criteria.area.max
              ? Math.ceil(criteria.area.max * 1.2)
              : undefined,
          }
        : undefined,
      amenities:
        criteria.amenities && criteria.amenities.length > 2
          ? criteria.amenities.slice(0, 2)
          : criteria.amenities,
    }
  }
}
