import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import { KnowledgeChunk } from '../interfaces/chatbot.interfaces'
import { ChatbotOpenAIService } from './openai.service'
import { ChatbotCacheService } from './cache.service'
import { importantPhrases, amenitySynonyms } from '../utils/synonyms'

@Injectable()
export class ChatbotKnowledgeService {
  // Kho lưu trữ kiến thức cho RAG
  private knowledgeBase: KnowledgeChunk[] = []
  // Đường dẫn đến thư mục lưu trữ kiến thức
  private readonly ROOT_DIR: string
  private readonly KNOWLEDGE_DIR: string

  constructor(
    private readonly openaiService: ChatbotOpenAIService,
    private readonly cacheService: ChatbotCacheService
  ) {
    // Sử dụng đường dẫn tuyệt đối và cố định để tránh tạo nhiều thư mục
    this.ROOT_DIR = process.cwd().includes('dist')
      ? path.join(process.cwd(), '..')
      : process.cwd()
    this.KNOWLEDGE_DIR = path.join(
      this.ROOT_DIR,
      'src',
      'routes',
      'chatbot',
      'knowledge'
    )

    // Khởi tạo kho kiến thức
    this.initializeKnowledgeBase()
  }

  /**
   * Khởi tạo kho kiến thức từ các file
   */
  async initializeKnowledgeBase(): Promise<void> {
    try {
      console.log(`Đang đọc kho kiến thức từ: ${this.KNOWLEDGE_DIR}`)

      // Kiểm tra xem thư mục knowledge có tồn tại không
      if (!fs.existsSync(this.KNOWLEDGE_DIR)) {
        console.error(`Thư mục knowledge không tồn tại: ${this.KNOWLEDGE_DIR}`)
        console.log(`Khởi tạo kho kiến thức rỗng`)
        return
      }

      // Nếu thư mục knowledge tồn tại, đọc từ thư mục đó
      await this.loadKnowledgeFromDirectory(this.KNOWLEDGE_DIR)
      console.log(
        `Đã tải ${this.knowledgeBase.length} đoạn kiến thức từ ${this.KNOWLEDGE_DIR}`
      )
    } catch (error) {
      console.error('Lỗi khởi tạo kho kiến thức:', error)
    }
  }

