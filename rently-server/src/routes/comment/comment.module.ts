import { Module } from '@nestjs/common'
import { CommentController } from './comment.controller'
import { CommentService } from './comment.service'
import { CommentRepo } from './comment.repo'
import { SharedModule } from 'src/shared/shared.module'

@Module({
  imports: [SharedModule],
  controllers: [CommentController],
  providers: [CommentService, CommentRepo],
  exports: [CommentService],
})
export class CommentModule {}
