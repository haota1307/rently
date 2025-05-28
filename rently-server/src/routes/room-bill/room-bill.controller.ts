import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { RoomBillService } from './room-bill.service'
import {
  CreateRoomBillDTO,
  GetRoomBillParamsDTO,
  GetRoomBillQueryDTO,
  GetRoomBillsResDTO,
  RoomUtilityBillDTO,
  UpdateRoomBillDTO,
} from './room-bill.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('room-bills')
export class RoomBillController {
  constructor(private readonly roomBillService: RoomBillService) {}

  @Post()
  @ZodSerializerDto(RoomUtilityBillDTO)
  create(
    @Body() body: CreateRoomBillDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.roomBillService.create({ userId, data: body })
  }

  @Put(':id')
  @ZodSerializerDto(RoomUtilityBillDTO)
  update(
    @Param() params: GetRoomBillParamsDTO,
    @Body() body: UpdateRoomBillDTO
  ) {
    return this.roomBillService.update({ id: params.id, data: body })
  }

  @Get(':id')
  @ZodSerializerDto(RoomUtilityBillDTO)
  findById(@Param() params: GetRoomBillParamsDTO) {
    return this.roomBillService.findById(params.id)
  }

  @Get()
  @ZodSerializerDto(GetRoomBillsResDTO)
  list(
    @Query() query: GetRoomBillQueryDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.roomBillService.list({
      ...query,
      landlordId: userId,
    })
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: GetRoomBillParamsDTO) {
    return this.roomBillService.delete({ id: params.id })
  }

  @Post(':id/send-email')
  @ZodSerializerDto(MessageResDTO)
  sendBillEmail(@Param('id') id: string, @Body() body: { email?: string }) {
    return this.roomBillService.sendBillEmail(Number(id), body.email)
  }

  @Get('room/:roomId/tenant-info')
  async getTenantInfoByRoom(@Param('roomId') roomId: string) {
    return this.roomBillService.getTenantInfoByRoom(Number(roomId))
  }

  @Get('rented-rooms')
  async getRentedRooms(@ActiveUser('userId') userId: number) {
    return this.roomBillService.getRentedRooms(userId)
  }

  @Get('room/:roomId/latest-bill')
  async getLatestBillInfo(@Param('roomId') roomId: string) {
    return this.roomBillService.getLatestBillInfo(Number(roomId))
  }
}
