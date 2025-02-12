import { ConflictException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RegisterResDTO, UserDTO } from 'src/routes/auth/auth.dto';

import { isUniqueConstraintPrismaError } from 'src/shared/helpers';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { TokenService } from 'src/shared/services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
  ) {}
  async generateTokens(payload: { userId: number; role: Role }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(payload),
      this.tokenService.signRefreshToken(payload),
    ]);

    const decodedRefreshToken =
      await this.tokenService.verifyRefreshToken(refreshToken);

    await this.prismaService.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.userId,
        createdAt: new Date(),
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
      },
    });
    return { accessToken, refreshToken };
  }

  async register(body: any) {
    try {
      const hashedPassword = await this.hashingService.hash(body.password);

      const user = await this.prismaService.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
          balance: new Decimal(0), // Prisma Decimal
          role: 'USER',
        },
      });

      const tokens = await this.generateTokens({
        userId: user.id,
        role: user.role,
      });

      // Chuyển đổi `balance` từ Decimal -> number
      const response = new RegisterResDTO({
        user: new UserDTO({
          ...user,
          balance: user.balance.toNumber(), // Chuyển đổi
        }),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });

      return response;
    } catch (error) {
      console.log({ error });
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Tài khoản đã tồn tại');
      }
      throw error;
    }
  }
}
