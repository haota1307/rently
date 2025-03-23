import { Injectable } from '@nestjs/common'
import { RentalRepo } from 'src/routes/rental/rental.repo'
import {
  CreateRentalBodyType,
  GetRentalsQueryType,
  UpdateRentalBodyType,
} from 'src/routes/rental/rental.model'
import { NotFoundRecordException } from 'src/shared/error'

@Injectable()
export class RentalService {
  constructor(private readonly rentalRepo: RentalRepo) {}

  async list(query: GetRentalsQueryType) {
    return this.rentalRepo.list(query)
  }

  async findById(id: number) {
    const rental = await this.rentalRepo.findById(id)
    if (!rental) {
      throw NotFoundRecordException
    }
    return rental
  }

  async create({ data }: { data: CreateRentalBodyType }) {
    return this.rentalRepo.create({ data })
  }

  async update({ id, data }: { id: number; data: UpdateRentalBodyType }) {
    try {
      return await this.rentalRepo.update({ id, data })
    } catch (error) {
      throw NotFoundRecordException
    }
  }

  async delete({ id }: { id: number }) {
    try {
      await this.rentalRepo.delete({ id })
      return { message: 'Delete successfully' }
    } catch (error) {
      throw NotFoundRecordException
    }
  }
}
