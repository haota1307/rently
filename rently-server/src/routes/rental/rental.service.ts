import { HttpException, Injectable } from '@nestjs/common'
import { RentalRepo } from 'src/routes/rental/rental.repo'

import { NotFoundRecordException } from 'src/shared/error'
import {
  CreateRentalBodyType,
  GetRentalsQueryType,
  UpdateRentalBodyType,
} from 'src/shared/models/shared-rental.mode'

@Injectable()
export class RentalService {
  constructor(private readonly rentalRepo: RentalRepo) {}

  async list(query: GetRentalsQueryType, userId?: number) {
    return this.rentalRepo.list(query, userId)
  }

  async findById(id: number) {
    const rental = await this.rentalRepo.findById(id)
    if (!rental) {
      throw NotFoundRecordException
    }
    return rental
  }

  async findByLandlord(landlordId: number, query: GetRentalsQueryType) {
    return this.rentalRepo.findByLandlord(landlordId, query)
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
      if (error instanceof HttpException) {
        throw error
      }
      throw NotFoundRecordException
    }
  }
}
