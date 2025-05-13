import { Injectable } from '@nestjs/common'
import { RoleUpgradeRequestRepo } from './role-upgrade-request.repo'
import {
  CreateRoleUpgradeRequestBodyType,
  GetRoleUpgradeRequestParamsType,
  GetRoleUpgradeRequestsQueryType,
  UpdateRoleUpgradeRequestBodyType,
} from './role-upgrade-request.dto'
import { PrismaService } from 'src/shared/services/prisma.service'
import { EventsGateway } from 'src/events/events.gateway'

@Injectable()
export class RoleUpgradeRequestService {
  constructor(
    private readonly roleUpgradeRequestRepo: RoleUpgradeRequestRepo,
    private readonly prismaService: PrismaService,
    private readonly eventsGateway: EventsGateway
  ) {}

  async list(query: GetRoleUpgradeRequestsQueryType) {
    return this.roleUpgradeRequestRepo.list(query)
  }

  async findById(id: number) {
    return this.roleUpgradeRequestRepo.findById(id)
  }

  async findLatestByUserId(userId: number) {
    return this.roleUpgradeRequestRepo.findLatestByUserId(userId)
  }

  async create({
    data,
    userId,
  }: {
    data: CreateRoleUpgradeRequestBodyType
    userId: number
  }) {
    // Kiểm tra xem user đã có request đang chờ xử lý chưa
    const pendingRequest =
      await this.prismaService.roleUpgradeRequest.findFirst({
        where: {
          userId: userId,
          status: 'PENDING',
        },
      })

    if (pendingRequest) {
      throw new Error('Bạn đã có yêu cầu đang chờ xử lý')
    }

    // Tạo yêu cầu nâng cấp tài khoản
    const result = await this.roleUpgradeRequestRepo.create({
      data: { ...data, userId },
    })

    // Lấy thông tin chi tiết về người dùng để thông báo cho admin
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phoneNumber: true },
    })

    // Gửi thông báo cho admin
    if (result && user) {
      this.eventsGateway.notifyAdmins('newRoleUpgradeRequest', {
        id: result.id,
        userId: userId,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phoneNumber,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
        message: 'Có yêu cầu nâng cấp tài khoản mới',
      })
    }

    return result
  }

  async update({
    id,
    data,
    processedById,
  }: {
    id: number
    data: UpdateRoleUpgradeRequestBodyType
    processedById: number
  }) {
    const request = await this.roleUpgradeRequestRepo.findById(Number(id))
    if (!request) {
      throw new Error('Không tìm thấy yêu cầu')
    }

    if (request.status !== 'PENDING') {
      throw new Error('Yêu cầu đã được xử lý')
    }

    const result = await this.roleUpgradeRequestRepo.update({
      id: Number(id),
      data,
      processedById,
    })

    // Nếu được chấp nhận, cập nhật role của user
    if (data.status === 'APPROVED') {
      await this.prismaService.user.update({
        where: { id: request.userId },
        data: {
          roleId: 2,
        },
      })
    }

    // Gửi thông báo qua socket
    this.eventsGateway.notifyRoleUpdated(request.userId, data.status, data.note)

    // Trả về message theo định dạng MessageResDTO
    return {
      message:
        data.status === 'APPROVED'
          ? 'Yêu cầu đã được phê duyệt thành công'
          : 'Yêu cầu đã bị từ chối',
    }
  }
}
