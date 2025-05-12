import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { PostReportService } from './post-report.service'
import {
  CreatePostReportBodyDTO,
  PaginatedPostReportResDTO,
  PostReportFilterWithIncludeQueryDTO,
  PostReportResDTO,
  UpdatePostReportStatusBodyDTO,
} from './post-report.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('post-reports')
export class PostReportController {
  constructor(private readonly postReportService: PostReportService) {}

  @Post()
  @ZodSerializerDto(PostReportResDTO)
  async createReport(
    @ActiveUser('userId') userId: number,
    @Body() body: CreatePostReportBodyDTO
  ) {
    return this.postReportService.createReport(userId, body)
  }

  @Get()
  @ZodSerializerDto(PaginatedPostReportResDTO)
  async getReports(@Query() query: PostReportFilterWithIncludeQueryDTO) {
    return this.postReportService.getReports(query)
  }

  @Get(':id')
  @ZodSerializerDto(PostReportResDTO)
  async getReportById(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PostReportFilterWithIncludeQueryDTO
  ) {
    const { includePost, includeReportedBy, includeProcessedBy } = query
    return this.postReportService.getReportById(id, {
      includePost,
      includeReportedBy,
      includeProcessedBy,
    })
  }

  @Patch(':id/status')
  @ZodSerializerDto(MessageResDTO)
  async updateReportStatus(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
    @Body() body: UpdatePostReportStatusBodyDTO
  ) {
    await this.postReportService.updateReportStatus(id, userId, body)
    return {
      message: 'Cập nhật trạng thái báo cáo thành công',
    }
  }

  @Get('post/:postId/count')
  @ZodSerializerDto(MessageResDTO)
  async getReportCountByPostId(@Param('postId', ParseIntPipe) postId: number) {
    const count = await this.postReportService.getReportCountByPostId(postId)
    return {
      message: `Số lượng báo cáo của bài đăng: ${count}`,
    }
  }
}
