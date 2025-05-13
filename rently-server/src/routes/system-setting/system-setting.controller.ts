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
import { SystemSettingService } from './system-setting.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateSystemSettingDTO,
  GetSystemSettingByGroupDTO,
  SystemSettingDTO,
  UpdateSystemSettingDTO,
} from './system-setting.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'

@Controller('system-settings')
export class SystemSettingController {
  constructor(private readonly systemSettingService: SystemSettingService) {}

  @Get()
  @ZodSerializerDto(SystemSettingDTO)
  getAllSettings() {
    return this.systemSettingService.getAllSettings()
  }

  @Get('key/:key')
  @ZodSerializerDto(SystemSettingDTO)
  getSettingByKey(@Param('key') key: string) {
    return this.systemSettingService.getSettingByKey(key)
  }

  @Get('group')
  @IsPublic()
  @ZodSerializerDto(SystemSettingDTO)
  getSettingsByGroup(@Query() query: GetSystemSettingByGroupDTO) {
    return this.systemSettingService.getSettingsByGroup(query)
  }

  @Get('email-templates')
  getEmailTemplates() {
    return this.systemSettingService.getEmailTemplates()
  }

  @Post()
  @ZodSerializerDto(SystemSettingDTO)
  createSetting(
    @Body() body: CreateSystemSettingDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.systemSettingService.createSetting({
      ...body,
      userId,
    })
  }

  @Put(':key')
  @ZodSerializerDto(SystemSettingDTO)
  updateSetting(
    @Param('key') key: string,
    @Body() body: UpdateSystemSettingDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.systemSettingService.updateSetting({
      ...body,
      key,
      userId,
    })
  }

  @Delete(':key')
  @ZodSerializerDto(SystemSettingDTO)
  deleteSetting(@Param('key') key: string) {
    return this.systemSettingService.deleteSetting(key)
  }
}
