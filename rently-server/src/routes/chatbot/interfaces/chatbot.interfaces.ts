/**
 * Interfaces cho module chatbot
 */

/**
 * Cấu trúc bộ nhớ đệm cho các kết quả
 */
export interface CacheEntry<T> {
  value: T
  timestamp: number
}

/**
 * Định nghĩa đoạn kiến thức trong kho RAG
 */
export interface KnowledgeChunk {
  id: string
  content: string
  embedding?: number[]
  metadata: {
    source: string
    category: string
    createdAt: Date
    title?: string
  }
}

/**
 * Kết quả phân tích tin nhắn
 */
export interface MessageAnalysisResult {
  intent: 'search' | 'general' | 'math' | 'advice' | 'posting_guide'
  content: string
  criteria?: any
}

/**
 * Tiêu chí tìm kiếm phòng
 */
export interface SearchCriteria {
  price?: {
    min?: number
    max?: number
  }
  area?: {
    min?: number
    max?: number
  }
  amenities?: string[]
  address?: string
  distance?: {
    max: number
    location?: any
  }
  userType?: string
  roomType?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onlyTopResult?: boolean
}

/**
 * Kết quả tìm kiếm phòng
 */
export interface SearchResult {
  criteria?: SearchCriteria
  summary: string
  results: any[]
  totalFound: number
  error?: string
}
