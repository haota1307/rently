import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import {
  CreateViewingScheduleBodyType,
  UpdateViewingScheduleBodyType,
  GetViewingSchedulesQueryType,
  GetViewingSchedulesResType,
  ViewingScheduleType,
} from './viewing-schedule.model'
import { ViewingScheduleRepo } from './viewing-schedule.repo'
import { PrismaService } from 'src/shared/services/prisma.service'
import { EmailService } from 'src/shared/services/email.service'
import { addHours, isBefore } from 'date-fns'
import { Cron } from '@nestjs/schedule'
import { NotificationService } from 'src/routes/notification/notification.service'
import { Logger } from '@nestjs/common'

// Định nghĩa kiểu dữ liệu cho schedule với thông tin quan hệ
interface ScheduleWithRelations {
  id: number
  postId: number
  tenantId: number
  landlordId: number
  viewingDate: Date
  status: string
  rescheduledDate: Date | null
  note: string | null
  requireTenantConfirmation: boolean
  createdAt: Date
  updatedAt: Date
  post: {
    id: number
    title: string
    rental: {
      address: string
    } | null
  }
  tenant: {
    id: number
    name: string
    email: string
    phoneNumber: string | null
  }
  landlord: {
    id: number
    name: string
    phoneNumber: string | null
  }
}

@Injectable()
export class ViewingScheduleService {
  private readonly logger = new Logger(ViewingScheduleService.name)

  constructor(
    private viewingScheduleRepo: ViewingScheduleRepo,
    private prismaService: PrismaService,
    private emailService: EmailService,
    private readonly notificationService: NotificationService
  ) {}

