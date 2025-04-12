import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common'
import { ViewingScheduleService } from './viewing-schedule.service'
import {
  CreateViewingScheduleBodyType,
  UpdateViewingScheduleBodyType,
  GetViewingSchedulesQueryType,
} from './viewing-schedule.model'
import { User } from '@prisma/client'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'

@Controller('viewing-schedules')
@UseGuards(AccessTokenGuard)
export class ViewingScheduleController {
  constructor(private viewingScheduleService: ViewingScheduleService) {}

  @Post()
  create(
    @Body() body: CreateViewingScheduleBodyType,
    @ActiveUser('userId') userId: number
  ) {
    console.log('userId', userId)

    return this.viewingScheduleService.create(body, userId)
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateViewingScheduleBodyType,
    @ActiveUser('userId') userId: number
  ) {
    return this.viewingScheduleService.update(id, body, userId)
  }

  @Get()
  getList(
    @Query() query: GetViewingSchedulesQueryType,
    @ActiveUser('userId') userId: number
  ) {
    return this.viewingScheduleService.list(query, userId)
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number
  ) {
    return this.viewingScheduleService.findById(id, userId)
  }
}
