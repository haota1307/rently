import {
  Controller,
  Get,
  Param,
  Put,
  Delete,
  Body,
  Query,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  GetMeResDTO,
  GetUserResDTO,
  GetUsersQueryDTO,
  GetUsersResDTO,
  UpdateUserDTO,
} from 'src/routes/users/users.dto'
import { UsersService } from 'src/routes/users/users.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  @ZodSerializerDto(GetMeResDTO)
  async getMe(@ActiveUser('userId') userId: number) {
    return this.userService.GetUserById(Number(userId))
  }

  @Get()
  @ZodSerializerDto(GetUsersResDTO)
  async getUsers(@Query() query: GetUsersQueryDTO) {
    return this.userService.GetAllUser({
      limit: query.limit,
      page: query.page,
      role: query?.role,
    })
  }

  @Get(':id')
  @ZodSerializerDto(GetUserResDTO)
  async getUser(@Param('id') id: string) {
    return this.userService.GetUserById(Number(id))
  }

  @Put(':id')
  @ZodSerializerDto(GetUserResDTO)
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDTO) {
    return this.userService.updateUser(Number(id), body)
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  async deleteUser(@Param('id') id: string) {
    await this.userService.deleteUser(Number(id))

    return { message: 'Xóa người dùng thành công' }
  }
}
