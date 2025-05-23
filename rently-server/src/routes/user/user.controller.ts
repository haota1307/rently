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
  CreateUserBodyDTO,
  CreateUserResDTO,
  GetUserParamsDTO,
  GetUsersQueryDTO,
  GetUsersResDTO,
  SearchUsersQueryDTO,
  UpdateUserBodyDTO,
} from 'src/routes/user/user.dto'
import { UserService } from 'src/routes/user/user.service'
import { ActiveRolePermissions } from 'src/shared/decorators/active-role-permission.decorator'

import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import {
  GetUserProfileResDTO,
  UpdateProfileResDTO,
} from 'src/shared/dtos/shared-user.dto'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ZodSerializerDto(GetUsersResDTO)
  list(@Query() query: GetUsersQueryDTO) {
    return this.userService.list({
      page: query.page,
      limit: query.limit,
      name: query.name,
      status: query.status,
      roleId: query.roleId,
    })
  }

  @Get('search')
  @IsPublic()
  @ZodSerializerDto(GetUsersResDTO)
  search(@Query() query: SearchUsersQueryDTO) {
    return this.userService.search({
      query: query.query,
      limit: query.limit || 10,
      page: query.page || 1,
      excludeUserId: query.excludeUserId,
      status: query.status || 'ACTIVE',
    })
  }

  @Get(':userId')
  @ZodSerializerDto(GetUserProfileResDTO)
  findById(@Param() params: GetUserParamsDTO) {
    return this.userService.findById(params.userId)
  }

  @Post()
  @ZodSerializerDto(CreateUserResDTO)
  create(
    @Body() body: CreateUserBodyDTO,
    @ActiveUser('userId') userId: number,
    @ActiveRolePermissions('name') roleName: string
  ) {
    return this.userService.create({
      data: body,
      createdById: userId,
      createdByRoleName: roleName,
    })
  }

  @Put(':userId')
  @ZodSerializerDto(UpdateProfileResDTO)
  update(
    @Body() body: UpdateUserBodyDTO,
    @Param() params: GetUserParamsDTO,
    @ActiveUser('userId') userId: number,
    @ActiveRolePermissions('name') roleName: string
  ) {
    return this.userService.update({
      data: body,
      id: params.userId,
      updatedById: userId,
      updatedByRoleName: roleName,
    })
  }

  @Delete(':userId')
  @ZodSerializerDto(MessageResDTO)
  delete(
    @Param() params: GetUserParamsDTO,
    @ActiveUser('userId') userId: number,
    @ActiveRolePermissions('name') roleName: string
  ) {
    return this.userService.delete({
      id: params.userId,
      deletedById: userId,
      deletedByRoleName: roleName,
    })
  }

  @Patch(':userId/block')
  @ZodSerializerDto(MessageResDTO)
  blockUser(
    @Param() params: GetUserParamsDTO,
    @Body() body: { reason?: string },
    @ActiveUser('userId') userId: number,
    @ActiveRolePermissions('name') roleName: string
  ) {
    return this.userService.blockUser({
      id: params.userId,
      updatedById: userId,
      updatedByRoleName: roleName,
      reason: body.reason,
    })
  }

  @Patch(':userId/unblock')
  @ZodSerializerDto(MessageResDTO)
  unblockUser(
    @Param() params: GetUserParamsDTO,
    @ActiveUser('userId') userId: number,
    @ActiveRolePermissions('name') roleName: string
  ) {
    return this.userService.unblockUser({
      id: params.userId,
      updatedById: userId,
      updatedByRoleName: roleName,
    })
  }
}
