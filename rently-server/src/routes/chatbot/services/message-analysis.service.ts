import { Injectable } from '@nestjs/common'
import { ChatbotOpenAIService } from './openai.service'
import { ChatbotKnowledgeService } from './knowledge.service'
import { ChatbotCacheService } from './cache.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  MessageAnalysisResult,
  SearchCriteria,
} from '../interfaces/chatbot.interfaces'
import {
  amenitySynonyms,
  importantPhrases,
  vietnameseStopWords,
} from '../utils/synonyms'

@Injectable()
export class ChatbotMessageAnalysisService {
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
   * Đã tích hợp RAG để nâng cao chất lượng câu trả lời
   */
  async analyzeMessage(message: string): Promise<MessageAnalysisResult> {
    try {
      // Chuẩn hóa tin nhắn để làm khóa cache
      const cacheKey = `intent_${message.toLowerCase().trim().replace(/\s+/g, ' ')}`

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

      // Chuyển đổi tin nhắn về chữ thường để dễ so sánh
      const lowerMessage = message.toLowerCase()

      // Kiểm tra các từ khóa liên quan đến tìm phòng
      const searchKeywords =
        /(tìm phòng|thuê phòng|giá phòng|phòng trọ|ở đâu có phòng|cần thuê|muốn thuê|cho thuê)/i
      const adviceKeywords =
        /(tư vấn|lời khuyên|kinh nghiệm|nên làm gì|cần lưu ý|thủ tục|quy trình|hợp đồng)/i
      const postingGuideKeywords =
        /(đăng bài|đăng tin|đăng phòng|cách đăng|hướng dẫn đăng|làm sao để đăng|đăng cho thuê|đưa phòng lên|thêm phòng|tạo bài đăng|tạo tin|đăng thông tin|làm thế nào để đăng)/i

      // Kiểm tra các từ khóa khoảng cách trước để ưu tiên tìm kiếm
      const distanceKeywords =
        /(dưới|trong khoảng|trong phạm vi|gần|cách|trong bán kính|<|<=)\s*(\d+(?:\.\d+)?)\s*(km|m|cây số|mét|kilomet|ki lô mét)?/i
      if (distanceKeywords.test(lowerMessage)) {
        // Nếu là tìm kiếm với khoảng cách, sử dụng phương thức trích xuất tiêu chí
        const criteria = await this.extractCriteria(message)
        return {
          intent: 'search',
          content: '',
          criteria,
        }
      }

      // Xử lý ưu tiên theo thứ tự từ cụ thể đến chung
      if (postingGuideKeywords.test(message)) {
        return {
          intent: 'posting_guide',
          content: await this.generateRAGResponse(message, 'posting_guide'),
        }
      }

      if (searchKeywords.test(message)) {
        // Phân tích sâu hơn để xác định xem đây có phải là yêu cầu hướng dẫn đăng bài không
        if (
          lowerMessage.includes('đăng') ||
          lowerMessage.includes('bán') ||
          (lowerMessage.includes('cho thuê') &&
            (lowerMessage.includes('làm sao') ||
              lowerMessage.includes('thế nào') ||
              lowerMessage.includes('hướng dẫn') ||
              lowerMessage.includes('cách')))
        ) {
          return {
            intent: 'posting_guide',
            content: await this.generateRAGResponse(message, 'posting_guide'),
          }
        }

        // Nếu là tìm kiếm phòng, sử dụng phương thức trích xuất tiêu chí
        const criteria = await this.extractCriteria(message)
        return {
          intent: 'search',
          content: '',
          criteria,
        }
      }

      if (adviceKeywords.test(message)) {
        return {
          intent: 'advice',
          content: '',
        }
      }

      // Với các tin nhắn thông thường, sử dụng GPT kết hợp với kiến thức liên quan
      return {
        intent: 'general',
        content: await this.generateRAGResponse(message, 'general'),
      }
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
   * Tạo câu trả lời sử dụng kiến thức từ kho RAG với prompt engineering cải tiến
   */
  async generateRAGResponse(
    message: string,
    type: 'general' | 'advice' | 'posting_guide'
  ): Promise<string> {
    try {
      // Số lượng chunk tối ưu để truy xuất, tăng từ 5 lên 7 cho context đầy đủ hơn
      const topK = 7

      // Trích xuất từ khóa từ tin nhắn của người dùng
      const keywords = this.extractKeywords(message.toLowerCase())

      // Cache key cho response để tránh gọi API nhiều lần với cùng câu hỏi
      const cacheKey = `rag_${type}_${message.toLowerCase().trim().replace(/\s+/g, '_').substring(0, 50)}`
      const cachedResponse = this.cacheService.getFromCache<string>(
        'responses',
        cacheKey
      )
      if (cachedResponse) {
        return cachedResponse
      }

      // Truy xuất kiến thức liên quan dựa trên loại yêu cầu
      let relevantChunks: any[] = []

      if (type === 'posting_guide') {
        // Ưu tiên các đoạn kiến thức về hướng dẫn đăng bài
        relevantChunks =
          this.knowledgeService.getKnowledgeByCategory('posting_guide')

        // Bổ sung thêm thông tin liên quan từ embedding
        const embeddingChunks =
          await this.knowledgeService.retrieveRelevantKnowledge(
            message,
            Math.round(topK / 2)
          )
        // Kết hợp và loại bỏ trùng lặp
        relevantChunks = this.mergeAndDeduplicateChunks([
          ...relevantChunks,
          ...embeddingChunks,
        ])
      } else if (type === 'advice') {
        // Đối với các câu hỏi tư vấn, kết hợp nhiều nguồn kiến thức
        const adviceChunks =
          this.knowledgeService.getKnowledgeByCategory('advice')
        const rentalProcessChunks =
          this.knowledgeService.getKnowledgeByCategory('rental_process')

        // Tìm thêm thông tin từ embedding với ngữ cảnh mở rộng
        const embeddingChunks =
          await this.knowledgeService.retrieveRelevantKnowledge(message, topK)

        // Kết hợp tất cả và loại bỏ trùng lặp
        relevantChunks = this.mergeAndDeduplicateChunks([
          ...adviceChunks,
          ...rentalProcessChunks,
          ...embeddingChunks,
        ])
      } else {
        // Tìm kiếm ngữ nghĩa các đoạn kiến thức liên quan với số lượng lớn hơn
        relevantChunks = await this.knowledgeService.retrieveRelevantKnowledge(
          message,
          topK
        )
      }

      // Sắp xếp lại các chunk kiến thức dựa trên mức độ liên quan với từ khóa
      relevantChunks = this.reRankChunksByKeywords(relevantChunks, keywords)

      // Tối ưu hóa context bằng cách giới hạn độ dài nhưng ưu tiên nội dung có liên quan cao
      const context = this.optimizeContext(relevantChunks, message, 2500)

      // Tạo prompt phù hợp với loại câu hỏi
      let prompt = this.createPromptByType(message, context, type)

      // Sinh câu trả lời với mức độ sáng tạo và yếu tố ngẫu nhiên phù hợp
      const temperature =
        type === 'posting_guide' ? 0.3 : type === 'advice' ? 0.5 : 0.7
      const maxTokens = type === 'general' ? 800 : 1200

      const response = await this.openaiService.generateCompletion(
        prompt,
        'gpt-4o-mini',
        temperature,
        maxTokens
      )

      // Lưu kết quả vào cache (thời gian 30 phút)
      this.cacheService.saveToCache('responses', cacheKey, response, 30 * 60)

      return response
    } catch (error) {
      console.error('Lỗi generateRAGResponse:', error)
      return 'Xin lỗi, tôi đang gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.'
    }
  }

  /**
   * Tạo prompt tùy chỉnh theo loại câu hỏi
   */
  private createPromptByType(
    message: string,
    context: string,
    type: 'general' | 'advice' | 'posting_guide'
  ): string {
    if (type === 'advice') {
      return `
      Bạn là trợ lý ảo Rently Assistant - một chuyên gia tư vấn phòng trọ và bất động sản cho thuê tại Việt Nam.
      Nhiệm vụ của bạn là cung cấp lời khuyên chính xác, hữu ích và phù hợp với thị trường Việt Nam.
      
      KIẾN THỨC CƠ SỞ:
      ${context}
      
      CÂU HỎI: "${message}"
      
      HƯỚNG DẪN TRẢ LỜI:
      - LUÔN dựa vào thông tin từ kiến thức cơ sở, KHÔNG được thêm thông tin không có trong nguồn.
      - Nếu kiến thức cơ sở không đủ, hãy thừa nhận giới hạn của mình, KHÔNG được tự ý bịa ra thông tin.
      - Trả lời theo cấu trúc: điểm chính, giải thích, lưu ý (nếu có).
      - Ngôn ngữ: thân thiện, chuyên nghiệp, đơn giản dễ hiểu.
      - Độ dài: ngắn gọn súc tích (120-150 từ).
      - Nếu có nhiều góc nhìn, hãy cung cấp các lựa chọn và để người dùng quyết định.
      - Tóm tắt thông tin quan trọng nhất đầu tiên, sau đó mới đến chi tiết.
      
      TRẢ LỜI (tiếng Việt):
      `
    } else if (type === 'posting_guide') {
      return `
      Bạn là trợ lý ảo Rently Assistant của một trang web cho thuê phòng trọ tại Việt Nam.
      Bạn sẽ hướng dẫn người dùng cách đăng bài cho thuê phòng trọ hiệu quả trên nền tảng Rently.
      
      THÔNG TIN CHI TIẾT VỀ QUY TRÌNH ĐĂNG BÀI RENTLY:
      ${context}
      
      CÂU HỎI CỤ THỂ: "${message}"
      
      HƯỚNG DẪN TRẢ LỜI:
      - LUÔN dựa vào thông tin chính thức trong kiến thức cơ sở.
      - Hướng dẫn theo các bước rõ ràng, đánh số từ 1-2-3.
      - Mỗi bước đi kèm giải thích ngắn gọn TẠI SAO điều đó quan trọng.
      - Đặc biệt nhấn mạnh:
        * Tầm quan trọng của hình ảnh chất lượng
        * Cách viết tiêu đề và mô tả hấp dẫn
        * Đặt giá hợp lý
        * Thông tin liên hệ đầy đủ
      - Ngôn ngữ: đơn giản, trực quan, dễ hiểu với người không rành công nghệ.
      - Nếu có các lựa chọn nâng cao hoặc tính năng cao cấp, hãy đề cập nhưng đánh dấu rõ là tùy chọn.
      
      HƯỚNG DẪN CHI TIẾT (tiếng Việt):
      `
    } else {
      return `
      Bạn là trợ lý ảo Rently Assistant của một trang web cho thuê phòng trọ hàng đầu tại Việt Nam.
      Bạn có kiến thức chuyên sâu về thị trường phòng trọ, quy trình thuê phòng, và các vấn đề liên quan.
      
      KIẾN THỨC LIÊN QUAN:
      ${context}
      
      CÂU HỎI: "${message}"
      
      HƯỚNG DẪN TRẢ LỜI:
      - LUÔN sử dụng thông tin từ kiến thức liên quan ở trên.
      - Câu trả lời phải ngắn gọn, đi thẳng vào vấn đề, tối đa 5-6 câu.
      - Phong cách: thân thiện, cởi mở, chuyên nghiệp.
      - Ngôn ngữ: tiếng Việt chuẩn, dễ hiểu, tránh từ ngữ phức tạp.
      - Sắp xếp: thông tin quan trọng nhất lên đầu.
      - Nếu không có thông tin trong kiến thức liên quan, KHÔNG được tự ý bịa ra, hãy thừa nhận là bạn không có thông tin và đề xuất người dùng hỏi chủ đề khác hoặc liên hệ nhân viên hỗ trợ.
      - Nhớ giới thiệu bạn là Rently Assistant nếu câu hỏi liên quan đến danh tính của bạn.
      
      TRẢ LỜI (tiếng Việt, ngắn gọn, không quá 100 từ):
      `
    }
  }

  /**
   * Kết hợp và loại bỏ các chunk trùng lặp
   */
  private mergeAndDeduplicateChunks(chunks: any[]): any[] {
    const uniqueIds = new Set()
    return chunks.filter(chunk => {
      if (!chunk.id || uniqueIds.has(chunk.id)) return false
      uniqueIds.add(chunk.id)
      return true
    })
  }

  /**
   * Tối ưu hóa context bằng cách giới hạn độ dài nhưng ưu tiên nội dung có liên quan cao
   */
  private optimizeContext(
    chunks: any[],
    query: string,
    maxLength: number
  ): string {
    if (chunks.length === 0) return ''

    // Tính điểm liên quan cho các chunk dựa trên mức độ phù hợp với query
    const scoredChunks = chunks.map(chunk => {
      // Chuẩn hóa cả query và nội dung chunk để so sánh
      const normalizedQuery = this.normalizeText(query)
      const normalizedContent = this.normalizeText(chunk.content)

      // Tính điểm dựa trên số lượng từ trong query xuất hiện trong chunk
      const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2)
      let score = 0

      for (const word of queryWords) {
        if (normalizedContent.includes(word)) {
          score += 1
        }
      }

      // Tính điểm dựa trên danh mục (category) của chunk
      if (chunk.metadata && chunk.metadata.category) {
        // Cho điểm cao hơn cho các danh mục cụ thể
        const categoryScore =
          {
            advice: 2,
            posting_guide: 2,
            rental_process: 2,
            general: 1,
          }[chunk.metadata.category] || 0

        score += categoryScore
      }

      return { chunk, score }
    })

    // Sắp xếp theo điểm từ cao đến thấp
    scoredChunks.sort((a, b) => b.score - a.score)

    // Xây dựng context với giới hạn độ dài
    let context = ''
    let currentLength = 0

    for (const { chunk } of scoredChunks) {
      const chunkContent = chunk.content.trim()
      const chunkCategory = chunk.metadata?.category || 'general'

      // Format nội dung theo danh mục
      const formattedChunk = `THÔNG TIN ${chunkCategory.toUpperCase()}: ${chunkContent}`

      if (currentLength + formattedChunk.length <= maxLength) {
        context += formattedChunk + '\n\n'
        currentLength += formattedChunk.length + 2 // +2 cho \n\n
      } else {
        break
      }
    }

    return context.trim()
  }

  /**
   * Chuẩn hóa văn bản để so sánh hiệu quả hơn
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
      .replace(/[^\w\s]/g, ' ') // Thay thế ký tự đặc biệt bằng khoảng trắng
      .replace(/\s+/g, ' ') // Thay thế nhiều khoảng trắng bằng một khoảng trắng
      .trim()
  }

  /**
   * Trích xuất từ khóa quan trọng từ tin nhắn người dùng với cải tiến
   */
  private extractKeywords(message: string): string[] {
    // Sử dụng danh sách từ dừng (stopwords) từ file utils/synonyms.ts
    const stopWords = vietnameseStopWords

    // Xóa dấu câu và chia thành từng từ
    const words = message
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/)

    // Lọc bỏ stopwords và từ có độ dài < 3
    const filteredWords = words.filter(
      word => word.length > 2 && !stopWords.includes(word)
    )

    // Tìm các cụm từ quan trọng từ file utils/synonyms.ts
    const keyPhrases = importantPhrases.filter(phrase =>
      message.includes(phrase)
    )

    // Tìm các từ đồng nghĩa cho tiện ích
    const amenityKeywords: string[] = []
    Object.entries(amenitySynonyms).forEach(([amenity, synonyms]) => {
      for (const synonym of synonyms) {
        if (message.includes(synonym)) {
          amenityKeywords.push(amenity)
          break
        }
      }
    })

    // Kết hợp từ đơn và cụm từ, loại bỏ trùng lặp
    return [...new Set([...filteredWords, ...keyPhrases, ...amenityKeywords])]
  }

