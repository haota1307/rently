import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  HttpException,
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
    // Kiểm tra xem yêu cầu thuê có tồn tại không
    const rentalRequest = await this.prismaService.rentalRequest.findUnique({
      where: { id },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            roomId: true,
          },
        },
      },
    })

    if (!rentalRequest) {
      throw new HttpException('Rental request not found', 404)
    }

    // Kiểm tra quyền cập nhật yêu cầu thuê
    if (
      (roleName === 'tenant' && rentalRequest.tenantId !== userId) ||
      (roleName === 'landlord' && rentalRequest.landlordId !== userId)
    ) {
      throw new HttpException(
        'You do not have permission to update this rental request',
        403
      )
    }

    // Kiểm tra quyền thay đổi trạng thái
    if (data.status) {
      // Tenant chỉ có thể hủy yêu cầu
      if (
        roleName === 'tenant' &&
        data.status !== RentalRequestStatus.CANCELED
      ) {
        throw new HttpException('Tenant can only cancel rental requests', 403)
      }

      // Landlord có thể chấp nhận hoặc từ chối yêu cầu
      if (
        roleName === 'landlord' &&
        data.status !== RentalRequestStatus.APPROVED &&
        data.status !== RentalRequestStatus.REJECTED
      ) {
        throw new HttpException(
          'Landlord can only approve or reject rental requests',
          403
        )
      }

      // Kiểm tra trạng thái hiện tại
      if (
        rentalRequest.status === RentalRequestStatus.CANCELED ||
        rentalRequest.status === RentalRequestStatus.REJECTED
      ) {
        throw new HttpException(
          'Cannot change status of a canceled or rejected rental request',
          400
        )
      }
    }

    // Cập nhật yêu cầu
    const updatedRequest = await this.rentalRequestRepo.update({
      id,
      data,
    })

    // Nếu yêu cầu được chấp nhận, cập nhật trạng thái phòng thành "đã cho thuê" và từ chối các yêu cầu khác
    if (data.status === RentalRequestStatus.APPROVED) {
      // Cập nhật trạng thái phòng thành đã cho thuê (isAvailable = false)
      const roomId = rentalRequest.post?.roomId

      if (roomId) {
        await this.prismaService.room.update({
          where: { id: roomId },
          data: { isAvailable: false },
        })

        // Từ chối tất cả các yêu cầu thuê khác cho cùng một bài đăng
        const otherPendingRequests =
          await this.prismaService.rentalRequest.findMany({
            where: {
              postId: updatedRequest.postId,
              status: RentalRequestStatus.PENDING,
              id: { not: id },
            },
          })

        for (const pendingRequest of otherPendingRequests) {
          await this.prismaService.rentalRequest.update({
            where: { id: pendingRequest.id },
            data: {
              status: RentalRequestStatus.REJECTED,
              rejectionReason: 'Phòng đã được cho thuê bởi người khác',
            },
          })
        }
      }
    }

    // Nếu yêu cầu đã được chấp nhận trước đó và bây giờ bị từ chối hoặc hủy, cập nhật trạng thái phòng thành "còn trống"
    if (
      (data.status === RentalRequestStatus.CANCELED ||
        data.status === RentalRequestStatus.REJECTED) &&
      rentalRequest.status === RentalRequestStatus.APPROVED
    ) {
      const roomId = rentalRequest.post?.roomId

      if (roomId) {
        // Cập nhật trạng thái phòng thành còn trống (isAvailable = true)
        await this.prismaService.room.update({
          where: { id: roomId },
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
