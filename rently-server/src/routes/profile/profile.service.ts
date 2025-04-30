import { Injectable } from '@nestjs/common'
import {
  InvalidPasswordException,
  NotFoundRecordException,
} from 'src/shared/error'
import {
  ChangePasswordBodyType,
  UpdateMeBodySchema,
  UpdateMeBodyType,
} from './profile.model'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { HashingService } from 'src/shared/services/hashing.service'
import { isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { SharedPaymentRepository } from 'src/shared/repositories/shared-payment.repo'

@Injectable()
export class ProfileService {
  constructor(
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly hashingService: HashingService,
    private readonly sharedPaymentRepository: SharedPaymentRepository
  ) {}

  async getProfile(userId: number) {
    const user =
      await this.sharedUserRepository.findUniqueIncludeRolePermissions({
        id: userId,
        deletedAt: null,
      })

    if (!user) {
      throw NotFoundRecordException
    }

    return user
  }

  async updateProfile({
    userId,
    body,
  }: {
    userId: number
    body: UpdateMeBodyType
  }) {
    try {
      return await this.sharedUserRepository.update(
        { id: userId, deletedAt: null },
        {
          ...body,
        }
      )
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }

  async changePassword({
    userId,
    body,
  }: {
    userId: number
    body: Omit<ChangePasswordBodyType, 'confirmNewPassword'>
  }) {
    try {
      const { password, newPassword } = body
      const user = await this.sharedUserRepository.findUnique({
        id: userId,
        deletedAt: null,
      })
      if (!user) {
        throw NotFoundRecordException
      }
      const isPasswordMatch = await this.hashingService.compare(
        password,
        user.password
      )
      if (!isPasswordMatch) {
        throw InvalidPasswordException
      }
      const hashedPassword = await this.hashingService.hash(newPassword)

      await this.sharedUserRepository.update(
        { id: userId, deletedAt: null },
        {
          password: hashedPassword,
        }
      )
      return {
        message: 'Password changed successfully',
      }
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }

  async getPaymentHistory(userId: number) {
    // Kiểm tra người dùng tồn tại
    const user = await this.sharedUserRepository.findUnique({
      id: userId,
      deletedAt: null,
    })

    if (!user) {
      throw NotFoundRecordException
    }

    // Lấy lịch sử thanh toán
    const payments =
      await this.sharedPaymentRepository.getUserPaymentHistory(userId)

    return {
      status: 200,
      payload: payments,
    }
  }
}
