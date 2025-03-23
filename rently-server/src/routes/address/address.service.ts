import { Injectable } from '@nestjs/common'
import wards from 'src/data/wards.json'
import districts from 'src/data/districts.json'
import streets from 'src/data/streets.json'

@Injectable()
export class AddressService {
  // Lấy danh sách phường (wards)
  getWards() {
    return wards
  }

  // Lấy danh sách quận/huyện (districts)
  getDistricts() {
    return districts
  }

  getStreets() {
    return streets
  }

  // Lấy tất cả
  getAllAddresses() {
    return {
      wards,
      districts,
      streets,
    }
  }
}
