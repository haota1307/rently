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
      let transactionDateCondition: any = {
        // Chỉ lấy giao dịch hoàn thành:
        // 1. Có Payment relation với status COMPLETED
        // 2. Hoặc không có Payment relation nhưng có amount > 0 (giao dịch tự động của hệ thống)
        OR: [
          {
            payment: {
              status: 'COMPLETED',
            },
          },
          {
            payment: null,
            OR: [{ amountIn: { gt: 0 } }, { amountOut: { gt: 0 } }],
          },
        ],
      }

      // Thêm điều kiện lọc theo người dùng nếu có
      if (landlordId) {
        transactionDateCondition.userId = landlordId
      }

      // Log tham số để debug
      console.log('getRevenueData params:', {
        days,
        landlordId,
        transaction_content,
        startDate,
        endDate,
      })

      // Lọc theo loại giao dịch (nếu có)
      if (transaction_content) {
        if (transaction_content === 'ALL') {
          // Không lọc theo nội dung giao dịch, lấy tất cả
          console.log('Using ALL mode - no content filter applied')
        } else if (transaction_content === 'SEVQR NAP') {
          transactionDateCondition.transactionContent = { contains: 'NAP' }
        } else {
          const contents = transaction_content.split('|')
          transactionDateCondition.OR = contents.map(content => ({
            transactionContent: { contains: content },
          }))
          console.log('🔍 Using content filter:', contents)
        }
      } else {
        // Mặc định tìm theo giao dịch nạp và rút
        transactionDateCondition.OR = [
          { transactionContent: { contains: 'NAP' } },
          { transactionContent: { contains: 'RUT' } },
        ]
        console.log('🔍 Using default NAP|RUT filter')
      }

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

      // Luôn sử dụng thời gian hiện tại thay vì dựa vào giao dịch cũ
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

      // Tạo điều kiện where cơ bản
      const whereCondition: any = {
        transactionDate: {
          gte: start,
          lte: end,
        },
        // Chỉ lấy giao dịch hoàn thành
        OR: [
          {
            payment: {
              status: 'COMPLETED',
            },
          },
          {
            payment: null,
            OR: [{ amountIn: { gt: 0 } }, { amountOut: { gt: 0 } }],
          },
        ],
        ...transactionDateCondition,
      }

      // Xóa OR từ transactionDateCondition để tránh conflict
      if (transactionDateCondition.OR) {
        delete transactionDateCondition.OR
      }

      // Kiểm tra xem có dữ liệu trong khoảng thời gian này không
      const dataCount = await this.prismaService.paymentTransaction.count({
        where: whereCondition,
      })

      console.log('📈 getRevenueData query result:', {
        dataCount,
        whereCondition: JSON.stringify(whereCondition, null, 2),
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
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
          if (transaction_content === 'ALL') {
            // Với ALL, phân loại theo nội dung giao dịch và giá trị amount
            depositCondition =
              '("amountIn" > 0 AND ("transactionContent" ILIKE \'%NAP%\' OR "transactionContent" ILIKE \'%tiền đặt%\' OR "transactionContent" ILIKE \'%nhận tiền%\' OR "transactionContent" ILIKE \'%thanh toán từ%\'))'
            withdrawCondition =
              '("amountOut" > 0 AND ("transactionContent" ILIKE \'%RUT%\' OR "transactionContent" ILIKE \'%phí%\'))'

            // Log điều kiện SQL để debug
            console.log('ALL mode SQL conditions:', {
              depositCondition,
              withdrawCondition,
            })
          } else {
            const contents = transaction_content.split('|')
            if (contents.length > 1) {
              depositCondition = `"transactionContent" ILIKE '%${contents[0]}%'`
              withdrawCondition = `"transactionContent" ILIKE '%${contents[1]}%'`
            } else {
              depositCondition = `"transactionContent" ILIKE '%${transaction_content}%'`
              withdrawCondition = `"transactionContent" ILIKE '%${transaction_content}%'`
            }
          }
        }

        // Tạo câu truy vấn SQL trực tiếp để tăng tốc độ và nhóm dữ liệu
        const whereClause: string[] = []
        const params: any[] = [start, end]

        // Thêm điều kiện lọc theo người dùng nếu có
        if (landlordId) {
          whereClause.push(`pt."userId" = $3`)
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
              DATE_TRUNC('${resolution}', pt."transactionDate") as period,
              SUM(CASE WHEN ${depositCondition} OR pt."transactionContent" LIKE '%Nạp tiền%' THEN pt."amountIn" ELSE 0 END) as deposit,
              SUM(CASE WHEN ${withdrawCondition} OR pt."transactionContent" LIKE '%Rút tiền%' THEN pt."amountOut" ELSE 0 END) as withdraw
            FROM "PaymentTransaction" pt
            LEFT JOIN "Payment" p ON pt.id = p."transactionId"
            WHERE pt."transactionDate" >= $1 AND pt."transactionDate" <= $2
            AND (
              (p."status" = 'COMPLETED') OR 
              (p.id IS NULL AND (pt."amountIn" > 0 OR pt."amountOut" > 0))
            )
            ${whereConditionSql}
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

      console.log('📊 Final getRevenueData results:', {
        results,
        totalDeposit: results.reduce((sum, r) => sum + (r.nạp || 0), 0),
        totalWithdraw: results.reduce((sum, r) => sum + (r.rút || 0), 0),
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
    // Điều kiện where cơ bản
    const whereCondition: any = {
      transactionDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      // Chỉ lấy giao dịch hoàn thành
      OR: [
        {
          payment: {
            status: 'COMPLETED',
          },
        },
        {
          payment: null,
          OR: [{ amountIn: { gt: 0 } }, { amountOut: { gt: 0 } }],
        },
      ],
      ...(landlordId ? { userId: landlordId } : {}),
    }

    // Xử lý đặc biệt cho transaction_content = 'ALL'
    if (transaction_content && transaction_content === 'ALL') {
      // Đối với ALL, cần thực hiện 2 query riêng biệt để phân loại đúng
      // 1. Query cho tiền vào (nạp tiền, tiền đặt cọc, nhận thanh toán)
      const depositQuery =
        await this.prismaService.paymentTransaction.aggregate({
          _sum: {
            amountIn: true,
          },
          where: {
            transactionDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            ...(landlordId ? { userId: landlordId } : {}),
            amountIn: { gt: 0 },
            // Combine payment status filter and content filter
            AND: [
              // Chỉ lấy giao dịch hoàn thành
              {
                OR: [
                  {
                    payment: {
                      status: 'COMPLETED',
                    },
                  },
                  {
                    payment: null,
                  },
                ],
              },
              // Content filter
              {
                OR: [
                  { transactionContent: { contains: 'NAP' } },
                  { transactionContent: { contains: 'tiền đặt' } },
                  { transactionContent: { contains: 'nhận tiền' } },
                  { transactionContent: { contains: 'thanh toán từ' } },
                ],
              },
            ],
          },
        })

      // 2. Query cho tiền ra (rút tiền, các loại phí)
      const withdrawQuery =
        await this.prismaService.paymentTransaction.aggregate({
          _sum: {
            amountOut: true,
          },
          where: {
            transactionDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            ...(landlordId ? { userId: landlordId } : {}),
            amountOut: { gt: 0 },
            // Combine payment status filter and content filter
            AND: [
              // Chỉ lấy giao dịch hoàn thành
              {
                OR: [
                  {
                    payment: {
                      status: 'COMPLETED',
                    },
                  },
                  {
                    payment: null,
                  },
                ],
              },
              // Content filter
              {
                OR: [
                  { transactionContent: { contains: 'RUT' } },
                  { transactionContent: { contains: 'phí' } },
                ],
              },
            ],
          },
        })

      // Tổng hợp kết quả với null safety
      const totalDeposit = depositQuery._sum?.amountIn || 0
      const totalWithdraw = withdrawQuery._sum?.amountOut || 0

      // Log kết quả để debug
      console.log(`Day ${dateStr} results (ALL mode):`, {
        deposit: totalDeposit,
        withdraw: totalWithdraw,
        query: {
          depositConditions: ['NAP', 'tiền đặt', 'nhận tiền', 'thanh toán từ'],
          withdrawConditions: ['RUT', 'phí'],
        },
      })

      return {
        name: displayDate,
        nạp: totalDeposit,
        rút: totalWithdraw,
        date: dateStr,
      }
    } else if (transaction_content) {
      // Lọc theo nội dung giao dịch cụ thể
      if (transaction_content === 'SEVQR NAP') {
        whereCondition.AND = [
          // Giữ nguyên payment status filter
          {
            OR: [
              {
                payment: {
                  status: 'COMPLETED',
                },
              },
              {
                payment: null,
                OR: [{ amountIn: { gt: 0 } }, { amountOut: { gt: 0 } }],
              },
            ],
          },
          // Thêm content filter
          {
            transactionContent: { contains: 'NAP' },
          },
        ]
        // Xóa OR cũ để tránh conflict
        delete whereCondition.OR
      } else {
        const contents = transaction_content.split('|')
        whereCondition.AND = [
          // Giữ nguyên payment status filter
          {
            OR: [
              {
                payment: {
                  status: 'COMPLETED',
                },
              },
              {
                payment: null,
                OR: [{ amountIn: { gt: 0 } }, { amountOut: { gt: 0 } }],
              },
            ],
          },
          // Thêm content filter
          {
            OR: contents.map(content => ({
              transactionContent: { contains: content },
            })),
          },
        ]
        // Xóa OR cũ để tránh conflict
        delete whereCondition.OR
      }
    } else {
      // Mặc định tìm theo giao dịch nạp và rút
      whereCondition.AND = [
        // Giữ nguyên payment status filter
        {
          OR: [
            {
              payment: {
                status: 'COMPLETED',
              },
            },
            {
              payment: null,
              OR: [{ amountIn: { gt: 0 } }, { amountOut: { gt: 0 } }],
            },
          ],
        },
        // Thêm content filter
        {
          OR: [
            { transactionContent: { contains: 'NAP' } },
            { transactionContent: { contains: 'RUT' } },
          ],
        },
      ]
      // Xóa OR cũ để tránh conflict
      delete whereCondition.OR
    }

    // Sử dụng cách cũ cho các trường hợp khác
    const aggregateResult =
      await this.prismaService.paymentTransaction.aggregate({
        _sum: {
          amountIn: true,
          amountOut: true,
        },
        where: whereCondition,
      })

    // Tổng hợp số tiền nạp và rút với null safety
    const totalDeposit = aggregateResult._sum?.amountIn || 0
    const totalWithdraw = aggregateResult._sum?.amountOut || 0

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

  async getLandlordTransactionData(
    days: number = 7,
    landlordId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<RevenueDataType[]> {
    try {
      // Xác định khoảng thời gian
      let start: Date
      let end: Date

      if (startDate && endDate) {
        start = new Date(startDate)
        end = new Date(endDate)
        // Đảm bảo end là cuối ngày
        end.setHours(23, 59, 59, 999)
      } else {
        end = new Date()
        start = new Date()
        start.setDate(end.getDate() - days + 1)
        start.setHours(0, 0, 0, 0)
      }

      // Sử dụng SQL trực tiếp để tối ưu hiệu suất và xử lý phức tạp hơn
      const sql = `
        WITH date_series AS (
          SELECT generate_series(
            $1::timestamp,
            $2::timestamp,
            INTERVAL '1 day'
          ) AS date_point
        ),
        -- Tiền đặt cọc (nhận từ người thuê)
        deposit_data AS (
          SELECT
            DATE_TRUNC('day', "transactionDate") as period,
            SUM("amountIn") as deposit_amount
          FROM "PaymentTransaction"
          WHERE "transactionDate" >= $1 AND "transactionDate" <= $2
          ${landlordId ? 'AND "userId" = $3' : ''}
          AND ("transactionContent" LIKE '%Nhận tiền đặt cọc%' OR "transactionContent" LIKE '%Đặt cọc%')
          AND "amountIn" > 0
          GROUP BY period
        ),
        -- Phí đăng bài
        post_fee_data AS (
          SELECT
            DATE_TRUNC('day', "transactionDate") as period,
            SUM("amountOut") as fee_amount
          FROM "PaymentTransaction"
          WHERE "transactionDate" >= $1 AND "transactionDate" <= $2
          ${landlordId ? 'AND "userId" = $3' : ''}
          AND (
            "transactionContent" LIKE '%phí đăng%' OR
            "transactionContent" LIKE '%phi dang%' OR
            "transactionContent" LIKE '%FEE%' OR
            "code" LIKE '%FEE%'
          )
          GROUP BY period
        ),
        -- Hoàn cọc (trả lại cho người thuê)
        refund_data AS (
          SELECT
            DATE_TRUNC('day', "transactionDate") as period,
            SUM("amountOut") as refund_amount
          FROM "PaymentTransaction"
          WHERE "transactionDate" >= $1 AND "transactionDate" <= $2
          ${landlordId ? 'AND "userId" = $3' : ''}
          AND ("transactionContent" LIKE '%Hoàn tiền đặt cọc%' OR "transactionContent" LIKE '%Hoàn cọc%')
          GROUP BY period
        ),
        -- Phí đăng ký gói subscription
        subscription_fee_data AS (
          SELECT
            DATE_TRUNC('day', "transactionDate") as period,
            SUM("amountOut") as subscription_fee_amount
          FROM "PaymentTransaction"
          WHERE "transactionDate" >= $1 AND "transactionDate" <= $2
          ${landlordId ? 'AND "userId" = $3' : ''}
          AND (
            "transactionContent" LIKE '%subscription%' OR
            "transactionContent" LIKE '%gói dịch vụ%' OR
            "transactionContent" LIKE '%Gia hạn subscription%' OR
            "transactionContent" LIKE '%Tự động gia hạn subscription%' OR
            "transactionContent" LIKE '%nâng cấp gói%' OR
            "transactionContent" LIKE '%đăng ký gói%'
          )
          GROUP BY period
        )
        SELECT
          ds.date_point as period,
          TO_CHAR(ds.date_point, 'DD/MM') as display_date,
          COALESCE(dd.deposit_amount, 0) as deposit_amount,
          COALESCE(pf.fee_amount, 0) as fee_amount,
          COALESCE(rd.refund_amount, 0) as refund_amount,
          COALESCE(sf.subscription_fee_amount, 0) as subscription_fee_amount,
          TO_CHAR(ds.date_point, 'YYYY-MM-DD') as date_str
        FROM date_series ds
        LEFT JOIN deposit_data dd ON DATE_TRUNC('day', ds.date_point) = dd.period
        LEFT JOIN post_fee_data pf ON DATE_TRUNC('day', ds.date_point) = pf.period
        LEFT JOIN refund_data rd ON DATE_TRUNC('day', ds.date_point) = rd.period
        LEFT JOIN subscription_fee_data sf ON DATE_TRUNC('day', ds.date_point) = sf.period
        ORDER BY ds.date_point ASC
      `

      const params: any[] = [start, end]
      if (landlordId) {
        params.push(landlordId)
      }

      const result = await this.prismaService.$queryRawUnsafe(sql, ...params)

      // Chuyển đổi kết quả thành định dạng phản hồi
      return (result as any[]).map(row => ({
        name: row.display_date,
        'đặt cọc': parseInt(row.deposit_amount) || 0,
        'phí đăng bài': parseInt(row.fee_amount) || 0,
        'hoàn cọc': parseInt(row.refund_amount) || 0,
        'phí gói dịch vụ': parseInt(row.subscription_fee_amount) || 0,
        date: row.date_str,
      }))
    } catch (error) {
      console.error('Error in getLandlordTransactionData:', error)
      throw new InternalServerErrorException(error.message)
    }
  }

  async debugTransactions(
    days: number = 7,
    landlordId?: number,
    transaction_content?: string
  ) {
    try {
      const end = new Date()
      const start = subDays(end, days - 1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      // Lấy tất cả transactions trong 7 ngày qua
      const whereCondition: any = {
        transactionDate: {
          gte: start,
          lte: end,
        },
      }

      if (landlordId) {
        whereCondition.userId = landlordId
      }

      if (transaction_content && transaction_content !== 'ALL') {
        if (transaction_content === 'SEVQR NAP') {
          whereCondition.transactionContent = { contains: 'NAP' }
        } else {
          const contents = transaction_content.split('|')
          whereCondition.OR = contents.map(content => ({
            transactionContent: { contains: content },
          }))
        }
      }

      const transactions = await this.prismaService.paymentTransaction.findMany(
        {
          where: whereCondition,
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            payment: {
              select: { status: true, amount: true },
            },
          },
          orderBy: {
            transactionDate: 'desc',
          },
        }
      )

      // Tính tổng
      const summary = {
        totalTransactions: transactions.length,
        totalAmountIn: transactions.reduce(
          (sum, t) => sum + (t.amountIn || 0),
          0
        ),
        totalAmountOut: transactions.reduce(
          (sum, t) => sum + (t.amountOut || 0),
          0
        ),
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        filterApplied: {
          days,
          landlordId,
          transaction_content,
        },
      }

      return {
        summary,
        transactions: transactions.map(t => ({
          id: t.id,
          transactionDate: t.transactionDate,
          transactionContent: t.transactionContent,
          amountIn: t.amountIn,
          amountOut: t.amountOut,
          gateway: t.gateway,
          code: t.code,
          user: t.user,
          payment: t.payment,
        })),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
