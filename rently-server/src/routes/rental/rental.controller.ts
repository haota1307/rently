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
  CreateRentalBodyDTO,
  GetRentalDetailResDTO,
  GetRentalParamsDTO,
  GetRentalsQueryDTO,
  GetRentalsResDTO,
  UpdateRentalBodyDTO,
} from 'src/routes/rental/rental.dto'
import { RentalService } from 'src/routes/rental/rental.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('rentals')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Get()
  @ZodSerializerDto(GetRentalsResDTO)
  list(@Query() query: GetRentalsQueryDTO) {
    return this.rentalService.list(query)
  }

  @Get(':rentalId')
  @ZodSerializerDto(GetRentalDetailResDTO)
  findById(@Param() params: GetRentalParamsDTO) {
    return this.rentalService.findById(params.rentalId)
  }

  @Post()
  @ZodSerializerDto(GetRentalDetailResDTO)
  create(
    @Body() body: CreateRentalBodyDTO,
    @ActiveUser('userId') userId: number
  ) {
    // Bạn có thể ghi đè landlordId = userId nếu muốn
    return this.rentalService.create({ data: body })
  }

  @Put(':rentalId')
  @ZodSerializerDto(GetRentalDetailResDTO)
  update(
    @Param() params: GetRentalParamsDTO,
    @Body() body: UpdateRentalBodyDTO
  ) {
    return this.rentalService.update({ id: params.rentalId, data: body })
  }

  @Delete(':rentalId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: GetRentalParamsDTO) {
    return this.rentalService.delete({ id: params.rentalId })
  }
}
