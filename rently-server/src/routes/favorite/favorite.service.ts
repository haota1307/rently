import { Injectable, NotFoundException } from '@nestjs/common'
import { FavoriteRepo } from './favorite.repo'
import {
  CreateFavoriteBodyType,
  GetUserFavoritesQueryType,
} from './favorite.model'

@Injectable()
export class FavoriteService {
  constructor(private readonly favoriteRepo: FavoriteRepo) {}

  async getUserFavorites(userId: number, query: GetUserFavoritesQueryType) {
    return await this.favoriteRepo.getUserFavorites(userId, query)
  }

  async create(
    userId: number,
    data: CreateFavoriteBodyType
  ): Promise<{ message: string }> {
    await this.favoriteRepo.create(userId, data)
    return {
      message: 'Đã lưu bài đăng thành công',
    }
  }

  async delete(id: number, userId: number): Promise<{ message: string }> {
    await this.favoriteRepo.delete(id, userId)
    return {
      message: 'Xóa bài đăng đã lưu thành công',
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
        data.postId
      )

      if (existingFavorite) {
        // Nếu đã lưu rồi thì xóa đi
        await this.favoriteRepo.deleteByPostId(userId, data.postId)
        return {
          message: 'Đã bỏ lưu bài đăng',
        }
      } else {
        // Nếu chưa lưu thì thêm vào
        await this.favoriteRepo.create(userId, data)
        return {
          message: 'Đã lưu bài đăng',
        }
      }
    } catch (error) {
      if (error.message === 'Bài đăng không tồn tại') {
        throw new NotFoundException('Bài đăng không tồn tại')
      }
      throw error
    }
  }

  async checkFavoriteStatus(userId: number, postId: number) {
    const favorite = await this.favoriteRepo.checkUserFavorite(userId, postId)
    return {
      isFavorited: !!favorite,
      favoriteId: favorite?.id || null,
    }
  }
}
