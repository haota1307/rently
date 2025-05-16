import { Injectable, NotFoundException } from '@nestjs/common'
import { ContactRepository } from './contact.repo'
import { ContactStatus } from '@prisma/client'
import { CreateContactDTO, RespondContactDTO } from './contact.dto'
import { EmailService } from 'src/shared/services/email.service'

@Injectable()
export class ContactService {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly emailService: EmailService
  ) {}

  /**
   * Tạo một liên hệ mới
   */
  async create(createContactDto: CreateContactDTO) {
    const contact = await this.contactRepository.create(createContactDto)

    // Gửi email thông báo cho admin
    try {
      await this.emailService.sendContactNotification({
        adminEmail: process.env.ADMIN_EMAIL || 'admin@rently.com',
        fullName: contact.fullName,
        email: contact.email,
        phoneNumber: contact.phoneNumber || undefined,
        subject: contact.subject,
        message: contact.message,
      })
    } catch (error) {
      console.error('Lỗi khi gửi email thông báo liên hệ mới:', error)
      // Tiếp tục xử lý ngay cả khi gửi email thất bại
    }

    return { message: 'Gửi liên hệ thành công' }
  }

  /**
   * Lấy danh sách liên hệ với phân trang và tìm kiếm
   */
  async findAll(params: {
    page?: number | string
    limit?: number | string
    status?: ContactStatus
    search?: string
  }) {
    // Đảm bảo page và limit là số
    const page = params.page ? Number(params.page) : 1
    const limit = params.limit ? Number(params.limit) : 10
    const { status, search } = params

    const skip = (page - 1) * limit

    const [contacts, total] = await Promise.all([
      this.contactRepository.findAll({
        skip,
        take: limit,
        status,
        search,
      }),
      this.contactRepository.count({
        status,
        search,
      }),
    ])

    return {
      data: contacts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Lấy chi tiết một liên hệ theo ID
   */
  async findOne(id: number) {
    const contact = await this.contactRepository.findById(id)

    if (!contact) {
      throw new NotFoundException('Không tìm thấy liên hệ')
    }

    return contact
  }

  /**
   * Phản hồi một liên hệ
   */
  async respond(id: number, respondDto: RespondContactDTO, userId: number) {
    const contact = await this.findOne(id)

    const updated = await this.contactRepository.update(id, {
      response: respondDto.response,
      status: ContactStatus.RESPONDED,
      respondedAt: new Date(),
      respondedById: userId,
    })

    // Gửi email phản hồi cho người dùng
    try {
      await this.emailService.sendContactResponse({
        to: contact.email,
        userName: contact.fullName,
        subject: contact.subject,
        originalMessage: contact.message,
        responseMessage: respondDto.response,
      })
    } catch (error) {
      console.error('Lỗi khi gửi email phản hồi:', error)
      // Tiếp tục xử lý ngay cả khi gửi email thất bại
    }

    return updated
  }

  /**
   * Đóng một liên hệ
   */
  async close(id: number) {
    const contact = await this.findOne(id)

    return this.contactRepository.update(id, {
      status: ContactStatus.CLOSED,
    })
  }
}
