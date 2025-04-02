import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { StatisticsOverviewType } from 'src/shared/models/shared-statistics.model'

@Injectable()
export class StatisticsRepo {
  constructor(private prismaService: PrismaService) {}

  async getOverview(landlordId?: number): Promise<StatisticsOverviewType> {
    try {
      const whereRental = landlordId ? { landlordId } : {}
      const wherePost = landlordId ? { landlordId } : {}

      // Lấy dữ liệu hiện tại
      const [totalRentals, totalRooms, totalPosts, user] = await Promise.all([
        // Tổng số nhà trọ
        this.prismaService.rental.count({
          where: whereRental,
        }),
        // Tổng số phòng
        this.prismaService.room.count({
          where: {
            rental: whereRental,
          },
        }),
        // Tổng số bài đăng
        this.prismaService.rentalPost.count({
          where: wherePost,
        }),
        // Thông tin số dư tài khoản
        landlordId
          ? this.prismaService.user.findUnique({
              where: { id: landlordId },
              select: { balance: true },
            })
          : null,
      ])

      // Lấy dữ liệu tháng trước để tính phần trăm thay đổi
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      const [lastMonthRentals, lastMonthRooms, lastMonthPosts, lastMonthUser] =
        await Promise.all([
          this.prismaService.rental.count({
            where: {
              ...whereRental,
              createdAt: { lt: new Date() },
            },
          }),
          this.prismaService.room.count({
            where: {
              rental: whereRental,
              createdAt: { lt: new Date() },
            },
          }),
          this.prismaService.rentalPost.count({
            where: {
              ...wherePost,
              createdAt: { lt: new Date() },
            },
          }),
          landlordId
            ? this.prismaService.user.findFirst({
                where: {
                  id: landlordId,
                  updatedAt: { lt: new Date() },
                },
                select: { balance: true },
                orderBy: { updatedAt: 'desc' },
              })
            : null,
        ])

      // Tính phần trăm thay đổi
      const calculatePercentage = (current: number, last: number) => {
        if (last === 0) return current > 0 ? 100 : 0
        return ((current - last) / last) * 100
      }

      return {
        totalRentals,
        totalRooms,
        totalPosts,
        accountBalance: user?.balance || 0,
        percentageChanges: {
          rentals: calculatePercentage(totalRentals, lastMonthRentals),
          rooms: calculatePercentage(totalRooms, lastMonthRooms),
          posts: calculatePercentage(totalPosts, lastMonthPosts),
          balance: calculatePercentage(
            user?.balance || 0,
            lastMonthUser?.balance || 0
          ),
        },
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
