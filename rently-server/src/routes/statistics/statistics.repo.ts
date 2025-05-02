import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  StatisticsOverviewType,
  RevenueDataType,
  RoomDistributionType,
  AreaPostCountType,
  PopularAreaType,
} from 'src/shared/models/shared-statistics.model'
import { format, subDays } from 'date-fns'
import { vi } from 'date-fns/locale'

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

  /**
   * Lấy dữ liệu doanh thu theo ngày
   */
  async getRevenueData(
    days: number = 7,
    landlordId?: number
  ): Promise<RevenueDataType[]> {
    try {
      const result: RevenueDataType[] = []
      const now = new Date()

      // Tạo mảng ngày từ hiện tại trở về trước
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(now, i)
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const dateStr = format(date, 'yyyy-MM-dd')
        const displayDate = format(date, 'dd/MM', { locale: vi })

        // Query giao dịch trong ngày từ database
        const transactions =
          await this.prismaService.paymentTransaction.findMany({
            where: {
              transactionDate: {
                gte: startOfDay,
                lte: endOfDay,
              },
              ...(landlordId ? { userId: landlordId } : {}),
            },
          })

        // Tổng hợp số tiền nạp và rút trong ngày
        let totalDeposit = 0
        let totalWithdraw = 0

        transactions.forEach(transaction => {
          // Tiền nạp vào (amountIn)
          if (transaction.amountIn > 0) {
            totalDeposit += transaction.amountIn
          }

          // Tiền rút ra (amountOut)
          if (transaction.amountOut > 0) {
            totalWithdraw += transaction.amountOut
          }
        })

        result.push({
          name: displayDate,
          nạp: totalDeposit,
          rút: totalWithdraw,
          date: dateStr,
        })
      }

      return result
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  /**
   * Lấy dữ liệu phân phối phòng trọ (đã thuê/còn trống)
   */
  async getRoomDistribution(
    landlordId?: number
  ): Promise<RoomDistributionType[]> {
    try {
      // Điều kiện lọc phòng theo landlord (nếu có)
      const whereCondition = landlordId ? { rental: { landlordId } } : {}

      // Lấy số phòng còn trống
      const availableRooms = await this.prismaService.room.count({
        where: {
          ...whereCondition,
          isAvailable: true,
        },
      })

      // Lấy số phòng đã thuê
      const rentedRooms = await this.prismaService.room.count({
        where: {
          ...whereCondition,
          isAvailable: false,
        },
      })

      return [
        { name: 'Đã thuê', value: rentedRooms, color: '#10b981' },
        { name: 'Còn trống', value: availableRooms, color: '#6366f1' },
      ]
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  /**
   * Lấy số lượng bài đăng theo khu vực
   */
  async getPostsByArea(
    limit: number = 5,
    landlordId?: number
  ): Promise<AreaPostCountType[]> {
    try {
      // Lấy danh sách bài đăng theo khu vực từ database
      const posts = await this.prismaService.rentalPost.findMany({
        where: landlordId ? { landlordId } : {},
        select: {
          rental: {
            select: {
              address: true,
            },
          },
        },
      })

      // Phân tích địa chỉ để lấy phường
      const areaMap = new Map<string, number>()

      posts.forEach(post => {
        if (!post.rental?.address) return

        // Tách địa chỉ để lấy phường
        const address = post.rental.address

        // Tìm phường trong địa chỉ
        let ward = ''

        // Tìm theo "Phường "
        const wardIndex = address.indexOf('Phường ')
        if (wardIndex !== -1) {
          const startIdx = wardIndex + 'Phường '.length
          const nextComma = address.indexOf(',', startIdx)
          if (nextComma !== -1) {
            ward = 'Phường ' + address.substring(startIdx, nextComma).trim()
          } else {
            ward = 'Phường ' + address.substring(startIdx).trim()
          }
        }
        // Tìm theo "P. "
        else {
          const pIndex = address.indexOf('P. ')
          if (pIndex !== -1) {
            const startIdx = pIndex + 'P. '.length
            const nextComma = address.indexOf(',', startIdx)
            if (nextComma !== -1) {
              ward = 'P. ' + address.substring(startIdx, nextComma).trim()
            } else {
              ward = 'P. ' + address.substring(startIdx).trim()
            }
          }
        }

        // Nếu không tìm thấy phường, sử dụng phần trước dấu phẩy đầu tiên
        if (!ward) {
          const commaIndex = address.indexOf(',')
          if (commaIndex > 0) {
            ward = address.substring(0, commaIndex).trim()
          } else {
            ward = 'Khu vực khác'
          }
        }

        // Tăng số lượng bài đăng cho khu vực này
        areaMap.set(ward, (areaMap.get(ward) || 0) + 1)
      })

      // Chuyển đổi Map thành mảng và sắp xếp theo số lượng giảm dần
      const result = Array.from(areaMap.entries())
        .map(([name, posts]) => ({ name, posts }))
        .sort((a, b) => b.posts - a.posts)
        .slice(0, limit)

      return result
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  /**
   * Lấy danh sách khu vực phổ biến
   */
  async getPopularAreas(
    limit: number = 5,
    userId?: number
  ): Promise<PopularAreaType[]> {
    try {
      // Lấy dữ liệu từ database và thống kê theo khu vực
      const whereCondition = userId ? { landlordId: userId } : {}

      // Lấy danh sách bài đăng từ database
      const posts = await this.prismaService.rentalPost.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          rental: {
            select: {
              address: true,
            },
          },
        },
      })

      // Phân tích địa chỉ để lấy phường và đếm số lượng
      const areaMap = new Map<string, number>()
      const trendMap = new Map<string, string>() // Lưu xu hướng tăng trưởng

      posts.forEach(post => {
        if (!post.rental?.address) return

        // Tách địa chỉ để lấy phường
        const address = post.rental.address

        // Tìm phường trong địa chỉ
        let ward = ''

        // Tìm theo "Phường "
        const wardIndex = address.indexOf('Phường ')
        if (wardIndex !== -1) {
          const startIdx = wardIndex + 'Phường '.length
          const nextComma = address.indexOf(',', startIdx)
          if (nextComma !== -1) {
            ward = 'Phường ' + address.substring(startIdx, nextComma).trim()
          } else {
            ward = 'Phường ' + address.substring(startIdx).trim()
          }
        }
        // Tìm theo "P. "
        else {
          const pIndex = address.indexOf('P. ')
          if (pIndex !== -1) {
            const startIdx = pIndex + 'P. '.length
            const nextComma = address.indexOf(',', startIdx)
            if (nextComma !== -1) {
              ward = 'P. ' + address.substring(startIdx, nextComma).trim()
            } else {
              ward = 'P. ' + address.substring(startIdx).trim()
            }
          }
        }

        // Nếu không tìm thấy phường, sử dụng phần trước dấu phẩy đầu tiên
        if (!ward) {
          const commaIndex = address.indexOf(',')
          if (commaIndex > 0) {
            ward = address.substring(0, commaIndex).trim()
          } else {
            ward = 'Khu vực khác'
          }
        }

        // Tăng số lượng bài đăng cho khu vực này
        areaMap.set(ward, (areaMap.get(ward) || 0) + 1)
      })

      // Tính xu hướng tăng trưởng (demo với dữ liệu ngẫu nhiên)
      // Trong thực tế, cần so sánh với dữ liệu tháng trước
      areaMap.forEach((count, area) => {
        const growth = Math.floor(Math.random() * 20) - 5 // -5% đến +15%
        const prefix = growth >= 0 ? '+' : ''
        trendMap.set(area, `${prefix}${growth}%`)
      })

      // Chuyển đổi Map thành mảng kết quả và sắp xếp theo số lượng giảm dần
      const result = Array.from(areaMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          trend: trendMap.get(name) || '+0%',
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

      return result
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
