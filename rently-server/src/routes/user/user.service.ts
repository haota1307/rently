import { ForbiddenException, Injectable } from '@nestjs/common'
import { UserRepo } from 'src/routes/user/user.repo'
import {
  CreateUserBodyType,
  GetUsersQueryType,
  UpdateUserBodyType,
} from 'src/routes/user/user.model'
import { NotFoundRecordException } from 'src/shared/error'
import {
  isForeignKeyConstraintPrismaError,
  isNotFoundPrismaError,
  isUniqueConstraintPrismaError,
} from 'src/shared/helpers'
import {
  CannotUpdateOrDeleteYourselfException,
  RoleNotFoundException,
  UserAlreadyExistsException,
} from 'src/routes/user/user.error'
import { RoleName } from 'src/shared/constants/role.constant'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { HashingService } from 'src/shared/services/hashing.service'
import { SharedRoleRepository } from 'src/shared/repositories/shared-role.repo'
import { EventsGateway } from 'src/events/events.gateway'
import { UserStatus } from 'src/shared/constants/auth.constant'

@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepo,
    private hashingService: HashingService,
    private sharedUserRepository: SharedUserRepository,
    private sharedRoleRepository: SharedRoleRepository,
    private eventsGateway: EventsGateway
  ) {}

  list(pagination: GetUsersQueryType) {
    return this.userRepo.list(pagination)
  }

  async findById(id: number) {
    const user =
      await this.sharedUserRepository.findUniqueIncludeRolePermissions({
        id,
        deletedAt: null,
      })
    if (!user) {
      throw NotFoundRecordException
    }
    return user
  }

  async create({
    data,
    createdById,
    createdByRoleName,
  }: {
    data: CreateUserBodyType
    createdById: number
    createdByRoleName: string
  }) {
    try {
      // Chỉ có admin agent mới có quyền tạo user với role là admin
      await this.verifyRole({
        roleNameAgent: createdByRoleName,
        roleIdTarget: data.roleId,
      })
      // Hash the password
      const hashedPassword = await this.hashingService.hash(data.password)

      const user = await this.userRepo.create({
        createdById,
        data: {
          ...data,
          password: hashedPassword,
        },
      })
      return user
    } catch (error) {
      if (isForeignKeyConstraintPrismaError(error)) {
        throw RoleNotFoundException
      }

      if (isUniqueConstraintPrismaError(error)) {
        throw UserAlreadyExistsException
      }
      throw error
    }
  }

  /**
   * Function này kiểm tra xem người thực hiện có quyền tác động đến người khác không.
   * Vì chỉ có người thực hiện là admin role mới có quyền sau: Tạo admin user, update roleId thành admin, xóa admin user.
   * Còn nếu không phải admin thì không được phép tác động đến admin
   */
  private async verifyRole({ roleNameAgent, roleIdTarget }) {
    // Agent là admin thì cho phép
    if (roleNameAgent === RoleName.Admin) {
      return true
    } else {
      // Agent không phải admin thì roleIdTarget phải khác admin
      const adminRoleId = await this.sharedRoleRepository.getAdminRoleId()
      if (roleIdTarget === adminRoleId) {
        throw new ForbiddenException()
      }
      return true
    }
  }

  async update({
    id,
    data,
    updatedById,
    updatedByRoleName,
  }: {
    id: number
    data: UpdateUserBodyType
    updatedById: number
    updatedByRoleName: string
  }) {
    try {
      // Không thể cập nhật chính mình
      this.verifyYourself({
        userAgentId: updatedById,
        userTargetId: id,
        roleNameAgent: updatedByRoleName,
      })

      // Lấy roleId ban đầu của người được update để kiểm tra xem liệu người update có quyền update không
      // Không dùng data.roleId vì dữ liệu này có thể bị cố tình truyền sai
      const roleIdTarget = await this.getRoleIdByUserId(id)
      await this.verifyRole({
        roleNameAgent: updatedByRoleName,
        roleIdTarget,
      })

      const updatedUser = await this.sharedUserRepository.update(
        { id, deletedAt: null },
        {
          ...data,
        }
      )
      return updatedUser
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw UserAlreadyExistsException
      }
      if (isForeignKeyConstraintPrismaError(error)) {
        throw RoleNotFoundException
      }
      throw error
    }
  }

  private async getRoleIdByUserId(userId: number) {
    const currentUser = await this.sharedUserRepository.findUnique({
      id: userId,
      deletedAt: null,
    })
    if (!currentUser) {
      throw NotFoundRecordException
    }
    return currentUser.roleId
  }

  private verifyYourself({
    userAgentId,
    userTargetId,
    roleNameAgent,
  }: {
    userAgentId: number
    userTargetId: number
    roleNameAgent: string
  }) {
    // Admin được phép cập nhật thông tin của chính mình
    if (roleNameAgent === RoleName.Admin) {
      return true
    }

    // Các vai trò khác không được phép cập nhật chính mình
    if (userAgentId === userTargetId) {
      throw CannotUpdateOrDeleteYourselfException
    }
  }

  async delete({
    id,
    deletedById,
    deletedByRoleName,
  }: {
    id: number
    deletedById: number
    deletedByRoleName: string
  }) {
    try {
      // Không thể xóa chính mình (trừ khi là admin)
      this.verifyYourself({
        userAgentId: deletedById,
        userTargetId: id,
        roleNameAgent: deletedByRoleName,
      })

      const roleIdTarget = await this.getRoleIdByUserId(id)
      await this.verifyRole({
        roleNameAgent: deletedByRoleName,
        roleIdTarget,
      })

      await this.userRepo.delete({
        id,
        deletedById,
      })
      return {
        message: 'Delete successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }

  async blockUser({
    id,
    updatedById,
    updatedByRoleName,
    reason,
  }: {
    id: number
    updatedById: number
    updatedByRoleName: string
    reason?: string
  }) {
    try {
      // Không thể khóa chính mình (trừ khi là admin)
      this.verifyYourself({
        userAgentId: updatedById,
        userTargetId: id,
        roleNameAgent: updatedByRoleName,
      })

      const roleIdTarget = await this.getRoleIdByUserId(id)
      await this.verifyRole({
        roleNameAgent: updatedByRoleName,
        roleIdTarget,
      })

      // Cập nhật trạng thái thành BLOCKED
      const blockedUser = await this.sharedUserRepository.update(
        { id, deletedAt: null },
        {
          status: UserStatus.BLOCKED,
          updatedById,
          updatedAt: new Date(),
        }
      )

      // Gửi thông báo qua socket tới người dùng bị khóa
      console.log(
        `[DEBUG] Gửi thông báo khóa tài khoản cho user ${id}, reason: ${reason || 'không có lý do'}`
      )
      const notified = this.eventsGateway.notifyUserBlocked(id, reason)
      console.log(
        `[DEBUG] Kết quả gửi thông báo: ${notified ? 'Thành công' : 'Không có socket kết nối'}`
      )

      return {
        message: 'Block user successfully',
        userId: id,
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }

  async unblockUser({
    id,
    updatedById,
    updatedByRoleName,
  }: {
    id: number
    updatedById: number
    updatedByRoleName: string
  }) {
    try {
      // Chỉ admin mới có thể mở khóa tài khoản
      if (updatedByRoleName !== RoleName.Admin) {
        throw new ForbiddenException('Chỉ admin mới có thể mở khóa tài khoản')
      }

      // Lấy thông tin user hiện tại
      const user = await this.sharedUserRepository.findUnique({
        id,
        deletedAt: null,
      })

      if (!user) {
        throw NotFoundRecordException
      }

      // Kiểm tra xem user có đang bị khóa không
      if (user.status !== UserStatus.BLOCKED) {
        return {
          message: 'User is not blocked',
          userId: id,
        }
      }

      // Cập nhật trạng thái thành ACTIVE
      await this.sharedUserRepository.update(
        { id, deletedAt: null },
        {
          status: UserStatus.ACTIVE,
          updatedById,
          updatedAt: new Date(),
        }
      )

      // Có thể thêm thông báo qua socket nếu cần

      return {
        message: 'Unblock user successfully',
        userId: id,
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
}
