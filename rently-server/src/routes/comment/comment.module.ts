import { Module } from '@nestjs/common'
import { CommentController } from './comment.controller'
import { CommentService } from './comment.service'
import { CommentRepo } from './comment.repo'
import { NotificationModule } from 'src/routes/notification/notification.module'
import { PrismaService } from 'src/shared/services/prisma.service'

@Module({
  controllers: [CommentController],
  providers: [CommentService, CommentRepo, PrismaService],
  imports: [NotificationModule],
})
export class CommentModule {}
