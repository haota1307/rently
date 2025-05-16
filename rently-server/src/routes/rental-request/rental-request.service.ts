import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  HttpException,
  Logger,
  InternalServerErrorException,
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
  private readonly logger = new Logger(RentalRequestService.name)

  constructor(
    private readonly rentalRequestRepo: RentalRequestRepo,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
    private readonly prismaService: PrismaService
  ) {}

  // Lấy danh sách yêu cầu thuê
  async list(query: GetRentalRequestsQueryType, userId: number, role: string) {
    this.logger.log(
      `Getting rental requests list for user ${userId} with role ${query.role || role}`
    )
    return this.rentalRequestRepo.list(query, userId, query.role)
  }

  // Lấy chi tiết yêu cầu thuê
  async findById(id: number, userId: number, roleName: string) {
    this.logger.log(
      `Getting rental request detail for id ${id} by user ${userId}`
    )

    const rentalRequest = await this.rentalRequestRepo.findById(id)

    if (!rentalRequest) {
      this.logger.warn(`Rental request with id ${id} not found`)
      throw new NotFoundException('Yêu cầu thuê không tồn tại')
    }

    // Kiểm tra quyền truy cập: chỉ admin, tenant hoặc landlord của yêu cầu này mới có quyền xem
    if (
      roleName !== RoleName.Admin &&
      rentalRequest.tenantId !== userId &&
      rentalRequest.landlordId !== userId
    ) {
      this.logger.warn(
        `User ${userId} tried to access rental request ${id} without permission`
      )
      throw new ForbiddenException(
        'Bạn không có quyền xem thông tin yêu cầu thuê này'
      )
    }

    return rentalRequest
  }

  // Tạo yêu cầu thuê mới
  async create(data: CreateRentalRequestBodyType, userId: number) {
    this.logger.log(
      `Creating rental request for post ${data.postId} by user ${userId}`
    )

    try {
      // Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
      return await this.prismaService.$transaction(
        async prismaTransaction => {
          // Kiểm tra xem người dùng có phải là chủ bài đăng không
          const post = await this.rentalRequestRepo.checkRoomAvailability(
            data.postId
          )

          if (!post) {
            throw new NotFoundException('Không tìm thấy bài đăng này')
          }

          if (post.landlordId === userId) {
            throw new BadRequestException(
              'Bạn không thể thuê bài đăng của chính mình'
            )
          }

          // Kiểm tra xem đã có yêu cầu thuê nào đang PENDING hoặc APPROVED cho post này chưa
          const existingRequest =
            await this.rentalRequestRepo.findExistingRequest(
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

          // Kiểm tra xem phòng có sẵn sàng cho thuê hay không với FOR UPDATE để lock
          const roomAvailability =
            await this.rentalRequestRepo.checkRoomAvailabilityWithLock(
              data.postId,
              prismaTransaction
            )

          if (!roomAvailability || !roomAvailability.isAvailable) {
            throw new BadRequestException(
              'Phòng này hiện không có sẵn để cho thuê'
            )
          }

          // Tạo yêu cầu mới
          const rentalRequest = await this.rentalRequestRepo.create({
            data,
            tenantId: userId,
            prismaTransaction,
          })

          // Sử dụng Promise.allSettled để thực hiện các tác vụ không quan trọng mà không làm gián đoạn luồng chính
          Promise.allSettled([
            // Gửi thông báo và email (không ảnh hưởng đến kết quả giao dịch)
            this.sendNotifications(rentalRequest, userId, data),
          ]).catch(error => {
            this.logger.error(
              'Error in notification processes after rental request creation',
              error
            )
          })

          return rentalRequest
        },
        {
          // Đặt mức độ cô lập cao hơn để tránh race condition
          isolationLevel: 'Serializable',
        }
      )
    } catch (error) {
      // Log lỗi chi tiết
      this.logger.error(
        `Error creating rental request: ${error.message}`,
        error.stack
      )

      // Trả về lỗi phù hợp cho client
      if (error instanceof HttpException) {
        throw error
      }
      throw new InternalServerErrorException(
        'Có lỗi xảy ra khi tạo yêu cầu thuê. Vui lòng thử lại sau.'
      )
    }
  }

  // Phương thức gửi thông báo và email
  private async sendNotifications(
    rentalRequest: RentalRequestDetailType,
    userId: number,
    data: CreateRentalRequestBodyType
  ) {
    try {
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
          this.logger.error('Failed to send email notification:', error)
        }
      }

      // Gửi thông báo cho chủ nhà
      if (tenant) {
        await this.notificationService.notifyRentalRequest(
          rentalRequest.landlordId,
          tenant.name,
          rentalRequest.id
        )
      }
    } catch (error) {
      this.logger.error('Error sending notifications', error)
    }
  }

  // Cập nhật yêu cầu thuê
  async update(
    id: number,
    data: UpdateRentalRequestBodyType,
    userId: number,
    roleName: string
  ) {
    this.logger.log(
      `Updating rental request ${id} by user ${userId} with data: ${JSON.stringify(data)}`
    )

    try {
      // Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
      return await this.prismaService.$transaction(
        async prismaTransaction => {
          // Kiểm tra xem yêu cầu thuê có tồn tại không - sử dụng FOR UPDATE để lock
          const rentalRequest =
            await this.rentalRequestRepo.findRequestWithRelationsForUpdate(
              id,
              prismaTransaction
            )

          if (!rentalRequest) {
            throw new NotFoundException('Không tìm thấy yêu cầu thuê')
          }

          // Kiểm tra quyền cập nhật yêu cầu thuê
          this.validatePermissions(rentalRequest, userId, roleName, data)

          // Kiểm tra trạng thái hiện tại
          this.validateCurrentStatus(rentalRequest, data)

          // Nếu là trạng thái APPROVED, xử lý tiền đặt cọc
          if (data.status === RentalRequestStatus.APPROVED) {
            await this.handleDepositForApproval(
              rentalRequest,
              prismaTransaction
            )
          }

          // Cập nhật yêu cầu
          const updatedRequest = await this.rentalRequestRepo.update({
            id,
            data,
            prismaTransaction,
          })

          // Xử lý trạng thái phòng và các yêu cầu khác khi chấp thuận
          if (data.status === RentalRequestStatus.APPROVED) {
            await this.handleApprovalSideEffects(
              updatedRequest,
              id,
              prismaTransaction
            )
          }

          // Xử lý khi yêu cầu được chấp thuận trước đó và bây giờ bị từ chối hoặc hủy
          if (
            (data.status === RentalRequestStatus.CANCELED ||
              data.status === RentalRequestStatus.REJECTED) &&
            rentalRequest.status === RentalRequestStatus.APPROVED
          ) {
            await this.handleCancellationAfterApproval(
              rentalRequest,
              updatedRequest,
              prismaTransaction
            )
          }

          // Xử lý thông báo và email sau khi transaction hoàn tất
          Promise.allSettled([
            this.sendStatusUpdateNotifications(
              data,
              rentalRequest,
              updatedRequest
            ),
          ]).catch(error => {
            this.logger.error(
              'Error in notification processes after status update',
              error
            )
          })

          return updatedRequest
        },
        {
          // Đặt mức độ cô lập cao hơn để tránh race condition
          isolationLevel: 'Serializable',
        }
      )
    } catch (error) {
      // Log lỗi chi tiết
      this.logger.error(
        `Error updating rental request: ${error.message}`,
        error.stack
      )

      // Trả về lỗi phù hợp cho client
      if (error instanceof HttpException) {
        throw error
      }
      throw new InternalServerErrorException(
        'Có lỗi xảy ra khi cập nhật yêu cầu thuê. Vui lòng thử lại sau.'
      )
    }
  }

  // Xác thực quyền hạn
  private validatePermissions(
    rentalRequest: any,
    userId: number,
    roleName: string,
    data: UpdateRentalRequestBodyType
  ) {
    // Kiểm tra quyền cập nhật yêu cầu thuê
    const isTenant = rentalRequest.tenantId === userId
    const isLandlord = rentalRequest.landlordId === userId
    const isAdmin = roleName === RoleName.Admin

    if (!isAdmin && !isTenant && !isLandlord) {
      this.logger.warn(
        `User ${userId} tried to update rental request without permission`
      )
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật yêu cầu thuê này'
      )
    }

    // Kiểm tra quyền thay đổi trạng thái
    if (data.status) {
      // Tenant chỉ có thể hủy yêu cầu
      if (
        isTenant &&
        !isAdmin &&
        data.status !== RentalRequestStatus.CANCELED
      ) {
        throw new ForbiddenException('Người thuê chỉ có thể hủy yêu cầu thuê')
      }

      // Landlord có thể chấp nhận hoặc từ chối yêu cầu
      if (
        isLandlord &&
        !isAdmin &&
        data.status !== RentalRequestStatus.APPROVED &&
        data.status !== RentalRequestStatus.REJECTED
      ) {
        throw new ForbiddenException(
          'Chủ nhà chỉ có thể chấp thuận hoặc từ chối yêu cầu thuê'
        )
      }
    }
  }

  // Xác thực trạng thái hiện tại
  private validateCurrentStatus(
    rentalRequest: any,
    data: UpdateRentalRequestBodyType
  ) {
    // Không cho phép thay đổi trạng thái đã kết thúc
    if (
      data.status &&
      (rentalRequest.status === RentalRequestStatus.CANCELED ||
        rentalRequest.status === RentalRequestStatus.REJECTED)
    ) {
      throw new BadRequestException(
        'Không thể thay đổi trạng thái của yêu cầu đã bị hủy hoặc từ chối'
      )
    }
  }

  // Xử lý tiền đặt cọc khi chấp thuận
  private async handleDepositForApproval(
    rentalRequest: any,
    prismaTransaction: any
  ) {
    if (!rentalRequest.post) return

    // Sử dụng trường deposit một cách an toàn
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
        throw new BadRequestException('Người thuê không đủ tiền để đặt cọc')
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
          rentalRequest.tenant.name,
          prismaTransaction
        )
      }
    }
  }

  // Xử lý các tác động phụ khi chấp thuận yêu cầu
  private async handleApprovalSideEffects(
    updatedRequest: RentalRequestDetailType,
    requestId: number,
    prismaTransaction: any
  ) {
    const roomId = updatedRequest.post?.room?.id

    if (roomId) {
      // Cập nhật trạng thái phòng thành đã cho thuê (isAvailable = false)
      await this.rentalRequestRepo.updateRoomAvailability(
        roomId,
        false,
        prismaTransaction
      )

      // Từ chối tất cả các yêu cầu thuê khác cho cùng một bài đăng
      await this.rentalRequestRepo.rejectAllPendingRequests(
        updatedRequest.postId,
        requestId,
        'Phòng đã được cho thuê bởi người khác',
        prismaTransaction
      )
    }
  }

  // Xử lý khi yêu cầu được chấp thuận sau đó bị hủy/từ chối
  private async handleCancellationAfterApproval(
    originalRequest: any,
    updatedRequest: RentalRequestDetailType,
    prismaTransaction: any
  ) {
    const roomId = originalRequest.post?.roomId

    if (roomId) {
      // Cập nhật trạng thái phòng thành còn trống (isAvailable = true)
      await this.rentalRequestRepo.updateRoomAvailability(
        roomId,
        true,
        prismaTransaction
      )
    }

    // Nếu có tiền đặt cọc, hoàn lại tiền
    const depositAmount = Number(
      (originalRequest.post as any).deposit ||
        (originalRequest.post as any).depositAmount ||
        0
    )

    if (depositAmount > 0) {
      // Hoàn lại tiền cọc
      await this.rentalRequestRepo.refundDeposit(
        originalRequest.tenantId,
        originalRequest.landlordId,
        depositAmount,
        originalRequest.post.title,
        originalRequest.tenant.name,
        prismaTransaction
      )
    }
  }

  // Gửi thông báo khi cập nhật trạng thái
  private async sendStatusUpdateNotifications(
    data: UpdateRentalRequestBodyType,
    rentalRequest: any,
    updatedRequest: RentalRequestDetailType
  ) {
    if (!data.status || data.status === rentalRequest.status) return

    try {
      const statusMessages = {
        [RentalRequestStatus.APPROVED]: 'đã được chấp thuận',
        [RentalRequestStatus.REJECTED]: 'đã bị từ chối',
        [RentalRequestStatus.CANCELED]: 'đã bị hủy',
      }

      const statusColors = {
        [RentalRequestStatus.APPROVED]: '#4caf50',
        [RentalRequestStatus.REJECTED]: '#f44336',
        [RentalRequestStatus.CANCELED]: '#9e9e9e',
      }

      const notificationTarget =
        data.status === RentalRequestStatus.CANCELED
          ? await this.rentalRequestRepo.findUserById(updatedRequest.landlordId)
          : await this.rentalRequestRepo.findUserById(updatedRequest.tenantId)

      const sender =
        data.status === RentalRequestStatus.CANCELED
          ? await this.rentalRequestRepo.findUserById(updatedRequest.tenantId)
          : await this.rentalRequestRepo.findUserById(updatedRequest.landlordId)

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
          this.logger.error('Failed to send email notification:', error)
        }
      }

      // Gửi thông báo trong ứng dụng
      await this.notificationService.notifyRentalRequestUpdate(
        updatedRequest.tenantId,
        data.status,
        updatedRequest.post?.room?.title || 'Phòng',
        updatedRequest.id
      )
    } catch (error) {
      this.logger.error('Error sending status update notifications', error)
    }
  }
}
