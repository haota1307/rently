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
  AmenityDTO,
  CreateAmenityBodyDTO,
  GetAmenitiesQueryDTO,
  GetAmenitiesResDTO,
  GetAmenityParamsDTO,
  UpdateAmenityBodyDTO,
} from 'src/routes/amenity/amenity.dto'
import { AmenityService } from 'src/routes/amenity/amenity.service'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('amenities')
export class AmenityController {
  constructor(private readonly amenityService: AmenityService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(GetAmenitiesResDTO)
  list(@Query() query: GetAmenitiesQueryDTO) {
    return this.amenityService.list(query)
  }

  @Get(':amenityId')
  @ZodSerializerDto(AmenityDTO)
  findById(@Param() params: GetAmenityParamsDTO) {
    return this.amenityService.findById(params.amenityId)
  }

  @Post()
  @ZodSerializerDto(AmenityDTO)
  create(@Body() body: CreateAmenityBodyDTO) {
    return this.amenityService.create({ data: body })
  }

  @Put(':amenityId')
  @ZodSerializerDto(AmenityDTO)
  update(
    @Param() params: GetAmenityParamsDTO,
    @Body() body: UpdateAmenityBodyDTO
  ) {
    return this.amenityService.update({ id: params.amenityId, data: body })
  }

  @Delete(':amenityId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: GetAmenityParamsDTO) {
    return this.amenityService.delete({ id: params.amenityId })
  }
}
