import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { ViewingScheduleService } from './viewing-schedule.service'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import {
  ViewingScheduleType,
  GetViewingSchedulesResType,
} from './viewing-schedule.model'
import {
  CreateViewingScheduleBodyDTO,
  UpdateViewingScheduleBodyDTO,
  GetViewingSchedulesQueryDTO,
  ViewingScheduleDTO,
  GetViewingSchedulesResDTO,
} from './viewing-schedule.dto'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('viewing-schedules')
@UseGuards(AccessTokenGuard)
export class ViewingScheduleController {
  constructor(private viewingScheduleService: ViewingScheduleService) {}

  @Post()
  @ZodSerializerDto(ViewingScheduleDTO)
  async create(
    @Body() body: CreateViewingScheduleBodyDTO,
    @ActiveUser('userId') userId: number
  ): Promise<ViewingScheduleType> {
    return this.viewingScheduleService.create(body, userId)
  }

  @Put(':id')
  @ZodSerializerDto(ViewingScheduleDTO)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateViewingScheduleBodyDTO,
    @ActiveUser('userId') userId: number
  ): Promise<ViewingScheduleType> {
    return this.viewingScheduleService.update(id, body, userId)
  }

  @Get()
  @ZodSerializerDto(GetViewingSchedulesResDTO)
  async list(
    @Query() query: GetViewingSchedulesQueryDTO,
    @ActiveUser('userId') userId: number
  ): Promise<GetViewingSchedulesResType> {
    return this.viewingScheduleService.list(query, userId)
  }

  @Get(':id')
  @ZodSerializerDto(ViewingScheduleDTO)
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number
  ): Promise<ViewingScheduleType> {
    return this.viewingScheduleService.findById(id, userId)
  }

  @Post(':id/send-reminder')
  @ZodSerializerDto(MessageResDTO)
  async sendReminder(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number
  ): Promise<{ success: boolean; message: string }> {
    return this.viewingScheduleService.sendReminder(id, userId)
  }
}
