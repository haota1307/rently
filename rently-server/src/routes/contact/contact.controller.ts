import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { ContactService } from './contact.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import {
  ContactListResponseDTO,
  ContactResponseDTO,
  CreateContactDTO,
  RespondContactDTO,
} from './contact.dto'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { IsPublic } from 'src/shared/decorators/auth.decorator'

import { ContactStatus } from '@prisma/client'

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * Tạo contact mới - endpoint công khai
   */
  @Post()
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  create(@Body() createContactDto: CreateContactDTO) {
    return this.contactService.create(createContactDto)
  }

  /**
   * Lấy danh sách contact - yêu cầu quyền
   */
  @Get()
  @ZodSerializerDto(ContactListResponseDTO)
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ContactStatus,
    @Query('search') search?: string
  ) {
    return this.contactService.findAll({ page, limit, status, search })
  }

  /**
   * Lấy chi tiết contact theo ID - yêu cầu quyền
   */
  @Get(':id')
  @ZodSerializerDto(ContactResponseDTO)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contactService.findOne(id)
  }

  /**
   * Phản hồi contact - yêu cầu quyền
   */
  @Put(':id/respond')
  @ZodSerializerDto(ContactResponseDTO)
  respond(
    @Param('id', ParseIntPipe) id: number,
    @Body() respondDto: RespondContactDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.contactService.respond(id, respondDto, userId)
  }

  /**
   * Đóng một contact - yêu cầu quyền
   */
  @Put(':id/close')
  @ZodSerializerDto(ContactResponseDTO)
  close(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number
  ) {
    return this.contactService.close(id)
  }
}
