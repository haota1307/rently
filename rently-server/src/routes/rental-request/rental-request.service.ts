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
import { NotificationService } from 'src/routes/notification/notification.service'

@Injectable()
export class RentalRequestService {
  constructor(
    private readonly rentalRequestRepo: RentalRequestRepo,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService
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
    try {
      // Kiểm tra xem đã có yêu cầu thuê nào đang PENDING hoặc APPROVED cho post này chưa
      const existingRequest = await this.rentalRequestRepo.findExistingRequest(
        data.postId,
        userId
      )

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
      const post = await this.rentalRequestRepo.checkRoomAvailability(
        data.postId
      )

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
      const landlord = await this.rentalRequestRepo.findUserById(
        rentalRequest.landlordId
      )
      const tenant = await this.rentalRequestRepo.findUserById(userId)
      const postInfo = await this.rentalRequestRepo.findPostById(data.postId)

      // Gửi email thông báo cho chủ nhà
      if (landlord && tenant && postInfo) {
        try {
          await this.emailService.sendRentalRequest({
            email: landlord.email,
            landlordName: landlord.name,
            tenantName: tenant.name,
            postTitle: postInfo.title,
            startDate: new Date(data.expectedMoveDate).toLocaleDateString(
              'vi-VN'
            ),
            duration: data.duration,
            note: data.note,
          })
        } catch (error) {
          console.error('Failed to send email notification:', error)
        }
      }

      // Gửi thông báo cho chủ nhà
      if (tenant) {
        await this.notificationService.notifyRentalRequest(
          post.landlordId,
          tenant.name,
          rentalRequest.id
        )
      }

      return rentalRequest
    } catch (error) {
      throw error
    }
  }

  // Cập nhật yêu cầu thuê
  async update(
    id: number,
    data: UpdateRentalRequestBodyType,
    userId: number,
    roleName: string
  ) {
    try {
      // Kiểm tra xem yêu cầu thuê có tồn tại không
      const rentalRequest =
        await this.rentalRequestRepo.findRequestWithRelations(id)

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

      // Trường hợp chấp nhận yêu cầu thuê và có đặt cọc
      if (data.status === RentalRequestStatus.APPROVED && rentalRequest.post) {
        // Sử dụng trường deposit một cách an toàn
        // (có thể là deposit hoặc depositAmount tùy theo trường nào tồn tại)
        const depositAmount = Number(
          (rentalRequest.post as any).deposit ||
            (rentalRequest.post as any).depositAmount ||
            0
        )

        // Chỉ xử lý nếu có đặt cọc
        if (depositAmount > 0) {
          // Kiểm tra số dư người thuê
          if (
            rentalRequest.tenant &&
            rentalRequest.tenant.balance < depositAmount
          ) {
            throw new HttpException('Người thuê không đủ tiền để đặt cọc', 400)
          }

          // Xử lý giao dịch tiền đặt cọc
          if (
            rentalRequest.tenant &&
            rentalRequest.landlord &&
            rentalRequest.post
          ) {
            await this.rentalRequestRepo.processDepositTransaction(
              rentalRequest.tenant.id,
              rentalRequest.landlord.id,
              depositAmount,
              rentalRequest.post.title,
              rentalRequest.tenant.name
            )
          }
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
          await this.rentalRequestRepo.updateRoomAvailability(roomId, false)

          // Từ chối tất cả các yêu cầu thuê khác cho cùng một bài đăng
          await this.rentalRequestRepo.rejectAllPendingRequests(
            updatedRequest.postId,
            id,
            'Phòng đã được cho thuê bởi người khác'
          )
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
          await this.rentalRequestRepo.updateRoomAvailability(roomId, true)
        }
      }

      // Gửi thông báo email khi trạng thái thay đổi
      if (data.status) {
        const statusMessages = {
          [RentalRequestStatus.APPROVED]: 'đã được chấp thuận',
          [RentalRequestStatus.REJECTED]: 'đã bị từ chối',
          [RentalRequestStatus.CANCELED]: 'đã bị hủy',
        }

        const statusColors = {
          [RentalRequestStatus.APPROVED]: '#4caf50', // xanh lá
          [RentalRequestStatus.REJECTED]: '#f44336', // đỏ
          [RentalRequestStatus.CANCELED]: '#9e9e9e', // xám
        }

        const notificationTarget =
          data.status === RentalRequestStatus.CANCELED
            ? await this.rentalRequestRepo.findUserById(
                updatedRequest.landlordId
              )
            : await this.rentalRequestRepo.findUserById(updatedRequest.tenantId)

        const sender =
          data.status === RentalRequestStatus.CANCELED
            ? await this.rentalRequestRepo.findUserById(updatedRequest.tenantId)
            : await this.rentalRequestRepo.findUserById(
                updatedRequest.landlordId
              )

        const post = await this.rentalRequestRepo.findPostById(
          updatedRequest.postId
        )

        if (notificationTarget && sender && post) {
          try {
            await this.emailService.sendRentalStatusUpdate({
              email: notificationTarget.email,
              receiverName: notificationTarget.name,
              senderName: sender.name,
              postTitle: post.title,
              statusMessage: statusMessages[data.status],
              statusColor: statusColors[data.status],
              rejectionReason: data.rejectionReason,
            })
          } catch (error) {
            console.error('Failed to send email notification:', error)
          }
        }
      }

      // Nếu đang cập nhật trạng thái, gửi thông báo cho người thuê
      if (data.status && data.status !== rentalRequest.status) {
        await this.notificationService.notifyRentalRequestUpdate(
          updatedRequest.tenantId,
          data.status,
          updatedRequest.post?.room?.title || 'Phòng',
          id
        )
      }

      return updatedRequest
    } catch (error) {
      throw error
    }
  }
}
