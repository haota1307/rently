import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources'

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
   * Tạo câu trả lời dựa trên hội thoại nhiều lượt với OpenAI API
   */
  async chatCompletion(
    messages: ChatCompletionMessageParam[],
    model: string = 'gpt-4o-mini',
    options: {
      temperature?: number
      max_tokens?: number
    } = {}
  ) {
    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
      })

      return completion
    } catch (error) {
      console.error('Lỗi khi tạo chat completion:', error)
      throw new Error('Không thể tạo chat completion')
    }
  }

  /**
   * Sử dụng OpenAI Function Calling để trích xuất dữ liệu có cấu trúc
   */
  async createFunctionCall(options: {
    messages: ChatCompletionMessageParam[]
    functions: Array<{
      name: string
      description?: string
      parameters: Record<string, any>
    }>
    function_call?: { name: string } | 'auto' | 'none'
    model?: string
  }) {
    try {
      const response = await this.openai.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: options.messages,
        functions: options.functions,
        function_call: options.function_call || 'auto',
      })

      return response.choices[0].message
    } catch (error) {
      console.error('Lỗi khi sử dụng function calling:', error)
      throw new Error('Không thể thực hiện function calling')
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
