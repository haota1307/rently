import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Prisma, ContactStatus } from '@prisma/client'

@Injectable()
export class ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo một contact mới
   */
  create(data: Prisma.ContactUncheckedCreateInput) {
    return this.prisma.contact.create({
      data,
    })
  }

  /**
   * Tìm tất cả contacts với phân trang và lọc
   */
  findAll(params: {
    skip?: number
    take?: number
    status?: ContactStatus
    search?: string
  }) {
    const { skip, take, status, search } = params

    return this.prisma.contact.findMany({
      where: {
        ...(status && { status }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        respondedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Đếm tổng số contacts thỏa mãn điều kiện lọc
   */
  count(params: { status?: ContactStatus; search?: string }) {
    const { status, search } = params

    return this.prisma.contact.count({
      where: {
        ...(status && { status }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    })
  }

  /**
   * Tìm contact theo ID
   */
  findById(id: number) {
    return this.prisma.contact.findUnique({
      where: { id },
      include: {
        respondedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Cập nhật contact
   */
  update(id: number, data: Prisma.ContactUncheckedUpdateInput) {
    return this.prisma.contact.update({
      where: { id },
      data,
      include: {
        respondedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }
}
