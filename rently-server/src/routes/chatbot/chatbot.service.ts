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
  private readonly KNOWLEDGE_DIR = path.join(__dirname, '../../../knowledge')
  // Danh sách các tiện ích có trong hệ thống
  private amenities: { id: number; name: string }[] = []

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
   * Khởi tạo kho kiến thức từ các file
   */
  private async initializeKnowledgeBase() {
    try {
      console.log(`Đang đọc kho kiến thức từ: ${this.KNOWLEDGE_DIR}`)

      // Đảm bảo thư mục tồn tại
      if (!fs.existsSync(this.KNOWLEDGE_DIR)) {
        console.log(
          `Thư mục knowledge không tồn tại, tạo thư mục mới: ${this.KNOWLEDGE_DIR}`
        )
        fs.mkdirSync(this.KNOWLEDGE_DIR, { recursive: true })

        // Tạo các file kiến thức mặc định khi thư mục knowledge chưa tồn tại
        this.createDefaultKnowledgeFiles()
      } else {
        // Chỉ tạo các file mặc định nếu thư mục rỗng hoàn toàn
        const files = fs.readdirSync(this.KNOWLEDGE_DIR)
        if (files.length === 0) {
          console.log('Thư mục knowledge rỗng, tạo file mặc định')
          this.createDefaultKnowledgeFiles()
        } else {
          console.log(
            `Đã tìm thấy ${files.length} file trong thư mục knowledge, bỏ qua việc tạo file mặc định`
          )
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
          - "distance": (object | null) thông tin khoảng cách với 2 trường: "max" (số km tối đa) và "location" (địa điểm tham chiếu). Ví dụ: { "max": 1, "location": "Đại học Nam Cần Thơ" }.
          - "userType": (string | null) đối tượng người thuê, ví dụ "sinh viên", "người đi làm", "gia đình".
          - "roomType": (string | null) loại phòng, ví dụ "phòng trọ", "căn hộ mini", "nhà nguyên căn".
          - "sortBy": (string | null) tiêu chí sắp xếp kết quả, ví dụ "price" nếu sắp xếp theo giá.
          - "sortOrder": (string | null) thứ tự sắp xếp, "asc" (tăng dần) hoặc "desc" (giảm dần). Nếu người dùng muốn giá cao nhất/đắt nhất, sử dụng "desc". Nếu muốn giá thấp nhất/rẻ nhất, sử dụng "asc".
          - "onlyTopResult": (boolean) đặt true nếu người dùng chỉ muốn kết quả cao nhất/thấp nhất. Ví dụ: "Tìm phòng có giá cao nhất" hoặc "Cho tôi xem phòng rẻ nhất" hoặc các yêu cầu chỉ lấy 1 kết quả duy nhất.

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
  private mergeCriteria(basicCriteria: any, aiCriteria: any): any {
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
        // Tìm ID của các tiện ích từ tên, sử dụng danh sách đã tải từ CSDL để tối ưu
        if (this.amenities.length > 0) {
          amenityIds = this.amenities
            .filter(a => criteria.amenities.includes(a.name))
            .map(a => a.id)
        } else {
          // Fallback nếu chưa tải được danh sách tiện ích
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
            item.distance !== null && item.distance <= criteria.distance.max
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
   * Tính khoảng cách Haversine giữa hai tọa độ
   * @param lat1 Vĩ độ điểm 1
   * @param lng1 Kinh độ điểm 1
   * @param lat2 Vĩ độ điểm 2
   * @param lng2 Kinh độ điểm 2
   * @returns Khoảng cách tính bằng km
   */
  private calculateDistance(
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
      
      ${context}
      
Dưới đây là một số gợi ý khác, gần với yêu cầu của bạn:
${fallbackList}
      
Hãy đưa ra phản hồi ngắn gọn, thân thiện với người dùng, bao gồm:
      1. Thông báo không tìm thấy kết quả phù hợp
2. Gợi ý xem qua các gợi ý bên dưới
3. Cách điều chỉnh tiêu chí tìm kiếm để có nhiều kết quả hơn
      Hãy giữ câu trả lời dưới 150 từ:`

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      })

      return (
        completion.choices[0]?.message?.content ||
        `Không tìm thấy bài đăng nào phù hợp với yêu cầu của bạn. Bạn có thể thử điều chỉnh tiêu chí tìm kiếm.`
      )
    } catch (error) {
      console.error('Lỗi generateNoResultsResponse:', error)
      // Fallback: gợi ý điều chỉnh tiêu chí
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
