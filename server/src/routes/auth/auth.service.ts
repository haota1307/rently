import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/routes/auth/auth.dto';
import { PrismaService } from 'src/routes/shared/services/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signUp(dto: CreateUserDto) {
    // 1. Kiểm tra xem email đã tồn tại chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Tạo user mới
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        balance: 0, // Ví dụ set balance mặc định = 0
      },
    });

    // 4. Tạo refresh token
    const refreshToken = this._signRefreshToken(user.id);

    // 5. Lưu refresh token vào bảng RefreshToken
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: this._getRefreshTokenExpiryDate(),
        createdAt: new Date(),
        userId: user.id,
      },
    });

    // 6. Chuẩn bị dữ liệu trả về
    // (Không trả password, chỉ trả thông tin cơ bản)
    const { password, ...userData } = user;

    return {
      user: userData, // thông tin user
      refreshToken: refreshToken, // chuỗi refresh token
    };
  }

  /**
   * Hàm ký (sign) ra chuỗi refresh token bằng JWT
   */
  private _signRefreshToken(userId: number): string {
    const payload = { sub: userId }; // Tùy ý thêm thông tin
    // SECRET_REFRESH_KEY nên lấy từ môi trường .env
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'REFRESH_SECRET',
      expiresIn: '7d', // ví dụ refresh token 7 ngày
    });
  }

  /**
   * Trả về thời điểm hết hạn (expiresAt) cho refresh token
   */
  private _getRefreshTokenExpiryDate(): Date {
    // Ví dụ 7 ngày kể từ hiện tại
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    return expires;
  }
}