  /**
   * Đọc kiến thức từ thư mục
   */
  private async loadKnowledgeFromDirectory(directory: string): Promise<void> {
    const files = fs.readdirSync(directory)

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(directory, file)
        const content = fs.readFileSync(filePath, 'utf8')
        const chunks = JSON.parse(content) as KnowledgeChunk[]

        // Tạo embeddings cho các chunk mới
        for (const chunk of chunks) {
          if (!chunk.embedding) {
            chunk.embedding = await this.openaiService.createEmbedding(
              chunk.content
            )
          }
        }

        this.knowledgeBase.push(...chunks)
      }
    }
  }

  /**
   * Tìm kiếm các đoạn kiến thức liên quan nhất với câu hỏi - phiên bản nâng cao
   */
  async retrieveRelevantKnowledge(
    question: string,
    topK: number = 3
  ): Promise<KnowledgeChunk[]> {
    try {
      // Tạo cache key để tránh tính toán lại cho cùng một câu hỏi
      const cacheKey = `knowledge_${question.toLowerCase().trim().replace(/\s+/g, '_').substring(0, 50)}_${topK}`
      const cachedResults = this.cacheService.getFromCache<KnowledgeChunk[]>(
        'responses',
        cacheKey
      )
      if (cachedResults) {
        return cachedResults
      }

      // Tìm các từ khóa quan trọng trong câu hỏi
      const keywords = this.extractImportantKeywords(question)

      // Tạo embedding cho câu hỏi
      const questionEmbedding =
        await this.openaiService.createEmbedding(question)
      if (questionEmbedding.length === 0) return []

      // Tính điểm tương đồng với từng đoạn kiến thức với trọng số
      const scoredChunks = this.knowledgeBase.map(chunk => {
        // Điểm semantic search
        const semanticScore = this.openaiService.cosineSimilarity(
          questionEmbedding,
          chunk.embedding || []
        )

        // Điểm từ khóa trùng khớp
        let keywordScore = 0
        const content = chunk.content.toLowerCase()
        const category = (chunk.metadata.category || '').toLowerCase()

        for (const keyword of keywords) {
          // Kiểm tra từ khóa trong nội dung
          if (content.includes(keyword.toLowerCase())) {
            keywordScore += 0.1
          }

          // Kiểm tra từ khóa trong danh mục
          if (category.includes(keyword.toLowerCase())) {
            keywordScore += 0.2
          }
        }

        // Tính điểm cuối cùng: 80% semantic + 20% keywords
        const finalScore = semanticScore * 0.8 + keywordScore * 0.2

        return {
          chunk,
          score: finalScore,
        }
      })

      // Sắp xếp theo điểm và lấy top K
      const topChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(item => item.chunk)

      // Lưu vào cache (15 phút)
      this.cacheService.saveToCache('responses', cacheKey, topChunks, 15 * 60)

      return topChunks
    } catch (error) {
      console.error('Lỗi khi truy xuất kiến thức:', error)
      return []
    }
  }

  /**
   * Trích xuất từ khóa quan trọng cho việc tìm kiếm kiến thức
   */
  private extractImportantKeywords(query: string): string[] {
    // Chuẩn hóa câu hỏi
    const normalizedQuery = query.toLowerCase()

    // Tìm các từ quan trọng từ danh sách sẵn có
    const phrases = importantPhrases.filter(phrase =>
      normalizedQuery.includes(phrase)
    )

    // Tìm các từ đồng nghĩa cho tiện ích
    const amenities: string[] = []
    Object.entries(amenitySynonyms).forEach(([amenity, synonyms]) => {
      for (const synonym of synonyms) {
        if (normalizedQuery.includes(synonym)) {
          amenities.push(amenity)
          break
        }
      }
    })

    // Tìm các từ cụ thể liên quan đến thuê nhà
    const specificTerms = [
      'thuê',
      'phòng',
      'trọ',
      'giá',
      'tiện ích',
      'diện tích',
      'đặt cọc',
      'hợp đồng',
      'sinh viên',
      'gần',
      'đại học',
      'an ninh',
      'chủ nhà',
      'đăng tin',
      'đăng bài',
      'thủ tục',
    ].filter(term => normalizedQuery.includes(term))

    // Kết hợp và loại bỏ trùng lặp
    return [...new Set([...phrases, ...amenities, ...specificTerms])]
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
      newChunk.embedding = await this.openaiService.createEmbedding(content)

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
      // Đảm bảo thư mục knowledge tồn tại
      if (!fs.existsSync(this.KNOWLEDGE_DIR)) {
        console.log(
          `Thư mục knowledge không tồn tại, tạo thư mục: ${this.KNOWLEDGE_DIR}`
        )
        fs.mkdirSync(this.KNOWLEDGE_DIR, { recursive: true })
      }

      // Lọc kiến thức theo danh mục
      const categoryChunks = this.knowledgeBase.filter(
        chunk => chunk.metadata.category === category
      )

      // Lưu vào file
      const filePath = path.join(this.KNOWLEDGE_DIR, `${category}.json`)
      fs.writeFileSync(filePath, JSON.stringify(categoryChunks, null, 2))
      console.log(
        `Đã lưu ${categoryChunks.length} đoạn kiến thức vào ${filePath}`
      )
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
      const queryEmbedding = await this.openaiService.createEmbedding(query)

      // Tính điểm tương đồng
      const scoredChunks = this.knowledgeBase.map(chunk => ({
        chunk,
        score: this.openaiService.cosineSimilarity(
          queryEmbedding,
          chunk.embedding || []
        ),
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

  /**
   * Lấy kho kiến thức
   */
  getKnowledgeBase(): KnowledgeChunk[] {
    return this.knowledgeBase
  }

  /**
   * Lấy đoạn kiến thức theo danh mục
   */
  getKnowledgeByCategory(category: string): KnowledgeChunk[] {
    return this.knowledgeBase.filter(
      chunk => chunk.metadata.category === category
    )
  }
}
