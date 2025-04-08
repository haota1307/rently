import { Module } from '@nestjs/common'
import { FavoriteController } from './favorite.controller'
import { FavoriteService } from './favorite.service'
import { FavoriteRepo } from './favorite.repo'

@Module({
  controllers: [FavoriteController],
  providers: [FavoriteService, FavoriteRepo],
  exports: [FavoriteService],
})
export class FavoriteModule {}
