import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { RentalRequestService } from './rental-request.service'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import {
  CreateRentalRequestBodyDTO,
  GetRentalRequestParamsDTO,
  GetRentalRequestsQueryDTO,
  GetRentalRequestsResDTO,
  RentalRequestDetailDTO,
  UpdateRentalRequestBodyDTO,
} from './rental-request.dto'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('rental-requests')
@UseGuards(AccessTokenGuard)
export class RentalRequestController {
  constructor(private rentalRequestService: RentalRequestService) {}

  /**
   * Lấy danh sách yêu cầu thuê
   */
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
}
