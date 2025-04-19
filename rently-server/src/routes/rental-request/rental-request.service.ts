import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { RentalRequestRepo } from './rental-request.repo'
import {
  CreateRentalRequestBodyType,
  GetRentalRequestsQueryType,
  RentalRequestDetailType,
  RentalRequestStatus,
  UpdateRentalRequestBodyType,
} from './rental-request.model'
import { RoleName } from 'src/shared/constants/role.constant'
import { EmailService } from 'src/shared/services/email.service'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class RentalRequestService {
  constructor(
    private readonly rentalRequestRepo: RentalRequestRepo,
    private readonly emailService: EmailService,
    private readonly prismaService: PrismaService
  ) {}

  // Lấy danh sách yêu cầu thuê
  async list(query: GetRentalRequestsQueryType, userId: number, role: string) {
    return this.rentalRequestRepo.list(query, userId, query.role)
  }

  // Lấy chi tiết yêu cầu thuê
  async findById(id: number, userId: number, roleName: string) {
    const rentalRequest = await this.rentalRequestRepo.findById(id)

    if (!rentalRequest) {
      throw new NotFoundException('Yêu cầu thuê không tồn tại')
    }

    // Kiểm tra quyền truy cập: chỉ admin, tenant hoặc landlord của yêu cầu này mới có quyền xem
    if (
      roleName !== RoleName.Admin &&
      rentalRequest.tenantId !== userId &&
      rentalRequest.landlordId !== userId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xem thông tin yêu cầu thuê này'
      )
    }

    return rentalRequest
  }

  // Tạo yêu cầu thuê mới
  async create(data: CreateRentalRequestBodyType, userId: number) {
    // Kiểm tra xem đã có yêu cầu thuê nào đang PENDING hoặc APPROVED cho post này chưa
    const existingRequest = await this.prismaService.rentalRequest.findFirst({
      where: {
        postId: data.postId,
        tenantId: userId,
        OR: [
          { status: RentalRequestStatus.PENDING },
          { status: RentalRequestStatus.APPROVED },
        ],
      },
    })

    if (existingRequest) {
      const statusMessage =
        existingRequest.status === RentalRequestStatus.PENDING
          ? 'đang chờ xử lý'
          : 'đã được chấp thuận'
      throw new BadRequestException(
        `Bạn đã có một yêu cầu thuê ${statusMessage} cho bài đăng này. Không thể tạo thêm yêu cầu mới.`
      )
    }

    // Kiểm tra xem bài đăng có sẵn sàng cho thuê hay không
    const post = await this.prismaService.rentalPost.findUnique({
      where: { id: data.postId },
      include: {
        room: {
          select: {
            isAvailable: true,
          },
        },
      },
    })

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng này')
    }

    if (post.room && !post.room.isAvailable) {
      throw new BadRequestException('Phòng này hiện không có sẵn để cho thuê')
    }

    // Tạo yêu cầu mới
    const rentalRequest = await this.rentalRequestRepo.create({
      data,
      tenantId: userId,
    })

    // Lấy thông tin để gửi email
    const landlord = await this.prismaService.user.findUnique({
      where: { id: rentalRequest.landlordId },
      select: { email: true, name: true },
    })

    const tenant = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })

    const postInfo = await this.prismaService.rentalPost.findUnique({
      where: { id: data.postId },
      select: { title: true },
    })

    // Gửi email thông báo cho chủ nhà
    if (landlord && tenant && postInfo) {
      try {
        await this.emailService.send({
          to: landlord.email,
          subject: 'Yêu cầu thuê mới',
          html: `
            <p>Chào ${landlord.name},</p>
            <p>Bạn vừa nhận được một yêu cầu thuê mới từ ${tenant.name} cho tin đăng "${postInfo.title}".</p>
            <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và phản hồi yêu cầu.</p>
            <p>Trân trọng,</p>
            <p>Đội ngũ Rently</p>
          `,
        })
      } catch (error) {
        console.error('Failed to send email notification:', error)
      }
    }

    return rentalRequest
  }

  // Cập nhật yêu cầu thuê
  async update(
    id: number,
    data: UpdateRentalRequestBodyType,
    userId: number,
    roleName: string
  ) {
    // Kiểm tra yêu cầu thuê tồn tại hay không
    const rentalRequest = await this.rentalRequestRepo.findById(id)
    if (!rentalRequest) {
      throw new NotFoundException('Yêu cầu thuê không tồn tại')
    }

    // Kiểm tra quyền hạn cập nhật
    // Chỉ admin, landlord hoặc tenant của yêu cầu mới được phép cập nhật
    if (
      roleName !== RoleName.Admin &&
      rentalRequest.tenantId !== userId &&
      rentalRequest.landlordId !== userId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật yêu cầu thuê này'
      )
    }

    // Client chỉ được phép hủy yêu cầu, không được cập nhật các trạng thái khác
    if (
      rentalRequest.tenantId === userId &&
      data.status &&
      data.status !== RentalRequestStatus.CANCELED
    ) {
      throw new ForbiddenException(
        'Người thuê chỉ có thể hủy yêu cầu, không thể thay đổi trạng thái khác'
      )
    }

    // Landlord chỉ được phép phê duyệt hoặc từ chối yêu cầu
    if (
      rentalRequest.landlordId === userId &&
      data.status &&
      ![RentalRequestStatus.APPROVED, RentalRequestStatus.REJECTED].includes(
        data.status
      )
    ) {
      throw new ForbiddenException(
        'Chủ nhà chỉ có thể phê duyệt hoặc từ chối yêu cầu'
      )
    }

    // Nếu từ chối yêu cầu, cần có lý do
    if (data.status === RentalRequestStatus.REJECTED && !data.rejectionReason) {
      throw new BadRequestException(
        'Vui lòng cung cấp lý do từ chối yêu cầu thuê'
      )
    }

    // Thực hiện cập nhật yêu cầu
    const updatedRequest = await this.rentalRequestRepo.update({
      id,
      data,
    })

    // Nếu yêu cầu được chấp nhận, cập nhật trạng thái phòng thành "đã cho thuê"
    if (data.status === RentalRequestStatus.APPROVED) {
      // Tìm thông tin postId và roomId
      const post = await this.prismaService.rentalPost.findUnique({
        where: { id: updatedRequest.postId },
        select: { roomId: true },
      })

      if (post) {
        // Cập nhật trạng thái phòng thành đã cho thuê (isAvailable = false)
        await this.prismaService.room.update({
          where: { id: post.roomId },
          data: { isAvailable: false },
        })

        // Từ chối tất cả các yêu cầu PENDING khác cho phòng này
        // Tìm tất cả các post liên quan đến room này
        const relatedPosts = await this.prismaService.rentalPost.findMany({
          where: { roomId: post.roomId },
          select: { id: true },
        })

        if (relatedPosts.length > 0) {
          const postIds = relatedPosts.map(p => p.id)

          // Từ chối tất cả các yêu cầu PENDING cho các bài đăng liên quan đến phòng này
          await this.prismaService.rentalRequest.updateMany({
            where: {
              postId: { in: postIds },
              status: RentalRequestStatus.PENDING,
              id: { not: updatedRequest.id }, // Không bao gồm yêu cầu hiện tại
            },
            data: {
              status: RentalRequestStatus.REJECTED,
              rejectionReason: 'Phòng đã được cho thuê bởi người khác',
            },
          })
        }
      }
    }

    // Nếu yêu cầu đã được chấp nhận trước đó và bây giờ bị hủy, cập nhật trạng thái phòng thành "còn trống"
    if (
      data.status === RentalRequestStatus.CANCELED &&
      rentalRequest.status === RentalRequestStatus.APPROVED
    ) {
      const post = await this.prismaService.rentalPost.findUnique({
        where: { id: updatedRequest.postId },
        select: { roomId: true },
      })

      if (post) {
        // Cập nhật trạng thái phòng thành còn trống (isAvailable = true)
        await this.prismaService.room.update({
          where: { id: post.roomId },
          data: { isAvailable: true },
        })
      }
    }

    // Gửi thông báo email khi trạng thái thay đổi
    if (data.status) {
      const statusMessages = {
        [RentalRequestStatus.APPROVED]: 'đã được chấp thuận',
        [RentalRequestStatus.REJECTED]: 'đã bị từ chối',
        [RentalRequestStatus.CANCELED]: 'đã bị hủy',
      }

      const notificationTarget =
        data.status === RentalRequestStatus.CANCELED
          ? await this.prismaService.user.findUnique({
              where: { id: updatedRequest.landlordId },
              select: { email: true, name: true },
            })
          : await this.prismaService.user.findUnique({
              where: { id: updatedRequest.tenantId },
              select: { email: true, name: true },
            })

      const sender =
        data.status === RentalRequestStatus.CANCELED
          ? await this.prismaService.user.findUnique({
              where: { id: updatedRequest.tenantId },
              select: { name: true },
            })
          : await this.prismaService.user.findUnique({
              where: { id: updatedRequest.landlordId },
              select: { name: true },
            })

      const post = await this.prismaService.rentalPost.findUnique({
        where: { id: updatedRequest.postId },
        select: { title: true },
      })

      if (notificationTarget && sender && post) {
        try {
          await this.emailService.send({
            to: notificationTarget.email,
            subject: `Cập nhật trạng thái yêu cầu thuê: ${statusMessages[data.status]}`,
            html: `
              <p>Chào ${notificationTarget.name},</p>
              <p>Yêu cầu thuê của bạn cho tin đăng "${post.title}" ${
                statusMessages[data.status]
              } bởi ${sender.name}.</p>
              ${
                data.status === RentalRequestStatus.REJECTED &&
                data.rejectionReason
                  ? `<p>Lý do: ${data.rejectionReason}</p>`
                  : ''
              }
              <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết.</p>
              <p>Trân trọng,</p>
              <p>Đội ngũ Rently</p>
            `,
          })
        } catch (error) {
          console.error('Failed to send email notification:', error)
        }
      }
    }

    return updatedRequest
  }
}
