import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreatePostBodyDTO,
  GetPostDetailResDTO,
  GetPostParamsDTO,
  GetPostsQueryDTO,
  GetPostsResDTO,
  UpdatePostBodyDTO,
} from 'src/routes/post/post.dto'
import { PostService } from 'src/routes/post/post.service'

import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('posts')
export class PostController {
  constructor(private readonly rentalPostService: PostService) {}

  @Get()
  @ZodSerializerDto(GetPostsResDTO)
  list(@Query() query: GetPostsQueryDTO) {
    return this.rentalPostService.list(query)
  }

  @Get('my')
  @ZodSerializerDto(GetPostsResDTO)
  listByUserId(
    @Query() query: GetPostsQueryDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.rentalPostService.listByUserId(query, userId)
  }

  @Get(':rentalPostId')
  @ZodSerializerDto(GetPostDetailResDTO)
  findById(@Param() params: GetPostParamsDTO) {
    return this.rentalPostService.findById(params.rentalPostId)
  }

  @Post()
  @ZodSerializerDto(GetPostDetailResDTO)
  create(
    @Body() body: CreatePostBodyDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.rentalPostService.create({
      data: body,
      landlordId: userId,
    })
  }

  @Put(':rentalPostId')
  @ZodSerializerDto(GetPostDetailResDTO)
  update(
    @Body() body: UpdatePostBodyDTO,
    @Param() params: GetPostParamsDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.rentalPostService.update({
      id: params.rentalPostId,
      data: body,
      updatedById: userId,
    })
  }

  @Delete(':rentalPostId')
  @ZodSerializerDto(MessageResDTO)
  delete(
    @Param() params: GetPostParamsDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.rentalPostService.delete({
      id: params.rentalPostId,
      deletedById: userId,
    })
  }
}
