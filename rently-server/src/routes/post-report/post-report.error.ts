import { BadRequestException, NotFoundException } from '@nestjs/common'

export const PostReportNotFoundException = new NotFoundException(
  'Báo cáo không tồn tại'
)

export const PostNotFoundException = new NotFoundException(
  'Bài đăng không tồn tại'
)

export const AlreadyReportedException = new BadRequestException(
  'Bạn đã báo cáo bài đăng này rồi'
)

export const OwnPostReportException = new BadRequestException(
  'Bạn không thể báo cáo bài đăng của chính mình'
)

export const ReportProcessedException = new BadRequestException(
  'Báo cáo này đã được xử lý'
)
