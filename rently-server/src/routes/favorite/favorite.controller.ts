import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { FavoriteService } from 'src/routes/favorite/favorite.service'
import {
  CreateFavoriteBodyDTO,
  DeleteFavoriteParamDTO,
  GetUserFavoritesQueryDTO,
  GetUserFavoritesResDTO,
} from 'src/routes/favorite/favorite.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  @ZodSerializerDto(GetUserFavoritesResDTO)
  getUserFavorites(
    @Query() query: GetUserFavoritesQueryDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.favoriteService.getUserFavorites(userId, query)
  }

  @Post()
  @ZodSerializerDto(MessageResDTO)
  create(
    @Body() body: CreateFavoriteBodyDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.favoriteService.create(userId, body)
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  delete(
    @Param() params: DeleteFavoriteParamDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.favoriteService.delete(params.id, userId)
  }

  @Post('toggle')
  @ZodSerializerDto(MessageResDTO)
  toggleFavorite(
    @Body() body: CreateFavoriteBodyDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.favoriteService.toggleFavorite(userId, body)
  }

  @Get('check/:rentalId')
  checkFavoriteStatus(
    @Param('rentalId') rentalId: string,
    @ActiveUser('userId') userId: number
  ) {
    return this.favoriteService.checkFavoriteStatus(userId, Number(rentalId))
  }
}
