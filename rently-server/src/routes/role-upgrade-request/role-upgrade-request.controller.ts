import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateRoleUpgradeRequestBodyDTO,
  GetRoleUpgradeRequestParamsDTO,
  GetRoleUpgradeRequestsQueryDTO,
  UpdateRoleUpgradeRequestBodyDTO,
} from './role-upgrade-request.dto'
import { RoleUpgradeRequestService } from './role-upgrade-request.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('role-upgrade-requests')
export class RoleUpgradeRequestController {
  constructor(
    private readonly roleUpgradeRequestService: RoleUpgradeRequestService
  ) {}

  @Get()
  list(@Query() query: GetRoleUpgradeRequestsQueryDTO) {
    return this.roleUpgradeRequestService.list(query)
  }

  @Get('me')
  getMyRequestStatus(@ActiveUser('userId') userId: number) {
    return this.roleUpgradeRequestService.findLatestByUserId(userId)
  }

  @Get(':requestId')
  findById(@Param() params: GetRoleUpgradeRequestParamsDTO) {
    return this.roleUpgradeRequestService.findById(params.requestId)
  }

  @Post()
  create(
    @Body() body: CreateRoleUpgradeRequestBodyDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.roleUpgradeRequestService.create({ data: body, userId })
  }

  @Put(':requestId')
  @ZodSerializerDto(MessageResDTO)
  update(
    @Param() params: GetRoleUpgradeRequestParamsDTO,
    @Body() body: UpdateRoleUpgradeRequestBodyDTO,
    @ActiveUser('userId') processedById: number
  ) {
    return this.roleUpgradeRequestService.update({
      id: params.requestId,
      data: body,
      processedById,
    })
  }
}
