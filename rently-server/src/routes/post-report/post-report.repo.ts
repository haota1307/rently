import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PostReportFilterWithIncludeType } from './post-report.model'

@Injectable()
export class PostReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    reason: string
    description?: string
    postId: number
    reportedById: number
  }) {
    return this.prisma.postReport.create({
      data: {
        reason: data.reason,
        description: data.description,
        post: { connect: { id: data.postId } },
        reportedBy: { connect: { id: data.reportedById } },
        status: 'PENDING',
      },
    })
  }

  async findById(id: number) {
    return this.prisma.postReport.findUnique({
      where: { id },
    })
  }

  async findByIdWithIncludes(
    id: number,
    includes: {
      includePost?: boolean
      includeReportedBy?: boolean
      includeProcessedBy?: boolean
    }
  ) {
    return this.prisma.postReport.findUnique({
      where: { id },
      include: {
        post: includes.includePost || false,
        reportedBy: includes.includeReportedBy
          ? {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            }
          : false,
        processedBy: includes.includeProcessedBy
          ? {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            }
          : false,
      },
    })
  }

  async update(
    id: number,
    data: {
      status?: string
      processedById?: number
      processedAt?: Date
    }
  ) {
    const updateData: any = {
      status: data.status,
    }

    if (data.processedById) {
      updateData.processedBy = { connect: { id: data.processedById } }
    }

    if (data.processedAt) {
      updateData.processedAt = data.processedAt
    }

    return this.prisma.postReport.update({
      where: { id },
      data: updateData,
    })
  }

  async findAllWithFilters(filters: PostReportFilterWithIncludeType) {
    const {
      page,
      limit,
      status,
      postId,
      includePost,
      includeReportedBy,
      includeProcessedBy,
    } = filters
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (postId) {
      where.postId = postId
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.postReport.findMany({
        where,
        include: {
          post: includePost
            ? {
                select: {
                  id: true,
                  title: true,
                },
              }
            : false,
          reportedBy: includeReportedBy
            ? {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              }
            : false,
          processedBy: includeProcessedBy
            ? {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              }
            : false,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.postReport.count({ where }),
    ])

    const totalPages = Math.ceil(totalItems / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    }
  }

  async countByPostId(postId: number) {
    return this.prisma.postReport.count({
      where: { postId },
    })
  }
}
