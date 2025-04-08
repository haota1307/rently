import { Injectable, NotFoundException } from '@nestjs/common'
import { FavoriteRepo } from 'src/routes/favorite/favorite.repo'
import {
  CreateFavoriteBodyType,
  GetUserFavoritesQueryType,
} from 'src/shared/models/shared-favorite.model'

@Injectable()
export class FavoriteService {
  constructor(private readonly favoriteRepo: FavoriteRepo) {}

  async getUserFavorites(userId: number, query: GetUserFavoritesQueryType) {
    return await this.favoriteRepo.getUserFavorites(userId, query)
  }

  async create(userId: number, data: CreateFavoriteBodyType) {
    try {
      return await this.favoriteRepo.create(userId, data)
    } catch (error) {
      if (error.message === 'Nhà trọ không tồn tại') {
        throw new NotFoundException('Nhà trọ không tồn tại')
      }
      throw error
    }
  }

  async delete(id: number, userId: number): Promise<{ message: string }> {
    await this.favoriteRepo.delete(id, userId)
    return {
      message: 'Xóa tin đã lưu thành công',
    }
  }

  async toggleFavorite(
    userId: number,
    data: CreateFavoriteBodyType
  ): Promise<{ message: string }> {
    try {
      // Kiểm tra xem bài đăng đã được lưu chưa
      const existingFavorite = await this.favoriteRepo.checkUserFavorite(
        userId,
        data.rentalId
      )

      if (existingFavorite) {
        // Nếu đã lưu rồi thì xóa đi
        await this.favoriteRepo.deleteByRentalId(userId, data.rentalId)
        return {
          message: 'Đã bỏ lưu tin đăng',
        }
      } else {
        // Nếu chưa lưu thì thêm vào
        await this.favoriteRepo.create(userId, data)
        return {
          message: 'Đã lưu tin đăng',
        }
      }
    } catch (error) {
      if (error.message === 'Nhà trọ không tồn tại') {
        throw new NotFoundException('Nhà trọ không tồn tại')
      }
      throw error
    }
  }

  async checkFavoriteStatus(userId: number, rentalId: number) {
    const favorite = await this.favoriteRepo.checkUserFavorite(userId, rentalId)
    return {
      isFavorited: !!favorite,
      favoriteId: favorite?.id || null,
    }
  }
}
