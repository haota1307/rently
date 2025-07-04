import { Injectable } from '@nestjs/common'
import {
  RefreshTokenType,
  VerificationCodeType,
} from 'src/routes/auth/auth.model'
import { TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant'
import { RoleType } from 'src/shared/models/shared-role.model'
import { UserType } from 'src/shared/models/shared-user.model'
import { WhereUniqueUserType } from 'src/shared/repositories/shared-user.repo'
import { PrismaService } from 'src/shared/services/prisma.service'
import { isNotFoundPrismaError } from 'src/shared/helpers'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(
    user: Pick<UserType, 'roleId' | 'email' | 'name' | 'password'>
  ): Promise<Omit<UserType, 'password'>> {
    return this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
      },
    })
  }

  async createUserIncludeRole(
    user: Pick<
      UserType,
      | 'roleId'
      | 'email'
      | 'name'
      | 'phoneNumber'
      | 'avatar'
      | 'password'
      | 'status'
    >
  ): Promise<UserType & { role: RoleType }> {
    return this.prismaService.user.create({
      data: user,
      include: {
        role: true,
      },
    })
  }

  async findUniqueVerificationCode(
    uniqueValue:
      | { email: string }
      | { id: number }
      | {
          email: string
          code: string
          type: TypeOfVerificationCodeType
        }
  ): Promise<VerificationCodeType | null> {
    return this.prismaService.verificationCode.findUnique({
      where: uniqueValue,
    })
  }

  async createVerificationCode(
    payload: Pick<VerificationCodeType, 'email' | 'type' | 'code' | 'expiresAt'>
  ): Promise<VerificationCodeType> {
    return this.prismaService.verificationCode.upsert({
      where: {
        email: payload.email,
      },
      create: payload,
      update: {
        code: payload.code,
        expiresAt: payload.expiresAt,
      },
    })
  }

  async findUniqueUserIncludeRole(
    where: WhereUniqueUserType
  ): Promise<(UserType & { role: RoleType }) | null> {
    return this.prismaService.user.findUnique({
      where,
      include: {
        role: true,
      },
    })
  }

  createRefreshToken(data: { token: string; userId: number; expiresAt: Date }) {
    return this.prismaService.refreshToken.create({
      data,
    })
  }

  async findUniqueRefeshTokenIncludeUserRole(where: { token: string }): Promise<
    | (RefreshTokenType & {
        user: UserType & { role: RoleType }
      })
    | null
  > {
    return this.prismaService.refreshToken.findUnique({
      where,
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  async deleteRefreshToken(where: {
    token: string
  }): Promise<RefreshTokenType | null> {
    try {
      return await this.prismaService.refreshToken.delete({
        where,
      })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        // Token không tồn tại, trả về null thay vì báo lỗi
        return null
      }
      throw error // Ném lại các lỗi khác
    }
  }

  deleteVerificationCode(
    uniqueValue:
      | { email: string }
      | { id: number }
      | { email: string; code: string; type: TypeOfVerificationCodeType }
  ): Promise<VerificationCodeType> {
    return this.prismaService.verificationCode.delete({
      where: uniqueValue,
    })
  }
}
