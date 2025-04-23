import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import {
  REQUEST_ROLE_PERMISSION_KEY,
  REQUEST_USER_KEY,
  UserStatus,
} from 'src/shared/constants/auth.constant'
import { HTTPMethod } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services/prisma.service'
import { TokenService } from 'src/shared/services/token.service'
import { AccessTokenPayload } from 'src/shared/types/jwt.type'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { UserBlockedException } from 'src/routes/auth/auth.error'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
    private readonly sharedUserRepository: SharedUserRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    // Extract và validate token
    const decodedAccessToken = await this.extractAndValidateToken(request)

    // Kiểm tra trạng thái user
    const user = await this.sharedUserRepository.findUnique({
      id: decodedAccessToken.userId,
    })

    if (!user) {
      throw new UnauthorizedException('User không tồn tại')
    }

    if (user.status === UserStatus.BLOCKED) {
      throw UserBlockedException
    }

    // Check user permission
    await this.validateUserPermission(decodedAccessToken, request)
    return true
  }

  private async extractAndValidateToken(
    request: any
  ): Promise<AccessTokenPayload> {
    const accessToken = this.extractAccessTokenFromHeader(request)
    try {
      const decodedAccessToken =
        await this.tokenService.verifyAccessToken(accessToken)

      request[REQUEST_USER_KEY] = decodedAccessToken
      return decodedAccessToken
    } catch {
      throw new UnauthorizedException('Error.InvalidAccessToken')
    }
  }

  private extractAccessTokenFromHeader(request: any): string {
    const accessToken = request.headers.authorization?.split(' ')[1]
    if (!accessToken) {
      throw new UnauthorizedException('Error.MissingAccessToken')
    }
    return accessToken
  }

  private async validateUserPermission(
    decodedAccessToken: AccessTokenPayload,
    request: any
  ): Promise<void> {
    const roleId: number = decodedAccessToken.roleId
    const path: string = request.route.path
    const method = request.method as keyof typeof HTTPMethod
    const role = await this.prismaService.role
      .findUniqueOrThrow({
        where: {
          id: roleId,
          deletedAt: null,
          isActive: true,
        },
        include: {
          permissions: {
            where: {
              deletedAt: null,
              path,
              method,
            },
          },
        },
      })
      .catch(() => {
        throw new ForbiddenException()
      })
    const canAccess = role.permissions.length > 0
    if (!canAccess) {
      throw new ForbiddenException()
    }
    request[REQUEST_ROLE_PERMISSION_KEY] = role
  }
}
