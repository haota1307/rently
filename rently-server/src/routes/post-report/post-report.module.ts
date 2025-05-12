import { Module } from '@nestjs/common'
import { PostReportController } from 'src/routes/post-report/post-report.controller'
import { PostReportRepository } from 'src/routes/post-report/post-report.repo'
import { PostReportService } from 'src/routes/post-report/post-report.service'

@Module({
  controllers: [PostReportController],
  providers: [PostReportService, PostReportRepository],
  exports: [PostReportService],
})
export class PostReportModule {}
