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
import {
  CreateRoomBodyDTO,
  GetRoomDetailResDTO,
  GetRoomParamsDTO,
  GetRoomsQueryDTO,
  GetRoomsResDTO,
  UpdateRoomBodyDTO,
} from 'src/routes/room/room.dto'
import { RoomService } from 'src/routes/room/room.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  @ZodSerializerDto(GetRoomsResDTO)
  list(@Query() query: GetRoomsQueryDTO) {
    return this.roomService.list(query)
  }

  @Get('my')
  @ZodSerializerDto(GetRoomsResDTO)
  listMyRooms(
    @Query() query: GetRoomsQueryDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.roomService.listMyRooms(userId, query)
  }

  @Get(':roomId')
  @ZodSerializerDto(GetRoomDetailResDTO)
  findById(@Param() params: GetRoomParamsDTO) {
    return this.roomService.findById(params.roomId)
  }

  @Post()
  @ZodSerializerDto(GetRoomDetailResDTO)
  create(
    @Body() body: CreateRoomBodyDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.roomService.create({ data: body, landlordId: userId })
  }

  @Post('admin/create-for-landlord')
  @ZodSerializerDto(GetRoomDetailResDTO)
  createForLandlord(@Body() body: CreateRoomBodyDTO & { landlordId: number }) {
    const { landlordId, ...roomData } = body
    return this.roomService.create({ data: roomData, landlordId })
  }

  @Put(':roomId')
  @ZodSerializerDto(GetRoomDetailResDTO)
  update(@Param() params: GetRoomParamsDTO, @Body() body: UpdateRoomBodyDTO) {
    return this.roomService.update({ id: params.roomId, data: body })
  }

  @Delete(':roomId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: GetRoomParamsDTO) {
    return this.roomService.delete({ id: params.roomId })
  }
}
