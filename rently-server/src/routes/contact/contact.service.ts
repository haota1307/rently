import { Injectable, NotFoundException } from '@nestjs/common'
import { ContactRepository } from './contact.repo'
import { ContactStatus } from '@prisma/client'
import {
  CreateContactDTO,
  RespondContactDTO,
  SendUserEmailDTO,
  SendBulkEmailDTO,
} from './contact.dto'
import { EmailService } from 'src/shared/services/email.service'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'

@Injectable()
export class ContactService {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly emailService: EmailService,
    private readonly sharedUserRepository: SharedUserRepository,
    @InjectQueue('email') private readonly emailQueue: Queue
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

  /**
   * Admin gửi email trực tiếp đến user
   */
  async sendUserEmail(
    userId: number,
    sendEmailDto: SendUserEmailDTO,
    adminId: number
  ) {
    // Tìm user theo ID
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng')
    }

    // Tìm thông tin admin
    const admin = await this.sharedUserRepository.findUnique({ id: adminId })
    if (!admin) {
      throw new NotFoundException('Không tìm thấy thông tin admin')
    }

    // Gửi email đến user
    try {
      await this.emailService.sendAdminDirectEmail({
        to: user.email,
        userName: user.name,
        subject: sendEmailDto.subject,
        message: sendEmailDto.message,
        adminName: admin.name,
        adminEmail: admin.email,
      })

      return { message: 'Gửi email thành công' }
    } catch (error) {
      console.error('Lỗi khi gửi email trực tiếp đến user:', error)
      throw new Error('Gửi email thất bại. Vui lòng thử lại sau.')
    }
  }

  /**
   * Admin gửi email hàng loạt
   */
  async sendBulkEmail(sendBulkEmailDto: SendBulkEmailDTO, adminId: number) {
    // Tìm thông tin admin
    const admin = await this.sharedUserRepository.findUnique({ id: adminId })
    if (!admin) {
      throw new NotFoundException('Không tìm thấy thông tin admin')
    }

    // Build query để lọc users
    const whereConditions: any = {
      deletedAt: null, // Chỉ lấy user chưa bị xóa
    }

    // Filter theo role IDs
    if (
      sendBulkEmailDto.targetAudience.roleIds &&
      sendBulkEmailDto.targetAudience.roleIds.length > 0
    ) {
      whereConditions.roleId = {
        in: sendBulkEmailDto.targetAudience.roleIds,
      }
    }

    // Filter theo user status
    if (sendBulkEmailDto.targetAudience.userStatus) {
      whereConditions.status = sendBulkEmailDto.targetAudience.userStatus
    }

    // Filter theo specific user IDs
    if (
      sendBulkEmailDto.targetAudience.userIds &&
      sendBulkEmailDto.targetAudience.userIds.length > 0
    ) {
      whereConditions.id = {
        in: sendBulkEmailDto.targetAudience.userIds,
      }
    }

    // Lấy danh sách users theo điều kiện
    const users = await this.sharedUserRepository.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (users.length === 0) {
      throw new Error('Không tìm thấy người dùng nào phù hợp với điều kiện')
    }

    // Tạo job để gửi email hàng loạt
    const job = await this.emailQueue.add(
      'sendBulkEmail',
      {
        users,
        subject: sendBulkEmailDto.subject,
        message: sendBulkEmailDto.message,
        adminName: admin.name,
        adminEmail: admin.email,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    )

    return {
      message: 'Đã tạo job gửi email hàng loạt',
      jobId: job.id?.toString() || 'unknown',
      estimatedRecipients: users.length,
    }
  }

  /**
   * Lấy trạng thái job bulk email
   */
  async getBulkEmailStatus(jobId: string) {
    try {
      const job = await this.emailQueue.getJob(jobId)

      if (!job) {
        throw new NotFoundException('Không tìm thấy job')
      }

      const state = await job.getState()
      const progress = job.progress

      // Tạo thông báo thân thiện với người dùng
      let message = ''

      switch (state) {
        case 'completed':
          message = '✅ Đã gửi email thành công đến tất cả người dùng!'
          break
        case 'active':
          message = `📧 Đang gửi email... ${progress ? `(${progress}% hoàn thành)` : ''}`
          break
        case 'waiting':
          message = '⏳ Email đang trong hàng đợi, sẽ được gửi sớm...'
          break
        case 'delayed':
          message = '⏱️ Email bị delay, đang thử lại...'
          break
        case 'failed':
          message = '❌ Gửi email thất bại. Vui lòng thử lại sau.'
          break
        default:
          message = `📋 Trạng thái: ${state}${progress ? ` - ${progress}% hoàn thành` : ''}`
      }

      return { message }
    } catch (error) {
      console.error('Lỗi khi lấy trạng thái job:', error)
      throw new Error('Không thể lấy trạng thái job')
    }
  }
}
