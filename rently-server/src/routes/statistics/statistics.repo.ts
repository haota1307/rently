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
    landlordId?: number,
    transaction_content?: string,
    startDate?: string,
    endDate?: string
  ): Promise<RevenueDataType[]> {
    try {
      // Đầu tiên, lấy giao dịch mới nhất và cũ nhất để biết phạm vi dữ liệu thực tế
      let transactionDateCondition: any = {}

      // Thêm điều kiện lọc theo người dùng nếu có
      if (landlordId) {
        transactionDateCondition.userId = landlordId
      }

      // Lọc theo loại giao dịch (nếu có)
      if (transaction_content) {
        if (transaction_content === 'SEVQR NAP') {
          transactionDateCondition.transactionContent = { contains: 'NAP' }
        } else {
          const contents = transaction_content.split('|')
          transactionDateCondition.OR = contents.map(content => ({
            transactionContent: { contains: content },
          }))
        }
      } else {
        // Mặc định tìm theo giao dịch nạp và rút
        transactionDateCondition.OR = [
          { transactionContent: { contains: 'NAP' } },
          { transactionContent: { contains: 'RUT' } },
        ]
      }

      const latestTransaction =
        await this.prismaService.paymentTransaction.findFirst({
          where: transactionDateCondition,
          orderBy: {
            transactionDate: 'desc',
          },
          select: {
            transactionDate: true,
          },
        })

      const earliestTransaction =
        await this.prismaService.paymentTransaction.findFirst({
          where: transactionDateCondition,
          orderBy: {
            transactionDate: 'asc',
          },
          select: {
            transactionDate: true,
          },
        })

      // Xác định resolution dựa trên số ngày
      let resolution = 'day'
      if (days > 60) {
        resolution = 'week'
      } else if (days > 180) {
        resolution = 'month'
      }

      // Xác định khoảng thời gian ban đầu
      let start: Date
      let end: Date

      // Ưu tiên sử dụng dữ liệu thực tế nếu có
      if (latestTransaction) {
        // Sử dụng ngày của giao dịch mới nhất làm mốc
        end = new Date(latestTransaction.transactionDate)
        // Đảm bảo end là cuối ngày để bao gồm toàn bộ ngày kết thúc
        end.setHours(23, 59, 59, 999)

        // Tính ngày bắt đầu dựa trên số ngày yêu cầu
        start = new Date(end)
        start.setDate(end.getDate() - days + 1)
        start.setHours(0, 0, 0, 0)

        // Nếu có giao dịch cũ nhất và nó nằm trong khoảng, mở rộng khoảng thời gian
        if (earliestTransaction) {
          const earliestDate = new Date(earliestTransaction.transactionDate)
          if (earliestDate < start) {
            // Mở rộng khoảng thời gian để bao gồm giao dịch cũ nhất
            start = new Date(earliestDate)
            start.setHours(0, 0, 0, 0)

            // Đảm bảo khoảng thời gian không vượt quá số ngày yêu cầu
            const actualDays =
              Math.ceil(
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
              ) + 1
            if (actualDays > days) {
              // Nếu vượt quá, điều chỉnh lại resolution
              if (actualDays > 60) {
                resolution = 'week'
              }
              if (actualDays > 180) {
                resolution = 'month'
              }
            }
          }
        }
      } else {
        // Nếu không có dữ liệu, sử dụng thời gian hiện tại
        if (startDate && endDate) {
          start = new Date(startDate)
          end = new Date(endDate)
          // Đảm bảo end là cuối ngày
          end.setHours(23, 59, 59, 999)
        } else {
          end = new Date()
          start = subDays(end, days - 1)
          start.setHours(0, 0, 0, 0)
        }
      }

      // Tạo điều kiện where cơ bản
      const whereCondition: any = {
        transactionDate: {
          gte: start,
          lte: end,
        },
        ...transactionDateCondition,
      }

      delete whereCondition.OR // Tránh trùng lặp OR

      // Kiểm tra xem có dữ liệu trong khoảng thời gian này không
      const dataCount = await this.prismaService.paymentTransaction.count({
        where: whereCondition,
      })

      // Với khoảng thời gian lớn, sử dụng SQL trực tiếp để tối ưu
      if (
        days > 30 ||
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) > 30
      ) {
        // Xác định interval string đúng cú pháp PostgreSQL
        let intervalString: string
        switch (resolution) {
          case 'week':
            intervalString = "INTERVAL '1 week'"
            break
          case 'month':
            intervalString = "INTERVAL '1 month'"
            break
          default:
            intervalString = "INTERVAL '1 day'"
            break
        }

        // Xử lý điều kiện lọc nội dung giao dịch cho nạp và rút
        let depositCondition = '"transactionContent" ILIKE \'%NAP%\''
        let withdrawCondition = '"transactionContent" ILIKE \'%RUT%\''
        if (transaction_content) {
          const contents = transaction_content.split('|')
          if (contents.length > 1) {
            depositCondition = `"transactionContent" ILIKE '%${contents[0]}%'`
            withdrawCondition = `"transactionContent" ILIKE '%${contents[1]}%'`
          } else {
            depositCondition = `"transactionContent" ILIKE '%${transaction_content}%'`
            withdrawCondition = `"transactionContent" ILIKE '%${transaction_content}%'`
          }
        }

        // Tạo câu truy vấn SQL trực tiếp để tăng tốc độ và nhóm dữ liệu
        const whereClause: string[] = []
        const params: any[] = [start, end]

        // Thêm điều kiện lọc theo người dùng nếu có
        if (landlordId) {
          whereClause.push(`"userId" = $3`)
          params.push(landlordId)
        }

        const whereConditionSql =
          whereClause.length > 0 ? `AND ${whereClause.join(' AND ')}` : ''

        const sql = `
          WITH date_series AS (
            SELECT generate_series(
              $1::timestamp,
              $2::timestamp,
              ${intervalString}
            ) AS date_point
          ),
          aggregated_data AS (
            SELECT
              DATE_TRUNC('${resolution}', "transactionDate") as period,
              SUM(CASE WHEN ${depositCondition} OR "transactionContent" LIKE '%Nạp tiền%' THEN "amountIn" ELSE 0 END) as deposit,
              SUM(CASE WHEN ${withdrawCondition} OR "transactionContent" LIKE '%Rút tiền%' THEN "amountOut" ELSE 0 END) as withdraw
            FROM "PaymentTransaction"
            WHERE "transactionDate" >= $1 AND "transactionDate" <= $2
            ${landlordId ? 'AND "userId" = $3' : ''}
            GROUP BY period
            ORDER BY period
          )
          SELECT
            ds.date_point as period,
            TO_CHAR(ds.date_point, 'DD/MM') as display_date,
            COALESCE(ad.deposit, 0) as deposit,
            COALESCE(ad.withdraw, 0) as withdraw,
            TO_CHAR(ds.date_point, 'YYYY-MM-DD') as date_str
          FROM date_series ds
          LEFT JOIN aggregated_data ad ON DATE_TRUNC('${resolution}', ds.date_point) = ad.period
          ORDER BY ds.date_point ASC
        `

        const result = await this.prismaService.$queryRawUnsafe(sql, ...params)

        // Chuyển đổi kết quả thành định dạng phản hồi
        return (result as any[]).map(row => ({
          name: row.display_date,
          nạp: parseInt(row.deposit) || 0,
          rút: parseInt(row.withdraw) || 0,
          date: row.date_str,
        }))
      }

      // Nếu không có dữ liệu trong khoảng hoặc với số ngày nhỏ, sử dụng phương pháp tạo mảng ngày
      const result: RevenueDataType[] = []

      // Tạo mảng ngày từ start đến end
      const datePromises: Promise<RevenueDataType>[] = []
      for (let i = 0; i < days; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)

        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const dateStr = format(date, 'yyyy-MM-dd')
        const displayDate = format(date, 'dd/MM', { locale: vi })

        // Tạo promise cho mỗi ngày để xử lý song song
        datePromises.push(
          this.getRevenueForDate(
            startOfDay,
            endOfDay,
            displayDate,
            dateStr,
            landlordId,
            transaction_content
          )
        )
      }

      // Chờ tất cả promises hoàn thành
      const results = await Promise.all(datePromises)

      // Log kết quả để kiểm tra
      console.log('Date range:', {
        start: start.toISOString(),
        end: end.toISOString(),
        dataCount,
        resolution,
        resultsCount: results.length,
      })

      return results
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  /**
   * Helper function để xử lý dữ liệu doanh thu cho một ngày cụ thể
   */
  private async getRevenueForDate(
    startOfDay: Date,
    endOfDay: Date,
    displayDate: string,
    dateStr: string,
    landlordId?: number,
    transaction_content?: string
  ): Promise<RevenueDataType> {
    // Query giao dịch trong ngày từ database
    const whereCondition: any = {
      transactionDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    }

    // Thêm điều kiện lọc theo người dùng nếu có
    if (landlordId) {
      whereCondition.userId = landlordId
    }

    // Tối ưu truy vấn nội dung giao dịch
    if (transaction_content) {
      // Ưu tiên exact match trước khi sử dụng contains để tận dụng index
      if (transaction_content === 'SEVQR NAP') {
        whereCondition.transactionContent = { contains: 'NAP' }
      } else {
        const contents = transaction_content.split('|')
        whereCondition.OR = contents.map(content => ({
          transactionContent: { contains: content },
        }))
      }
    } else {
      // Mặc định tìm theo giao dịch nạp và rút
      whereCondition.OR = [
        { transactionContent: { contains: 'NAP' } },
        { transactionContent: { contains: 'RUT' } },
      ]
    }

    // Thực hiện aggregation query thay vì lấy tất cả records
    const aggregateResult =
      await this.prismaService.paymentTransaction.aggregate({
        _sum: {
          amountIn: true,
          amountOut: true,
        },
        where: whereCondition,
      })

    // Tổng hợp số tiền nạp và rút
    const totalDeposit = aggregateResult._sum.amountIn || 0
    const totalWithdraw = aggregateResult._sum.amountOut || 0

    return {
      name: displayDate,
      nạp: totalDeposit,
      rút: totalWithdraw,
      date: dateStr,
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
