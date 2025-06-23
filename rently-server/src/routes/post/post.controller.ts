import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreatePostBodyDTO,
  CreateBulkPostsBodyDTO,
  CreateBulkPostsResDTO,
  GetPostDetailResDTO,
  GetPostParamsDTO,
  GetPostsQueryDTO,
  GetPostsResDTO,
  UpdatePostBodyDTO,
  UpdatePostStatusDTO,
  GetNearbyPostsResDTO,
} from 'src/routes/post/post.dto'
import { PostService } from 'src/routes/post/post.service'

import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('posts')
export class PostController {
  constructor(private readonly rentalPostService: PostService) {}

  @Get()
  @IsPublic()
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

  @Get('nearby')
  @IsPublic()
  @ZodSerializerDto(GetNearbyPostsResDTO)
  async getNearbyPosts(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('limit') limit: string = '5'
  ) {
    return this.rentalPostService.getNearbyPosts({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      limit: parseInt(limit, 10),
    })
  }

  @Get('rental/:rentalId')
  async getSameRental(
    @Param('rentalId') rentalId: string,
    @Query('exclude') excludePostId: string,
    @Query('limit') limit: string = '4'
  ) {
    return this.rentalPostService.getSameRental(
      +rentalId,
      +excludePostId,
      +limit
    )
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

  @Post('bulk')
  @ZodSerializerDto(CreateBulkPostsResDTO)
  createBulk(
    @Body() body: CreateBulkPostsBodyDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.rentalPostService.createBulk({
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
    return this.rentalPostService.delete(params.rentalPostId, userId)
  }

  @Patch(':rentalPostId/status')
  @ZodSerializerDto(MessageResDTO)
  updateStatus(
    @Param() params: GetPostParamsDTO,
    @Body() body: UpdatePostStatusDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.rentalPostService.updateStatus({
      id: params.rentalPostId,
      data: body,
      updatedById: userId,
    })
  }

  @Get(':rentalPostId/similar-price')
  async getSimilarByPrice(
    @Param('rentalPostId') id: string,
    @Query('limit') limit: string = '4'
  ) {
    return this.rentalPostService.getSimilarByPrice(+id, +limit)
  }
}
