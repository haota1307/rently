import { Injectable } from '@nestjs/common'

interface CacheItem<T> {
  value: T
  expiry: number // thời gian hết hạn (timestamp)
}

@Injectable()
export class ChatbotCacheService {
  // Cache cho các tiêu chí tìm kiếm đã được phân tích
  private criteriaCache: Map<string, CacheItem<any>> = new Map()
  // Cache cho kết quả tìm kiếm
  private searchResultsCache: Map<string, CacheItem<any>> = new Map()
  // Cache cho các câu trả lời từ RAG
  private responsesCache: Map<string, CacheItem<any>> = new Map()
  // Cache cho các kết quả phân tích ý định
  private intentsCache: Map<string, CacheItem<any>> = new Map()

  /**
   * Lưu dữ liệu vào cache với thời gian hết hạn
   * @param cacheType Loại cache ('criteria', 'searchResults', 'responses', 'intents')
   * @param key Khóa cache
   * @param value Giá trị cần lưu
   * @param ttlSeconds Thời gian sống của cache (giây), mặc định là 5 phút
   */
  saveToCache<T>(
    cacheType: 'criteria' | 'searchResults' | 'responses' | 'intents',
    key: string,
    value: T,
    ttlSeconds: number = 300
  ): void {
    const cache = this.getCacheMapByType(cacheType)

    const item: CacheItem<T> = {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    }

    cache.set(key, item)

    // Giới hạn kích thước cache
    if (cache.size > 100) {
      // Xóa mục cũ nhất nếu vượt quá 100 mục
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }
  }

  /**
   * Lấy dữ liệu từ cache nếu còn hạn
   * @param cacheType Loại cache ('criteria', 'searchResults', 'responses', 'intents')
   * @param key Khóa cache
   * @returns Giá trị từ cache hoặc null nếu không tìm thấy/hết hạn
   */
  getFromCache<T>(
    cacheType: 'criteria' | 'searchResults' | 'responses' | 'intents',
    key: string
  ): T | null {
    const cache = this.getCacheMapByType(cacheType)

    const item = cache.get(key) as CacheItem<T>

    if (!item) return null

    // Kiểm tra tính hợp lệ
    if (Date.now() > item.expiry) {
      // Hết hạn, xóa khỏi cache
      cache.delete(key)
      return null
    }

    return item.value
  }

  /**
   * Lấy đối tượng Map cache dựa trên loại
   */
  private getCacheMapByType(
    cacheType: 'criteria' | 'searchResults' | 'responses' | 'intents'
  ): Map<string, CacheItem<any>> {
    switch (cacheType) {
      case 'criteria':
        return this.criteriaCache
      case 'searchResults':
        return this.searchResultsCache
      case 'responses':
        return this.responsesCache
      case 'intents':
        return this.intentsCache
      default:
        return this.responsesCache
    }
  }

  /**
   * Xóa tất cả cache
   */
  clearAllCache(): void {
    this.criteriaCache.clear()
    this.searchResultsCache.clear()
    this.responsesCache.clear()
    this.intentsCache.clear()
  }
}