  /**
   * Sắp xếp lại các chunk dựa trên mức độ liên quan với từ khóa - cải tiến
   */
  private reRankChunksByKeywords(chunks: any[], keywords: string[]): any[] {
    // Nếu không có từ khóa hoặc ít chunk, trả về nguyên bản
    if (keywords.length === 0 || chunks.length <= 1) {
      return chunks
    }

    // Tính điểm cho từng chunk dựa trên số lượng từ khóa xuất hiện
    const scoredChunks = chunks.map(chunk => {
      const content = chunk.content.toLowerCase()
      let score = 0

      // Tìm các từ khóa xuất hiện trong nội dung
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase()

        // Từ khóa xuất hiện trong nội dung - tính điểm theo số lần xuất hiện
        const keywordMatches = (
          content.match(new RegExp(keywordLower, 'gi')) || []
        ).length
        if (keywordMatches > 0) {
          // Điểm cho mỗi lần xuất hiện, với mức độ giảm dần (tránh lặp từ khóa quá nhiều)
          score += Math.min(keywordMatches, 3) * 0.5
        }

        // Nếu từ khóa là cụm từ và xuất hiện đúng nguyên cụm, điểm cao hơn
        if (keyword.includes(' ') && content.includes(keywordLower)) {
          score += 2
        }

        // Từ khóa xuất hiện trong metadata
        if (chunk.metadata) {
          if (
            chunk.metadata.category &&
            chunk.metadata.category.toLowerCase().includes(keywordLower)
          ) {
            score += 3 // Trọng số cao cho danh mục phù hợp
          }

          if (
            chunk.metadata.title &&
            chunk.metadata.title.toLowerCase().includes(keywordLower)
          ) {
            score += 2 // Trọng số cho tiêu đề phù hợp
          }
        }
      }

      // Cân chỉnh điểm số theo độ dài nội dung (ưu tiên nội dung súc tích)
      const contentLength = content.length
      if (contentLength > 0 && contentLength < 200) {
        score *= 1.2 // Tăng điểm cho nội dung ngắn gọn
      } else if (contentLength > 500) {
        score *= 0.8 // Giảm điểm cho nội dung quá dài
      }

      return { chunk, score }
    })

