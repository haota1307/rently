import { Injectable } from '@nestjs/common'
import { PostReportRepository } from './post-report.repo'
import {
  CreatePostReportType,
  PostReportFilterWithIncludeType,
  ReportStatus,
  UpdatePostReportStatusType,
} from './post-report.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  AlreadyReportedException,
  OwnPostReportException,
  PostNotFoundException,
  PostReportNotFoundException,
  ReportProcessedException,
} from './post-report.error'

@Injectable()
export class PostReportService {
  constructor(
    private readonly postReportRepository: PostReportRepository,
    private readonly prisma: PrismaService
  ) {}

  async createReport(reportedById: number, data: CreatePostReportType) {
    // Kiểm tra bài đăng có tồn tại không
    const post = await this.prisma.rentalPost.findUnique({
      where: { id: data.postId },
      select: { id: true, landlordId: true },
    })

    if (!post) {
      throw PostNotFoundException
    }

    // Kiểm tra người dùng có báo cáo bài đăng của chính mình không
    if (post.landlordId === reportedById) {
      throw OwnPostReportException
    }

    // Kiểm tra người dùng đã báo cáo bài đăng này chưa
    const existingReport = await this.prisma.$queryRaw`
      SELECT id FROM "PostReport" 
      WHERE "postId" = ${data.postId} AND "reportedById" = ${reportedById}
      LIMIT 1
    `

    if (existingReport && (existingReport as any[]).length > 0) {
      throw AlreadyReportedException
    }

    // Tạo báo cáo mới
    return this.prisma.$executeRaw`
      INSERT INTO "PostReport" ("reason", "description", "postId", "reportedById", "status", "createdAt", "updatedAt")
      VALUES (${data.reason}, ${data.description}, ${data.postId}, ${reportedById}, 'PENDING', NOW(), NOW())
      RETURNING *
    `
  }

  async getReportById(
    id: number,
    includes: {
      includePost?: boolean
      includeReportedBy?: boolean
      includeProcessedBy?: boolean
    } = {}
  ) {
    // Sử dụng raw query để lấy báo cáo
    const report = await this.prisma.$queryRaw`
      SELECT * FROM "PostReport" WHERE id = ${id}
    `

    if (!report || (report as any[]).length === 0) {
      throw PostReportNotFoundException
    }

    const reportData = (report as any[])[0]

    // Thêm dữ liệu liên quan nếu cần
    if (includes.includePost && reportData.postId) {
      const post = await this.prisma.rentalPost.findUnique({
        where: { id: reportData.postId },
        select: { id: true, title: true },
      })
      reportData.post = post
    }

    if (includes.includeReportedBy && reportData.reportedById) {
      const reportedBy = await this.prisma.user.findUnique({
        where: { id: reportData.reportedById },
        select: { id: true, name: true, email: true, avatar: true },
      })
      reportData.reportedBy = reportedBy
    }

    if (includes.includeProcessedBy && reportData.processedById) {
      const processedBy = await this.prisma.user.findUnique({
        where: { id: reportData.processedById },
        select: { id: true, name: true, email: true, avatar: true },
      })
      reportData.processedBy = processedBy
    }

    return reportData
  }

  async getReports(filters: PostReportFilterWithIncludeType) {
    return this.postReportRepository.findAllWithFilters(filters)
  }

  async updateReportStatus(
    id: number,
    userId: number,
    data: UpdatePostReportStatusType
  ) {
    // Kiểm tra báo cáo tồn tại
    const report = await this.prisma.$queryRaw`
      SELECT * FROM "PostReport" WHERE id = ${id}
    `

    if (!report || (report as any[]).length === 0) {
      throw PostReportNotFoundException
    }

    const reportData = (report as any[])[0]

    if (reportData.status !== ReportStatus.PENDING) {
      throw ReportProcessedException
    }

    // Cập nhật trạng thái báo cáo - thêm cast ::ReportStatus để chuyển string sang enum
    return this.prisma.$executeRaw`
      UPDATE "PostReport"
      SET status = ${data.status}::ReportStatus, "processedById" = ${userId}, "processedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = ${id}
    `
  }

  async getReportCountByPostId(postId: number) {
    const result = await this.prisma.$queryRaw`
      SELECT COUNT(*) FROM "PostReport" WHERE "postId" = ${postId}
    `
    return parseInt((result as any[])[0].count as string, 10)
  }
}
