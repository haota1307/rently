import { Module } from '@nestjs/common'
import { PostController } from 'src/routes/post/post.controller'
import { PostRepo } from 'src/routes/post/post.repo'
import { PostService } from 'src/routes/post/post.service'

@Module({
  controllers: [PostController],
  providers: [PostService, PostRepo],
})
export class PostModule {}
