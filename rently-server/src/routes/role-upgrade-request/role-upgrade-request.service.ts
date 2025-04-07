import { Injectable } from '@nestjs/common'
import { RoleUpgradeRequestRepo } from './role-upgrade-request.repo'
import {
  CreateRoleUpgradeRequestBodyType,
  GetRoleUpgradeRequestParamsType,
  GetRoleUpgradeRequestsQueryType,
  UpdateRoleUpgradeRequestBodyType,
} from './role-upgrade-request.dto'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class RoleUpgradeRequestService {
  constructor(
    private readonly roleUpgradeRequestRepo: RoleUpgradeRequestRepo,
    private readonly prismaService: PrismaService
  ) {}

  async list(query: GetRoleUpgradeRequestsQueryType) {
    return this.roleUpgradeRequestRepo.list(query)
  }

  async findById(id: number) {
    return this.roleUpgradeRequestRepo.findById(id)
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

    return this.roleUpgradeRequestRepo.create({ data: { ...data, userId } })
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

    return result
  }
}
