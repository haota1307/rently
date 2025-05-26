import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { RentalRequestService } from './rental-request.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import {
  CreateRentalRequestBodyDTO,
  GetRentalRequestParamsDTO,
  GetRentalRequestsQueryDTO,
  GetRentalRequestsResDTO,
  RentalRequestDetailDTO,
  UpdateRentalRequestBodyDTO,
  CancelRentalRequestBodyDTO,
} from './rental-request.dto'

@Controller('rental-requests')
export class RentalRequestController {
  constructor(private rentalRequestService: RentalRequestService) {}

  @Get()
  @ZodSerializerDto(GetRentalRequestsResDTO)
  list(
    @Query() query: GetRentalRequestsQueryDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    return this.rentalRequestService.list(query, userId, roleName)
  }

  /**
   * Lấy chi tiết yêu cầu thuê
   */
  @Get(':id')
  @ZodSerializerDto(RentalRequestDetailDTO)
  findById(
    @Param() params: GetRentalRequestParamsDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    return this.rentalRequestService.findById(params.id, userId, roleName)
  }

  /**
   * Tạo yêu cầu thuê mới
   */
  @Post()
  @ZodSerializerDto(RentalRequestDetailDTO)
  create(
    @Body() body: CreateRentalRequestBodyDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.rentalRequestService.create(body, userId)
  }

  /**
   * Cập nhật yêu cầu thuê
   */
  @Put(':id')
  @ZodSerializerDto(RentalRequestDetailDTO)
  update(
    @Param() params: GetRentalRequestParamsDTO,
    @Body() body: UpdateRentalRequestBodyDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    return this.rentalRequestService.update(params.id, body, userId, roleName)
  }

  /**
   * Hủy yêu cầu thuê (landlord hoặc tenant)
   */
  @Put(':id/cancel')
  @ZodSerializerDto(RentalRequestDetailDTO)
  cancelRequest(
    @Param() params: GetRentalRequestParamsDTO,
    @Body() body: CancelRentalRequestBodyDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    return this.rentalRequestService.cancelRequest(
      params.id,
      body,
      userId,
      roleName
    )
  }
}