  async create(
    body: CreateViewingScheduleBodyType,
    userId: number
  ): Promise<ViewingScheduleType> {
    console.log('userId', userId)

    if (!userId) {
      throw new BadRequestException('Người dùng không hợp lệ')
    }

    // Kiểm tra post có tồn tại không
    const post = await this.prismaService.rentalPost.findUnique({
      where: { id: body.postId },
      include: { room: true },
    })

    if (!post) {
      throw new NotFoundException('Bài đăng không tồn tại')
    }

    // Kiểm tra user có phải là client không
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    })

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại')
    }

    if (user.role.name !== 'CLIENT') {
      throw new ForbiddenException(
        'Chỉ khách hàng mới có thể đặt lịch xem phòng'
      )
    }

    const existingSchedule = await this.prismaService.viewingSchedule.findFirst(
      {
        where: {
          postId: body.postId,
          tenantId: userId,
          status: {
            notIn: ['REJECTED'], // Các trạng thái chưa bị hủy
          },
        },
      }
    )

    if (existingSchedule) {
      throw new BadRequestException(
        'Bạn đã có lịch hẹn xem phòng này. Vui lòng không đặt lịch trùng lặp.'
      )
    }

    const schedule = await this.viewingScheduleRepo.create(body, userId)

    // Gửi thông báo cho chủ nhà
    console.log('Sending viewing schedule notification to landlord:', {
      landlordId: post.landlordId,
      viewingDate: schedule.viewingDate,
      roomTitle: post.room.title,
      scheduleId: schedule.id,
    })

    await this.notificationService.notifyViewingSchedule(
      post.landlordId,
      schedule.viewingDate,
      post.room.title,
      schedule.id
    )

    return schedule
  }

  async update(
    id: number,
    body: UpdateViewingScheduleBodyType,
    userId: number
  ): Promise<ViewingScheduleType> {
    if (!userId) {
      throw new BadRequestException('Người dùng không hợp lệ')
    }

    const schedule = await this.viewingScheduleRepo.findOneByIdAndUserId(
      id,
      userId
    )

    if (!schedule) {
      throw new NotFoundException(
        'Lịch xem phòng không tồn tại hoặc bạn không có quyền cập nhật'
      )
    }

    const updatedSchedule = await this.viewingScheduleRepo.update(id, body)

    // Nếu lịch hẹn được phê duyệt, gửi email xác nhận
    if (body.status === 'APPROVED') {
      await this.sendReminderForSchedule(id)
    }

    return updatedSchedule
  }

  async list(
    query: GetViewingSchedulesQueryType,
    userId: number
  ): Promise<GetViewingSchedulesResType> {
    if (!userId) {
      throw new BadRequestException('Người dùng không hợp lệ')
    }

    // Xử lý query params
    const safeQuery = {
      ...query,
      page: Number(query.page || 1),
      limit: Number(query.limit || 10),
    }

    // Lấy vai trò của người dùng
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    })

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại')
    }

    const role = user.role.name

    return this.viewingScheduleRepo.list(safeQuery, userId, role)
  }

  async findById(id: number, userId: number): Promise<ViewingScheduleType> {
    if (!userId) {
      throw new BadRequestException('Người dùng không hợp lệ')
    }

    const schedule = await this.viewingScheduleRepo.findOneByIdAndUserId(
      id,
      userId
    )

    if (!schedule) {
      throw new NotFoundException(
        'Lịch xem phòng không tồn tại hoặc bạn không có quyền xem'
      )
    }

    return schedule
  }

  // Gửi nhắc nhở cho lịch hẹn cụ thể
  async sendReminderForSchedule(
    scheduleId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Lấy thông tin lịch hẹn với các quan hệ cần thiết dùng select thay vì include
      const scheduleData = await this.prismaService.viewingSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          post: {
            select: {
              title: true,
              rental: {
                select: {
                  address: true,
                },
              },
            },
          },
          tenant: {
            select: {
              name: true,
              email: true,
            },
          },
          landlord: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
      })

      if (!scheduleData) {
        return { success: false, message: 'Lịch hẹn không tồn tại' }
      }

      // Type casting để TypeScript hiểu đúng cấu trúc dữ liệu
      const schedule = scheduleData as unknown as ScheduleWithRelations

      // Chỉ gửi nhắc nhở cho lịch hẹn đã được duyệt
      if (schedule.status !== 'APPROVED') {
        return { success: false, message: 'Lịch hẹn chưa được duyệt' }
      }

      const viewingDate = new Date(schedule.viewingDate)
      const now = new Date()

      // Kiểm tra xem lịch hẹn có trong tương lai không
      if (isBefore(viewingDate, now)) {
        return { success: false, message: 'Lịch hẹn đã qua' }
      }

      // Gửi email nhắc lịch hẹn
      const { error } = await this.emailService.sendViewingReminder({
        email: schedule.tenant.email,
        scheduledTime: viewingDate,
        propertyName: schedule.post.title,
        propertyAddress: schedule.post.rental?.address || '',
        landlordName: schedule.landlord.name,
        landlordPhone: schedule.landlord.phoneNumber || undefined,
        tenantName: schedule.tenant.name,
      })

      if (error) {
        return { success: false, message: 'Không thể gửi email nhắc lịch hẹn' }
      }

      return { success: true, message: 'Đã gửi email nhắc lịch hẹn thành công' }
    } catch (error) {
      console.error('Lỗi khi gửi nhắc lịch hẹn:', error)
      return { success: false, message: 'Đã xảy ra lỗi khi gửi nhắc lịch hẹn' }
    }
  }

  // API endpoint để gửi nhắc nhở thủ công
  async sendReminder(
    scheduleId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    // Kiểm tra quyền hạn
    const schedule = await this.viewingScheduleRepo.findOneByIdAndUserId(
      scheduleId,
      userId
    )

    if (!schedule) {
      throw new NotFoundException(
        'Lịch xem phòng không tồn tại hoặc bạn không có quyền thực hiện hành động này'
      )
    }

    return this.sendReminderForSchedule(scheduleId)
  }

  @Cron('0 21 * * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async sendDailyReminders(): Promise<void> {
    try {
      const now = new Date()
      const tomorrow = addHours(now, 24)

      console.log(
        `[${new Date().toISOString()}] Bắt đầu gửi nhắc lịch hẹn tự động...`
      )

      // Lấy tất cả lịch hẹn đã được phê duyệt, diễn ra trong vòng 24h tới
      const schedulesData = await this.prismaService.viewingSchedule.findMany({
        where: {
          status: 'APPROVED',
          viewingDate: {
            gte: now,
            lte: tomorrow,
          },
        },
        include: {
          post: {
            select: {
              title: true,
              rental: {
                select: {
                  address: true,
                },
              },
            },
          },
          tenant: {
            select: {
              name: true,
              email: true,
            },
          },
          landlord: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
      })

      // Type casting để TypeScript hiểu đúng cấu trúc dữ liệu
      const upcomingSchedules =
        schedulesData as unknown as ScheduleWithRelations[]

      console.log(
        `Tìm thấy ${upcomingSchedules.length} lịch hẹn sắp diễn ra trong 24h tới`
      )

      // Gửi email cho từng lịch hẹn
      for (const schedule of upcomingSchedules) {
        try {
          const viewingDate = new Date(schedule.viewingDate)

          await this.emailService.sendViewingReminder({
            email: schedule.tenant.email,
            scheduledTime: viewingDate,
            propertyName: schedule.post.title,
            propertyAddress: schedule.post.rental?.address || '',
            landlordName: schedule.landlord.name,
            landlordPhone: schedule.landlord.phoneNumber || undefined,
            tenantName: schedule.tenant.name,
          })

          console.log(
            `Đã gửi nhắc lịch hẹn cho: ${schedule.tenant.email}, lịch hẹn ID: ${schedule.id}`
          )
        } catch (error) {
          console.error(
            `Lỗi khi gửi email cho lịch hẹn ID ${schedule.id}:`,
            error
          )
        }
      }

      console.log(
        `[${new Date().toISOString()}] Hoàn thành gửi nhắc lịch hẹn tự động.`
      )
    } catch (error) {
      console.error('Lỗi khi gửi nhắc lịch hẹn hàng ngày:', error)
    }
  }

  // Thêm phương thức nhắc nhở lịch hẹn
  async sendScheduleReminder(scheduleId: number) {
    try {
      // Lấy thông tin lịch hẹn
      const schedule = await this.prismaService.viewingSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          post: {
            include: { room: true },
          },
        },
      })

      if (!schedule) {
        throw new NotFoundException('Không tìm thấy lịch hẹn')
      }

      // Gửi thông báo nhắc nhở cho người thuê
      await this.notificationService.notifyViewingSchedule(
        schedule.tenantId,
        schedule.viewingDate,
        schedule.post.room.title,
        scheduleId
      )

      // Gửi thông báo nhắc nhở cho chủ nhà
      await this.notificationService.notifyViewingSchedule(
        schedule.landlordId,
        schedule.viewingDate,
        schedule.post.room.title,
        scheduleId
      )

      return { success: true, message: 'Đã gửi nhắc nhở lịch hẹn' }
    } catch (error) {
      throw error
    }
  }

  @Cron('0 */1 * * * *') // Chạy mỗi 1 phút
  async handleScheduleReminders() {
    try {
      const currentDate = new Date()
      // Lấy các lịch hẹn sắp diễn ra trong 1 giờ tới
      const oneHourLater = new Date(currentDate.getTime() + 60 * 60 * 1000)

      // Tìm các lịch hẹn cần nhắc nhở
      const schedulesToRemind =
        await this.prismaService.viewingSchedule.findMany({
          where: {
            viewingDate: {
              gte: currentDate,
              lte: oneHourLater,
            },
            // Thêm điều kiện để không nhắc lại nhiều lần
            // Có thể lưu trạng thái đã nhắc trong DB hoặc dùng cách khác
          },
          include: {
            post: {
              include: { room: true },
            },
          },
        })

      // Gửi thông báo cho từng lịch hẹn
      for (const schedule of schedulesToRemind) {
        // Gửi thông báo cho người thuê
        await this.notificationService.notifyViewingSchedule(
          schedule.tenantId,
          schedule.viewingDate,
          schedule.post.room.title,
          schedule.id
        )

        // Gửi thông báo cho chủ nhà
        await this.notificationService.notifyViewingSchedule(
          schedule.landlordId,
          schedule.viewingDate,
          schedule.post.room.title,
          schedule.id
        )

        // Cập nhật trạng thái đã nhắc (nếu cần)
        // await this.prismaService.viewingSchedule.update({ ... })
      }

      this.logger.log(
        `Sent reminders for ${schedulesToRemind.length} upcoming viewing schedules`
      )
    } catch (error) {
      this.logger.error(`Error sending schedule reminders: ${error.message}`)
    }
  }
}
