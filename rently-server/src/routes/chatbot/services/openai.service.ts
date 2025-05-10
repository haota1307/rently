import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable()
export class ChatbotOpenAIService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Tạo embedding cho văn bản sử dụng OpenAI API
   */
  async createEmbedding(text: string): Promise<number[]> {
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
   * Tạo câu trả lời từ OpenAI API với prompt cụ thể
   */
  async generateCompletion(
    prompt: string,
    model: string = 'gpt-4o-mini',
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature,
        max_tokens: maxTokens,
      })

      return (
        completion.choices[0]?.message?.content ||
        'Xin lỗi, tôi không thể trả lời câu hỏi này.'
      )
    } catch (error) {
      console.error('Lỗi khi tạo câu trả lời:', error)
      return 'Xin lỗi, tôi đang gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.'
    }
  }

  /**
   * Tính độ tương đồng cosine giữa hai vector
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
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
}
