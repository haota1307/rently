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
import * as fs from 'fs'
import * as path from 'path'

interface CacheEntry<T> {
  value: T
  timestamp: number
}

// Định nghĩa interface cho đoạn kiến thức
interface KnowledgeChunk {
  id: string
  content: string
  embedding?: number[]
  metadata: {
    source: string
    category: string
    createdAt: Date
  }
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
  // Kho lưu trữ kiến thức cho RAG
  private knowledgeBase: KnowledgeChunk[] = []
  // Đường dẫn đến thư mục lưu trữ kiến thức
  private readonly KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge')

  constructor(
    private readonly rentalService: RentalService,
    private readonly roomService: RoomService,
    private readonly postService: PostService,
    private readonly prisma: PrismaService
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    // Khởi tạo kho kiến thức
    this.initializeKnowledgeBase()
  }

  /**
   * Khởi tạo kho kiến thức từ các file
   */
  private async initializeKnowledgeBase() {
    try {
      // Đảm bảo thư mục tồn tại
      if (!fs.existsSync(this.KNOWLEDGE_DIR)) {
        fs.mkdirSync(this.KNOWLEDGE_DIR, { recursive: true })

        // Tạo các file kiến thức mặc định
        this.createDefaultKnowledgeFiles()
      } else {
        // Kiểm tra xem các file kiến thức mặc định đã tồn tại chưa
        const defaultFiles = [
          'rental_process.json',
          'advice.json',
          'posting_guide.json',
        ]
        let needCreateDefaults = false

        for (const file of defaultFiles) {
          if (!fs.existsSync(path.join(this.KNOWLEDGE_DIR, file))) {
            needCreateDefaults = true
            break
          }
        }

        if (needCreateDefaults) {
          this.createDefaultKnowledgeFiles()
        }
      }

      // Đọc các file trong thư mục
      const files = fs.readdirSync(this.KNOWLEDGE_DIR)

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.KNOWLEDGE_DIR, file)
          const content = fs.readFileSync(filePath, 'utf8')
          const chunks = JSON.parse(content) as KnowledgeChunk[]

          // Tạo embeddings cho các chunk mới
          for (const chunk of chunks) {
            if (!chunk.embedding) {
              chunk.embedding = await this.createEmbedding(chunk.content)
            }
          }

          this.knowledgeBase.push(...chunks)
        }
      }

      console.log(
        `Đã tải ${this.knowledgeBase.length} đoạn kiến thức vào kho RAG`
      )
    } catch (error) {
      console.error('Lỗi khởi tạo kho kiến thức:', error)
    }
  }

  /**
   * Tạo các file kiến thức mặc định
   */
  private createDefaultKnowledgeFiles() {
    try {
      console.log('Tạo các file kiến thức mặc định...')

      // Kiểm tra và tạo file rental_process.json nếu chưa tồn tại
      const rentalProcessPath = path.join(
        this.KNOWLEDGE_DIR,
        'rental_process.json'
      )
      if (!fs.existsSync(rentalProcessPath)) {
        // Sử dụng file từ thư mục knowledge đã được tạo trước đó
        if (
          fs.existsSync(
            path.join(__dirname, 'knowledge', 'rental_process.json')
          )
        ) {
          fs.copyFileSync(
            path.join(__dirname, 'knowledge', 'rental_process.json'),
            rentalProcessPath
          )
        } else {
          // Nếu file mẫu không tồn tại, tạo file với nội dung cơ bản
          const rentalProcessKnowledge = [
            {
              id: '1',
              content:
                'Quy trình thuê phòng trọ thông thường bao gồm: 1) Tìm kiếm và lựa chọn phòng phù hợp, 2) Liên hệ chủ trọ, 3) Xem phòng trực tiếp, 4) Đàm phán giá cả và điều kiện, 5) Ký hợp đồng thuê phòng, 6) Đóng tiền cọc và tiền phòng, 7) Nhận phòng.',
              metadata: {
                source: 'default',
                category: 'rental_process',
                createdAt: new Date(),
              },
            },
          ]
          fs.writeFileSync(
            rentalProcessPath,
            JSON.stringify(rentalProcessKnowledge, null, 2)
          )
        }
      }

      // Kiểm tra và tạo file advice.json nếu chưa tồn tại
      const advicePath = path.join(this.KNOWLEDGE_DIR, 'advice.json')
      if (!fs.existsSync(advicePath)) {
        if (fs.existsSync(path.join(__dirname, 'knowledge', 'advice.json'))) {
          fs.copyFileSync(
            path.join(__dirname, 'knowledge', 'advice.json'),
            advicePath
          )
        } else {
          const adviceKnowledge = [
            {
              id: '1',
              content:
                'Khi thuê phòng trọ, bạn nên kiểm tra kỹ các vấn đề sau: an ninh khu vực, hệ thống điện nước, chất lượng thiết bị trong phòng, độ ẩm và mốc, tiếng ồn, và các quy định của chủ trọ.',
              metadata: {
                source: 'default',
                category: 'advice',
                createdAt: new Date(),
              },
            },
          ]
          fs.writeFileSync(advicePath, JSON.stringify(adviceKnowledge, null, 2))
        }
      }

      // Kiểm tra và tạo file posting_guide.json nếu chưa tồn tại
      const postingGuidePath = path.join(
        this.KNOWLEDGE_DIR,
        'posting_guide.json'
      )
      if (!fs.existsSync(postingGuidePath)) {
        if (
          fs.existsSync(path.join(__dirname, 'knowledge', 'posting_guide.json'))
        ) {
          fs.copyFileSync(
            path.join(__dirname, 'knowledge', 'posting_guide.json'),
            postingGuidePath
          )
        } else {
          const postingGuideKnowledge = [
            {
              id: '1',
              content:
                'Quy trình đăng bài cho thuê phòng trọ trên Rently gồm 3 bước chính: 1) Tạo nhà trọ (Rental), 2) Tạo phòng (Room), 3) Tạo bài đăng (Post). Bạn phải hoàn thành từng bước theo thứ tự, không thể bỏ qua bước nào.',
              metadata: {
                source: 'default',
                category: 'posting_guide',
                createdAt: new Date(),
              },
            },
          ]
          fs.writeFileSync(
            postingGuidePath,
            JSON.stringify(postingGuideKnowledge, null, 2)
          )
        }
      }

      console.log('Đã tạo xong các file kiến thức mặc định.')
    } catch (error) {
      console.error('Lỗi khi tạo file kiến thức mặc định:', error)
    }
  }

  /**
   * Tạo embedding cho văn bản sử dụng OpenAI API
   */
  private async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Lỗi tạo embedding:', error)
      // Trả về vector rỗng nếu có lỗi
      return []
    }
  }

  /**
   * Tính độ tương đồng cosine giữa hai vector
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length === 0 || vecB.length === 0) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }

    if (normA === 0 || normB === 0) return 0

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Tìm kiếm các đoạn kiến thức liên quan nhất với câu hỏi
   */
  private async retrieveRelevantKnowledge(
    question: string,
    topK: number = 3
  ): Promise<KnowledgeChunk[]> {
    try {
      // Tạo embedding cho câu hỏi
      const questionEmbedding = await this.createEmbedding(question)

      if (questionEmbedding.length === 0) return []

      // Tính điểm tương đồng với từng đoạn kiến thức
      const scoredChunks = this.knowledgeBase.map(chunk => ({
        chunk,
        score: this.cosineSimilarity(questionEmbedding, chunk.embedding || []),
      }))

      // Sắp xếp theo điểm và lấy top K
      const topChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(item => item.chunk)

      return topChunks
    } catch (error) {
      console.error('Lỗi khi truy xuất kiến thức:', error)
      return []
    }
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
   * Phân tích tin nhắn người dùng để xác định ý định và trả về kết quả phù hợp
   * Đã tích hợp RAG để nâng cao chất lượng câu trả lời
   */
  private async analyzeMessage(message: string): Promise<{
    intent: 'search' | 'general' | 'math' | 'advice' | 'posting_guide'
    content: string
    criteria?: any
  }> {
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

      // Kiểm tra các từ khóa liên quan đến tìm phòng
      const searchKeywords =
        /(tìm phòng|thuê phòng|giá phòng|phòng trọ|ở đâu có phòng|cần thuê|muốn thuê|cho thuê)/i
      const adviceKeywords =
        /(tư vấn|lời khuyên|kinh nghiệm|nên làm gì|cần lưu ý|thủ tục|quy trình|hợp đồng)/i
      const postingGuideKeywords =
        /(đăng bài|đăng tin|đăng phòng|cách đăng|hướng dẫn đăng|làm sao để đăng|đăng cho thuê|đưa phòng lên|thêm phòng|tạo bài đăng|tạo tin|đăng thông tin|làm thế nào để đăng)/i

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
          message.toLowerCase().includes('đăng') ||
          message.toLowerCase().includes('bán') ||
          (message.toLowerCase().includes('cho thuê') &&
            (message.toLowerCase().includes('làm sao') ||
              message.toLowerCase().includes('thế nào') ||
              message.toLowerCase().includes('hướng dẫn') ||
              message.toLowerCase().includes('cách')))
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
   * Tạo câu trả lời sử dụng kiến thức từ kho RAG
   */
  private async generateRAGResponse(
    message: string,
    type: 'general' | 'advice' | 'posting_guide'
  ): Promise<string> {
    try {
      // Truy xuất kiến thức liên quan
      let relevantChunks

      if (type === 'posting_guide') {
        // Ưu tiên các đoạn kiến thức về hướng dẫn đăng bài
        relevantChunks = this.knowledgeBase.filter(
          chunk => chunk.metadata.category === 'posting_guide'
        )
      } else {
        // Tìm kiếm ngữ nghĩa các đoạn kiến thức liên quan
        relevantChunks = await this.retrieveRelevantKnowledge(message)
      }

      // Kết hợp các đoạn kiến thức thành context
      let context = ''
      if (relevantChunks.length > 0) {
        context =
          'Kiến thức liên quan:\n' +
          relevantChunks.map(chunk => chunk.content).join('\n\n')
      }

      // Tạo prompt phù hợp với loại câu hỏi
      let prompt
      if (type === 'advice') {
        prompt = `
        Bạn là trợ lý ảo Rently Assistant của một trang web cho thuê phòng trọ.
        Hãy đưa ra lời khuyên hữu ích về vấn đề liên quan đến thuê phòng trọ dựa trên kiến thức sau đây.
        
        ${context}
        
        Câu hỏi: "${message}"
        
        Lời khuyên (giữ câu trả lời ngắn gọn, súc tích, dưới 150 từ):`
      } else if (type === 'posting_guide') {
        prompt = `
        Bạn là trợ lý ảo Rently Assistant của một trang web cho thuê phòng trọ.
        Người dùng đang hỏi về cách đăng bài cho thuê phòng trọ trên trang web của chúng tôi.
        Hãy cung cấp hướng dẫn chi tiết dựa trên kiến thức sau đây.
        
        ${context}
        
        Câu hỏi: "${message}"
        
        Hướng dẫn đăng bài (đưa ra hướng dẫn rõ ràng, từng bước):`
      } else {
        prompt = `
        Bạn là trợ lý ảo Rently Assistant của một trang web cho thuê phòng trọ.
        Hãy trả lời câu hỏi của người dùng một cách ngắn gọn, thân thiện và hữu ích dựa trên kiến thức sau đây.
        
        ${context}
        
        Quy tắc:
        1. Nếu được hỏi về thông tin cá nhân, hãy nói bạn là trợ lý ảo Rently được tạo ra để hỗ trợ người dùng tìm phòng trọ.
        2. Chỉ trả lời những câu hỏi chung, không đưa ra thông tin cụ thể về một phòng trọ không tồn tại.
        3. Nếu không biết câu trả lời, hãy lịch sự đề nghị người dùng hỏi về các vấn đề liên quan đến phòng trọ.
        4. Giữ câu trả lời ngắn gọn, dưới 2-3 câu.
        
        Câu hỏi: "${message}"
        
        Trả lời:`
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      })

      return (
        completion.choices[0]?.message?.content ||
        'Xin lỗi, tôi không thể trả lời câu hỏi này.'
      )
    } catch (error) {
      console.error('Lỗi generateRAGResponse:', error)
      return 'Xin lỗi, tôi đang gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.'
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
        model: 'gpt-4o-mini',
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
   * Với cơ chế retry, fallback và tích hợp RAG
   */
  async search(message: string): Promise<{
    criteria?: any
    summary: string
    results: any[]
    totalFound: number
    error?: string
  }> {
    try {
      // Phân tích tin nhắn để xác định ý định
      const analysis = await this.analyzeMessage(message)

      // Nếu là câu hỏi toán học hoặc câu hỏi chung
      if (analysis.intent === 'math' || analysis.intent === 'general') {
        return {
          summary: analysis.content,
          results: [],
          totalFound: 0,
        }
      }

      // Nếu là yêu cầu tư vấn - sử dụng RAG để trả lời chi tiết hơn
      if (analysis.intent === 'advice') {
        const adviceResponse = await this.generateAdviceResponse(message)
        return {
          summary: adviceResponse,
          results: [],
          totalFound: 0,
        }
      }

      // Nếu là hướng dẫn đăng bài
      if (analysis.intent === 'posting_guide') {
        const postingGuideResponse = await this.generateRAGResponse(
          message,
          'posting_guide'
        )
        return {
          summary: postingGuideResponse,
          results: [],
          totalFound: 0,
        }
      }

      // Với ý định tìm kiếm, tiếp tục xử lý với RAG để cải thiện kết quả
      // Số lần thử lại tối đa
      const MAX_RETRIES = 2
      let retries = 0
      let searchResults: any[] = []
      const criteria = analysis.criteria

      // Luồng hoạt động chính
      while (retries <= MAX_RETRIES && searchResults.length === 0) {
        try {
          // Mỗi lần retry, giảm bớt các tiêu chí khắt khe để tìm được nhiều kết quả hơn
          let currentCriteria = criteria
          if (retries > 0) {
            currentCriteria = this.relaxCriteria(criteria, retries)
          }

          // Tìm kiếm các bài đăng phù hợp
          searchResults = await this.searchPostsByRoomCriteria(currentCriteria)

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
        summary = await this.generateNoResultsResponse(message, criteria)
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
        summary: 'Đã xảy ra lỗi khi xử lý tin nhắn của bạn.',
        results: [],
        totalFound: 0,
      }
    }
  }

  /**
   * Tạo phản hồi khi không tìm thấy kết quả, sử dụng RAG để đưa ra gợi ý thông minh hơn
   */
  private async generateNoResultsResponse(
    message: string,
    criteria: any
  ): Promise<string> {
    try {
      // Lấy kiến thức liên quan từ kho RAG
      const relevantChunks = await this.retrieveRelevantKnowledge(message)
      let context = ''

      if (relevantChunks.length > 0) {
        context =
          'Kiến thức liên quan:\n' +
          relevantChunks.map(chunk => chunk.content).join('\n\n')
      }

      // Thông tin về tiêu chí tìm kiếm
      const criteriaInfo = JSON.stringify(criteria, null, 2)

      const prompt = `
      Bạn là trợ lý ảo Rently Assistant của một trang web cho thuê phòng trọ.
      
      Người dùng đã tìm kiếm phòng trọ nhưng không tìm thấy kết quả phù hợp. Hãy đưa ra một phản hồi hữu ích.
      
      Tiêu chí tìm kiếm của người dùng:
      ${criteriaInfo}
      
      ${context}
      
      Tin nhắn ban đầu của người dùng: "${message}"
      
      Hãy đưa ra một phản hồi ngắn gọn, thân thiện với người dùng, bao gồm:
      1. Thông báo không tìm thấy kết quả phù hợp
      2. Giải thích lý do có thể là gì (ví dụ: tiêu chí quá cụ thể)
      3. Gợi ý cách điều chỉnh tiêu chí tìm kiếm
      4. Lời khuyên hữu ích cho người tìm phòng
      
      Hãy giữ câu trả lời dưới 150 từ:`

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 250,
      })

      return (
        completion.choices[0]?.message?.content ||
        'Không tìm thấy bài đăng nào phù hợp với yêu cầu của bạn. Bạn có thể thử điều chỉnh tiêu chí tìm kiếm.'
      )
    } catch (error) {
      console.error('Lỗi generateNoResultsResponse:', error)
      // Fallback sang phương thức gợi ý cũ nếu có lỗi
      const suggestions = this.suggestCriteriaAdjustments(criteria)
      return `Không tìm thấy bài đăng nào phù hợp với yêu cầu của bạn. ${suggestions || 'Bạn có thể thử điều chỉnh tiêu chí tìm kiếm.'}`
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

  /**
   * Tạo câu trả lời cho các câu hỏi tư vấn sử dụng RAG
   */
  private async generateAdviceResponse(message: string): Promise<string> {
    return this.generateRAGResponse(message, 'advice')
  }

  /**
   * Thêm kiến thức mới vào kho RAG
   */
  async addKnowledge(
    content: string,
    category: string
  ): Promise<{ success: boolean; id?: string }> {
    try {
      const newChunk: KnowledgeChunk = {
        id: Date.now().toString(),
        content,
        metadata: {
          source: 'api',
          category,
          createdAt: new Date(),
        },
      }

      // Tạo embedding cho đoạn kiến thức mới
      newChunk.embedding = await this.createEmbedding(content)

      // Thêm vào kho kiến thức
      this.knowledgeBase.push(newChunk)

      // Lưu vào file
      this.saveKnowledgeToFile(category)

      return { success: true, id: newChunk.id }
    } catch (error) {
      console.error('Lỗi khi thêm kiến thức mới:', error)
      return { success: false }
    }
  }

  /**
   * Lưu kiến thức vào file theo danh mục
   */
  private saveKnowledgeToFile(category: string): void {
    try {
      // Lọc kiến thức theo danh mục
      const categoryChunks = this.knowledgeBase.filter(
        chunk => chunk.metadata.category === category
      )

      // Lưu vào file
      const filePath = path.join(this.KNOWLEDGE_DIR, `${category}.json`)
      fs.writeFileSync(filePath, JSON.stringify(categoryChunks, null, 2))
    } catch (error) {
      console.error('Lỗi khi lưu kiến thức vào file:', error)
    }
  }

  /**
   * Cung cấp API endpoint để frontend có thể thêm kiến thức mới
   */
  async addKnowledgeFromFile(
    file: any,
    category: string
  ): Promise<{ success: boolean; count: number }> {
    try {
      // Đọc nội dung file
      const content = file.buffer.toString('utf8')

      // Chia nhỏ nội dung thành các đoạn
      const chunks = this.splitIntoChunks(content)

      let count = 0
      for (const chunk of chunks) {
        if (chunk.trim().length > 0) {
          const result = await this.addKnowledge(chunk, category)
          if (result.success) count++
        }
      }

      return { success: true, count }
    } catch (error) {
      console.error('Lỗi khi thêm kiến thức từ file:', error)
      return { success: false, count: 0 }
    }
  }

  /**
   * Chia văn bản thành các đoạn nhỏ
   */
  private splitIntoChunks(text: string, maxLength: number = 500): string[] {
    const paragraphs = text.split(/\n\s*\n/)
    const chunks: string[] = []

    for (const paragraph of paragraphs) {
      if (paragraph.length <= maxLength) {
        chunks.push(paragraph)
      } else {
        // Chia đoạn dài thành các câu
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph]

        let currentChunk = ''
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length <= maxLength) {
            currentChunk += sentence
          } else {
            if (currentChunk) chunks.push(currentChunk)
            currentChunk = sentence
          }
        }

        if (currentChunk) chunks.push(currentChunk)
      }
    }

    return chunks
  }

  /**
   * API endpoint để liệt kê tất cả kiến thức trong kho RAG
   */
  async listKnowledge(
    category?: string
  ): Promise<{ chunks: any[]; total: number }> {
    try {
      // Lọc theo danh mục nếu có
      const filteredChunks = category
        ? this.knowledgeBase.filter(
            chunk => chunk.metadata.category === category
          )
        : this.knowledgeBase

      // Chuyển đổi định dạng, loại bỏ embedding để giảm kích thước phản hồi
      const chunks = filteredChunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        category: chunk.metadata.category,
        source: chunk.metadata.source,
        createdAt: chunk.metadata.createdAt,
      }))

      return {
        chunks,
        total: chunks.length,
      }
    } catch (error) {
      console.error('Lỗi khi liệt kê kiến thức:', error)
      return { chunks: [], total: 0 }
    }
  }

  /**
   * API endpoint để xóa một mục kiến thức khỏi kho RAG
   */
  async deleteKnowledge(id: string): Promise<{ success: boolean }> {
    try {
      // Tìm index của mục kiến thức cần xóa
      const index = this.knowledgeBase.findIndex(chunk => chunk.id === id)

      if (index === -1) {
        return { success: false }
      }

      // Lưu lại danh mục để cập nhật file
      const category = this.knowledgeBase[index].metadata.category

      // Xóa khỏi mảng
      this.knowledgeBase.splice(index, 1)

      // Cập nhật file
      this.saveKnowledgeToFile(category)

      return { success: true }
    } catch (error) {
      console.error('Lỗi khi xóa kiến thức:', error)
      return { success: false }
    }
  }

  /**
   * API endpoint để tìm kiếm kiến thức theo từ khóa
   */
  async searchKnowledge(
    query: string
  ): Promise<{ chunks: any[]; total: number }> {
    try {
      // Tạo embedding cho truy vấn
      const queryEmbedding = await this.createEmbedding(query)

      // Tính điểm tương đồng
      const scoredChunks = this.knowledgeBase.map(chunk => ({
        chunk,
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding || []),
      }))

      // Sắp xếp theo điểm và lấy top 10
      const matchedChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => ({
          id: item.chunk.id,
          content: item.chunk.content,
          category: item.chunk.metadata.category,
          source: item.chunk.metadata.source,
          createdAt: item.chunk.metadata.createdAt,
          score: item.score,
        }))

      return {
        chunks: matchedChunks,
        total: matchedChunks.length,
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm kiến thức:', error)
      return { chunks: [], total: 0 }
    }
  }
}
