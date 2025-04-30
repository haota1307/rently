import { Module } from '@nestjs/common'
import { PostController } from 'src/routes/post/post.controller'
import { PostRepo } from 'src/routes/post/post.repo'
import { PostService } from 'src/routes/post/post.service'
import { SharedModule } from 'src/shared/shared.module'

@Module({
  imports: [SharedModule],
  controllers: [PostController],
  providers: [PostService, PostRepo],
  exports: [PostService, PostRepo],
})
export class PostModule {}