    // Sắp xếp các chunk theo điểm số giảm dần
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .map(item => item.chunk)
  }

  /**
   * Phân tích tin nhắn người dùng và trích xuất tiêu chí tìm phòng theo định dạng JSON
   * với khả năng xử lý lỗi và fallback
   */
  async extractCriteria(message: string): Promise<SearchCriteria> {
    // Chuẩn hóa tin nhắn để làm khóa cache (loại bỏ khoảng trắng thừa, chuyển về chữ thường)
    const cacheKey = message.toLowerCase().trim().replace(/\s+/g, ' ')

    // Kiểm tra cache
    const cachedCriteria = this.cacheService.getFromCache<SearchCriteria>(
      'criteria',
      cacheKey
    )
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
          - "distance": (object | null) thông tin khoảng cách với 2 trường: "max" (số km tối đa) và "location" (địa điểm tham chiếu). Ví dụ: { "max": 1, "location": "Đại học Nam Cần Thơ" }.
          - "userType": (string | null) đối tượng người thuê, ví dụ "sinh viên", "người đi làm", "gia đình".
          - "roomType": (string | null) loại phòng, ví dụ "phòng trọ", "căn hộ mini", "nhà nguyên căn".
          - "sortBy": (string | null) tiêu chí sắp xếp kết quả, ví dụ "price" nếu sắp xếp theo giá.
          - "sortOrder": (string | null) thứ tự sắp xếp, "asc" (tăng dần) hoặc "desc" (giảm dần). Nếu người dùng muốn giá cao nhất/đắt nhất, sử dụng "desc". Nếu muốn giá thấp nhất/rẻ nhất, sử dụng "asc".
          - "onlyTopResult": (boolean) đặt true nếu người dùng chỉ muốn kết quả cao nhất/thấp nhất. Ví dụ: "Tìm phòng có giá cao nhất" hoặc "Cho tôi xem phòng rẻ nhất" hoặc các yêu cầu chỉ lấy 1 kết quả duy nhất.

    Tin nhắn: "${message}"

          Output JSON (chỉ trả về JSON, không trả về text khác):`

      // Thiết lập timeout cho OpenAI API
      const openaiPromise = this.openaiService.generateCompletion(
        prompt,
        'gpt-4o-mini',
        0.3
      )

      // Tạo một promise sẽ reject sau 5 giây
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI API timeout')), 5000)
      })

      // Race giữa kết quả API và timeout
      const content: string = (await Promise.race([
        openaiPromise,
        timeoutPromise,
      ])) as string

      if (!content) {
        console.warn(
          'Không nhận được phản hồi từ ChatGPT, sử dụng phân tích cơ bản'
        )
        // Lưu kết quả phân tích cơ bản vào cache và trả về
        this.cacheService.saveToCache('criteria', cacheKey, basicCriteria)
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
        this.cacheService.saveToCache('criteria', cacheKey, mergedCriteria)

        return mergedCriteria
      } catch (parseError) {
        console.error('Lỗi phân tích JSON:', parseError, 'Content:', content)
        // Fallback sang phân tích cơ bản
        this.cacheService.saveToCache('criteria', cacheKey, basicCriteria)
        return basicCriteria
      }
    } catch (error: any) {
      console.error('Lỗi extractCriteria:', error)
      // Fallback sang phân tích cơ bản
      this.cacheService.saveToCache('criteria', cacheKey, basicCriteria)
      return basicCriteria
    }
  }

  /**
   * Phân tích cơ bản không sử dụng AI để trích xuất tiêu chí từ tin nhắn
   */
  private extractBasicCriteria(message: string): SearchCriteria {
    const criteria: any = {}

    // Chuyển tin nhắn về chữ thường để dễ so sánh
    const lowerMessage = message.toLowerCase()

    // Xác định yêu cầu sắp xếp kết quả
    if (
      lowerMessage.includes('cao nhất') ||
      lowerMessage.includes('đắt nhất') ||
      lowerMessage.includes('giá cao') ||
      lowerMessage.includes('giá đắt')
    ) {
      criteria.sortBy = 'price'
      criteria.sortOrder = 'desc' // Giảm dần - giá cao nhất trước

      // Nếu yêu cầu chỉ lấy cao nhất
      if (
        lowerMessage.includes('chỉ') ||
        lowerMessage.includes('lấy ra') ||
        lowerMessage.includes('duy nhất') ||
        lowerMessage.includes('một phòng') ||
        lowerMessage.includes('1 phòng') ||
        lowerMessage.match(/phòng\s+có\s+giá\s+cao\s+nhất/) ||
        lowerMessage.match(/phòng\s+có\s+giá\s+đắt\s+nhất/) ||
        lowerMessage.match(/phòng\s+giá\s+cao\s+nhất\s+thôi/)
      ) {
        criteria.onlyTopResult = true
      }
    } else if (
      lowerMessage.includes('thấp nhất') ||
      lowerMessage.includes('rẻ nhất') ||
      lowerMessage.includes('giá thấp') ||
      lowerMessage.includes('giá rẻ')
    ) {
      criteria.sortBy = 'price'
      criteria.sortOrder = 'asc' // Tăng dần - giá thấp nhất trước

      // Nếu yêu cầu chỉ lấy thấp nhất
      if (
        lowerMessage.includes('chỉ') ||
        lowerMessage.includes('lấy ra') ||
        lowerMessage.includes('duy nhất') ||
        lowerMessage.includes('một phòng') ||
        lowerMessage.includes('1 phòng') ||
        lowerMessage.match(/phòng\s+có\s+giá\s+thấp\s+nhất/) ||
        lowerMessage.match(/phòng\s+có\s+giá\s+rẻ\s+nhất/) ||
        lowerMessage.match(/phòng\s+giá\s+rẻ\s+nhất\s+thôi/)
      ) {
        criteria.onlyTopResult = true
      }
    }

    // Nhận diện cụm từ về khoảng cách - mở rộng regex để bắt nhiều trường hợp hơn
    const distanceRegex =
      /(dưới|trong khoảng|trong phạm vi|gần|cách|trong bán kính|<|<=)\s*(\d+(?:\.\d+)?)\s*(km|m|cây số|mét|kilomet|ki lô mét)?/i
    const distanceMatch = message.match(distanceRegex)

    // Nhận diện địa điểm, trường học, cơ quan, etc.
    const locationRegex =
      /(?:cách|gần)\s+(trường|đại học|trường đại học|trường học|công ty|bệnh viện|chợ|trung tâm)\s+([^,\.]+)/i
    const locationMatch = message.match(locationRegex)

    // Xử lý thông tin khoảng cách
    if (distanceMatch) {
      const distanceValue = parseFloat(distanceMatch[2])
      const distanceUnit = distanceMatch[3]
        ? distanceMatch[3].toLowerCase()
        : 'km' // Mặc định là km nếu không chỉ định

      // Chuyển đổi sang km
      const distanceInKm =
        !distanceUnit ||
        distanceUnit === 'km' ||
        distanceUnit === 'cây số' ||
        distanceUnit === 'kilomet' ||
        distanceUnit === 'ki lô mét'
          ? distanceValue
          : distanceValue / 1000

      criteria.distance = {
        max: distanceInKm,
      }

      // Nếu có thông tin về địa điểm cụ thể
      if (locationMatch) {
        const locationType = locationMatch[1].trim().toLowerCase()
        const locationName = locationMatch[2].trim()

        criteria.distance.location = {
          type: locationType,
          name: locationName,
          text: `${locationType} ${locationName}`, // Thêm text dễ đọc
        }

        // Đặc biệt xử lý cho trường đại học Nam Cần Thơ
        if (
          lowerMessage.includes('nam cần thơ') ||
          (locationType.includes('đại học') &&
            locationName.toLowerCase().includes('nam cần thơ'))
        ) {
          criteria.distance.location.isUniversity = true
          criteria.distance.location.coordinates = {
            lat: 10.0175, // Tọa độ gần đúng của trường Đại học Nam Cần Thơ
            lng: 105.7239,
          }
        }
      }
    }

    // Kiểm tra từ khóa cụ thể cho Đại học Nam Cần Thơ, ngay cả khi không có địa điểm rõ ràng
    if (lowerMessage.includes('nam cần thơ')) {
      if (criteria.distance && !criteria.distance.location) {
        // Nếu đã có distance nhưng chưa có location
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
      }

      // Kiểm tra nếu là phần của câu có khoảng cách
      if (!lowerMessage.match(/cách.*nam cần thơ|gần.*nam cần thơ/i)) {
        criteria.address = 'Nam Cần Thơ'
      }
    } else if (lowerMessage.includes('cần thơ')) {
      // Kiểm tra nếu là phần của câu có khoảng cách
      if (!lowerMessage.match(/cách.*cần thơ|gần.*cần thơ/i)) {
        criteria.address = 'Cần Thơ'
      }
    }

    // Kiểm tra trực tiếp từ khóa chỉ khoảng cách
    if (
      lowerMessage.includes('dưới 1km') ||
      lowerMessage.includes('dưới 1 km') ||
      lowerMessage.includes('trong bán kính 1km') ||
      lowerMessage.includes('trong bán kính 1 km') ||
      lowerMessage.includes('< 1km') ||
      lowerMessage.includes('<1km') ||
      lowerMessage.includes('dưới 1')
    ) {
      if (!criteria.distance) {
        criteria.distance = { max: 1 }
      }

      // Nếu có đề cập đến Đại học Nam Cần Thơ
      if (lowerMessage.includes('nam cần thơ')) {
        if (!criteria.distance.location) {
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
        }
      }
    }

    // Trích xuất tiêu chí giá
    const priceRegex =
      /(?:giá|thuê|chi phí)\s+(?:khoảng|tầm|từ|dưới|trên)?\s*(\d+(?:[,\.]\d+)?)\s*(nghìn|triệu|tr|k|đồng|đ)?(?:\s*(?:-|đến|tới|~)\s*(\d+(?:[,\.]\d+)?)\s*(nghìn|triệu|tr|k|đồng|đ)?)?/i
    const priceMatch = message.match(priceRegex)

    if (priceMatch) {
      criteria.price = {}

      // Xử lý giá min
      if (priceMatch[1]) {
        let minPrice = parseFloat(priceMatch[1].replace(/[,\.]/g, '.'))
        const minUnit = priceMatch[2] ? priceMatch[2].toLowerCase() : 'đồng'

        if (minUnit.includes('triệu') || minUnit === 'tr') {
          minPrice *= 1000000
        } else if (minUnit.includes('nghìn') || minUnit === 'k') {
          minPrice *= 1000
        }

        criteria.price.min = minPrice
      }

      // Xử lý giá max nếu có
      if (priceMatch[3]) {
        let maxPrice = parseFloat(priceMatch[3].replace(/[,\.]/g, '.'))
        const maxUnit = priceMatch[4]
          ? priceMatch[4].toLowerCase()
          : priceMatch[2]
            ? priceMatch[2].toLowerCase()
            : 'đồng'

        if (maxUnit.includes('triệu') || maxUnit === 'tr') {
          maxPrice *= 1000000
        } else if (maxUnit.includes('nghìn') || maxUnit === 'k') {
          maxPrice *= 1000
        }

        criteria.price.max = maxPrice
      }
      // Nếu chỉ có "dưới X"
      else if (message.match(/dưới\s+(\d+(?:[,\.]\d+)?)/i)) {
        criteria.price.max = criteria.price.min
        delete criteria.price.min
      }
      // Nếu chỉ có "trên X"
      else if (message.match(/trên\s+(\d+(?:[,\.]\d+)?)/i)) {
        // Giữ nguyên min, không cần max
      }
      // Nếu là "khoảng X" thì tạo range +/- 20%
      else if (
        message.match(/khoảng\s+(\d+(?:[,\.]\d+)?)/i) &&
        !priceMatch[3]
      ) {
        const basePrice = criteria.price.min
        criteria.price.min = basePrice * 0.8
        criteria.price.max = basePrice * 1.2
      }
    }

    // Trích xuất tiêu chí diện tích
    const areaRegex =
      /(?:diện tích|rộng|lớn)\s+(?:khoảng|tầm|từ|dưới|trên)?\s*(\d+(?:[,\.]\d+)?)\s*(m2|m²|mét vuông)?(?:\s*(?:-|đến|tới|~)\s*(\d+(?:[,\.]\d+)?)\s*(m2|m²|mét vuông)?)?/i
    const areaMatch = message.match(areaRegex)

    if (areaMatch) {
      criteria.area = {}

      // Xử lý diện tích min
      if (areaMatch[1]) {
        criteria.area.min = parseFloat(areaMatch[1].replace(/[,\.]/g, '.'))
      }

      // Xử lý diện tích max nếu có
      if (areaMatch[3]) {
        criteria.area.max = parseFloat(areaMatch[3].replace(/[,\.]/g, '.'))
      }
      // Nếu chỉ có "dưới X"
      else if (message.match(/dưới\s+(\d+(?:[,\.]\d+)?)\s*m2/i)) {
        criteria.area.max = criteria.area.min
        delete criteria.area.min
      }
      // Nếu chỉ có "trên X"
      else if (message.match(/trên\s+(\d+(?:[,\.]\d+)?)\s*m2/i)) {
        // Giữ nguyên min, không cần max
      }
      // Nếu là "khoảng X" thì tạo range +/- 20%
      else if (
        message.match(/khoảng\s+(\d+(?:[,\.]\d+)?)\s*m2/i) &&
        !areaMatch[3]
      ) {
        const baseArea = criteria.area.min
        criteria.area.min = Math.floor(baseArea * 0.8)
        criteria.area.max = Math.ceil(baseArea * 1.2)
      }
    }

    // Nhận diện các tiện ích từ CSDL
    const foundAmenities: string[] = []

    // Thêm các từ khóa đồng nghĩa cho một số tiện ích phổ biến
    const amenitySynonyms = {
      'máy lạnh': ['điều hòa', 'máy lạnh', 'máy điều hòa'],
      wifi: ['wifi', 'internet', 'mạng', 'wi-fi'],
      'nhà vệ sinh riêng': [
        'wc riêng',
        'toilet riêng',
        'nhà vệ sinh riêng',
        'vệ sinh riêng',
      ],
      'tủ lạnh': ['tủ lạnh'],
      'máy giặt': ['máy giặt'],
      'gác lửng': ['gác lửng', 'gác xép', 'gác'],
      'ban công': ['ban công', 'balcony'],
      bếp: ['bếp', 'phòng bếp', 'khu bếp'],
      'bàn làm việc': ['bàn làm việc', 'bàn học'],
    }

    // Kiểm tra đối với mỗi tiện ích đã biết trong CSDL
    for (const amenity of this.amenities) {
      // Kiểm tra trực tiếp tên tiện ích
      if (lowerMessage.includes(amenity.name.toLowerCase())) {
        foundAmenities.push(amenity.name)
        continue
      }

      // Kiểm tra các từ đồng nghĩa
      const synonyms = amenitySynonyms[amenity.name.toLowerCase()]
      if (synonyms) {
        for (const synonym of synonyms) {
          if (lowerMessage.includes(synonym)) {
            foundAmenities.push(amenity.name)
            break
          }
        }
      }
    }

    // Kiểm tra các mẫu regex phổ biến cho các tiện ích
    if (
      message.match(/có (máy lạnh|điều hòa)/i) &&
      !foundAmenities.includes('máy lạnh')
    ) {
      foundAmenities.push('máy lạnh')
    }

    if (foundAmenities.length > 0) {
      criteria.amenities = foundAmenities
    }

    return criteria
  }

  /**
   * Kết hợp kết quả tiêu chí từ phân tích cơ bản và phân tích AI
   */
  private mergeCriteria(basicCriteria: any, aiCriteria: any): SearchCriteria {
    const result = { ...basicCriteria }

    // Xử lý giá
    if (aiCriteria.price) {
      if (!result.price) {
        result.price = {}
      }
      if (
        aiCriteria.price.min &&
        (!result.price.min || aiCriteria.price.min > result.price.min)
      ) {
        result.price.min = aiCriteria.price.min
      }
      if (
        aiCriteria.price.max &&
        (!result.price.max || aiCriteria.price.max < result.price.max)
      ) {
        result.price.max = aiCriteria.price.max
      }
    }

    // Xử lý diện tích
    if (aiCriteria.area) {
      if (!result.area) {
        result.area = {}
      }
      if (
        aiCriteria.area.min &&
        (!result.area.min || aiCriteria.area.min > result.area.min)
      ) {
        result.area.min = aiCriteria.area.min
      }
      if (
        aiCriteria.area.max &&
        (!result.area.max || aiCriteria.area.max < result.area.max)
      ) {
        result.area.max = aiCriteria.area.max
      }
    }

    // Xử lý tiện ích
    if (aiCriteria.amenities && aiCriteria.amenities.length > 0) {
      if (!result.amenities) {
        result.amenities = []
      }
      // Kết hợp và loại bỏ trùng lặp
      const mergedAmenities = [...result.amenities, ...aiCriteria.amenities]
      result.amenities = [...new Set(mergedAmenities)]
    }

    // Xử lý địa chỉ
    if (
      aiCriteria.address &&
      (!result.address || aiCriteria.address.length > result.address.length)
    ) {
      result.address = aiCriteria.address
    }

    // Xử lý khoảng cách
    if (aiCriteria.distance) {
      if (!result.distance) {
        result.distance = {}
      }
      if (aiCriteria.distance.max) {
        result.distance.max = aiCriteria.distance.max
      }
      if (aiCriteria.distance.location) {
        result.distance.location = aiCriteria.distance.location
      }
    }

    // Xử lý đối tượng người thuê
    if (aiCriteria.userType) {
      result.userType = aiCriteria.userType
    }

    // Xử lý loại phòng
    if (aiCriteria.roomType) {
      result.roomType = aiCriteria.roomType
    }

    // Xử lý tiêu chí sắp xếp
    if (aiCriteria.sortBy) {
      result.sortBy = aiCriteria.sortBy
    }

    // Xử lý thứ tự sắp xếp
    if (aiCriteria.sortOrder) {
      result.sortOrder = aiCriteria.sortOrder
    }

    // Xử lý yêu cầu chỉ lấy một kết quả cao nhất/thấp nhất
    if (
      aiCriteria.onlyTopResult === true ||
      basicCriteria.onlyTopResult === true
    ) {
      result.onlyTopResult = true
    }

    return result
  }

  /**
   * Tạo câu trả lời cho các câu hỏi tư vấn sử dụng RAG
   */
  async generateAdviceResponse(message: string): Promise<string> {
    return this.generateRAGResponse(message, 'advice')
  }

  /**
   * Đề xuất điều chỉnh tiêu chí khi không tìm thấy kết quả
   */
  suggestCriteriaAdjustments(criteria: SearchCriteria): string {
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

  /**
   * Nới lỏng các tiêu chí tìm kiếm khi không tìm thấy kết quả
   */
  relaxCriteria(criteria: SearchCriteria, retryCount: number): SearchCriteria {
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
}
