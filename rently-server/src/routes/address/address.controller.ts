import { Controller, Get } from '@nestjs/common'
import { AddressService } from './address.service'

@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get('wards')
  getWards() {
    return this.addressService.getWards()
  }

  @Get('districts')
  getDistricts() {
    return this.addressService.getDistricts()
  }

  @Get('streets')
  getProvinces() {
    return this.addressService.getStreets()
  }

  @Get()
  getAll() {
    return this.addressService.getAllAddresses()
  }
}
