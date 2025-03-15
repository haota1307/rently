import { Injectable, NotFoundException } from '@nestjs/common'
import { GetUsersQueryType } from 'src/routes/users/users.model'
import { UsersRepository } from 'src/routes/users/users.repo'
import { UserType } from 'src/shared/models/shared-user.model'

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: UsersRepository) {}

  async GetAllUser(pagination: GetUsersQueryType) {
    return this.userRepo.findAll(pagination)
  }

  async GetUserById(id: number) {
    const user = await this.userRepo.findById(id)
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng')
    }
    return user
  }

  async updateUser(id: number, data: Partial<UserType>) {
    try {
      return await this.userRepo.updateUser(id, data)
    } catch (error) {
      throw new NotFoundException(
        'Cập nhật thất bại, không tìm thấy người dùng'
      )
    }
  }

  async deleteUser(id: number) {
    try {
      return await this.userRepo.deleteUser(id)
    } catch (error) {
      throw new NotFoundException('Xóa thất bại, không tìm thấy người dùng')
    }
  }
}
