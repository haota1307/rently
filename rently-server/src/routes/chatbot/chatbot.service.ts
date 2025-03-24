import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common'
import OpenAI from 'openai'
import { RentalService } from 'src/routes/rental/rental.service'

@Injectable()
export class ChatbotService {
  private openai: OpenAI

  constructor(private readonly rentalService: RentalService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Phân tích tin nhắn người dùng và trích xuất tiêu chí tìm phòng theo định dạng JSON
   */
  private async extractCriteria(message: string): Promise<{
    budget: string | null
    amenities: string[]
    userType: string | null
    location: string | null
  }> {
    const prompt = `
        Trong hệ thống tìm phòng trọ của chúng tôi, các bất động sản (Rental) có các thông tin chính gồm:
    - "address": chứa địa chỉ hoặc tên khu vực.
    - Các phòng trọ (Room) có thông tin "price" (số) và "amenities" (danh sách tiện ích, ví dụ: "máy lạnh", "wifi", "ban công", "bàn làm việc").

    Hãy phân tích tin nhắn sau và trích xuất tiêu chí tìm kiếm dưới dạng JSON với các trường sau:
    - "location": (string | null) tên khu vực hoặc địa chỉ mà người dùng quan tâm.
    - "price": (string | null) mức giá mong muốn, chọn một trong các giá trị: "rẻ", "trung bình", "cao". Ví dụ: "rẻ" tương ứng với mức giá dưới 2 triệu.
    - "amenities": (array) danh sách tiện ích cần có, chỉ chấp nhận từ danh sách: ["máy lạnh", "wifi", "ban công", "bàn làm việc"].
    - "userType": (string | null) loại người tìm trọ, ví dụ "sinh viên", "gia đình". Nếu không xác định, để null.

    Tin nhắn: "${message}"

    Output JSON:`

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new InternalServerErrorException(
          'Không nhận được phản hồi từ ChatGPT'
        )
      }

      let criteria
      try {
        criteria = JSON.parse(content)
      } catch (parseError) {
        throw new HttpException(
          'Không thể phân tích tiêu chí từ tin nhắn. Vui lòng thử lại.',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      }

      // Kiểm tra tiêu chí: đảm bảo có ít nhất thông tin về budget hoặc amenities
      if (
        !criteria ||
        (!criteria.budget &&
          (!criteria.amenities || criteria.amenities.length === 0))
      ) {
        throw new HttpException(
          'Tiêu chí tìm kiếm không đủ rõ ràng. Vui lòng cung cấp thêm thông tin.',
          HttpStatus.BAD_REQUEST
        )
      }

      return criteria
    } catch (error: any) {
      throw new InternalServerErrorException(error.message)
    }
  }

  /**
   * Gọi RentalService.list với tiêu chí tìm kiếm được trích xuất
   */
  async searchRentals(message: string) {
    const criteria = await this.extractCriteria(message)
    const queryParams = {
      page: 1,
      limit: 10,
      budget: criteria.budget,
      amenities: Array.isArray(criteria.amenities)
        ? criteria.amenities.join(',')
        : null,
      userType: criteria.userType,
      location: criteria.location,
    }

    const rentals = await this.rentalService.list(queryParams)
    return { criteria, rentals }
  }
}
