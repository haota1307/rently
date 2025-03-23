import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  CreateRentalBodyType,
  GetRentalsQueryType,
  GetRentalsResType,
  RentalType,
  UpdateRentalBodyType,
} from 'src/routes/rental/rental.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class RentalRepo {
  constructor(private prismaService: PrismaService) {}

  // Helper để chuyển Decimal sang number, đồng thời chuyển rentalImages -> images
  private formatRental = (rental: any): RentalType => {
    return {
      ...rental,
      lat: (rental.lat as Decimal).toNumber(),
      lng: (rental.lng as Decimal).toNumber(),
      // Chuyển danh sách rentalImages -> mảng string
      images: rental.rentalImages?.map((img: any) => img.imageUrl) || [],
    }
  }

  async list(query: GetRentalsQueryType): Promise<GetRentalsResType> {
    try {
      const skip = (query.page - 1) * query.limit
      const take = query.limit

      const [totalItems, data] = await Promise.all([
        this.prismaService.rental.count(),
        this.prismaService.rental.findMany({
          skip,
          take,
          include: {
            landlord: true,
            rentalImages: true,
          },
        }),
      ])

      return {
        data: data.map(this.formatRental),
        totalItems,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalItems / query.limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async findById(id: number): Promise<RentalType | null> {
    try {
      const rental = await this.prismaService.rental.findUnique({
        where: { id },
        include: {
          landlord: true,
          rentalImages: true,
          rooms: true,
        },
      })
      return rental ? this.formatRental(rental) : null
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async create({ data }: { data: CreateRentalBodyType }): Promise<RentalType> {
    try {
      const rental = await this.prismaService.rental.create({
        data,
        include: {
          landlord: true,
          rentalImages: true,
          rooms: true,
        },
      })
      return this.formatRental(rental)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async update({
    id,
    data,
  }: {
    id: number
    data: UpdateRentalBodyType
  }): Promise<RentalType> {
    try {
      const rental = await this.prismaService.rental.update({
        where: { id },
        data,
        include: {
          landlord: true,
          rentalImages: true,
          rooms: true,
        },
      })
      return this.formatRental(rental)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async delete({ id }: { id: number }): Promise<RentalType> {
    try {
      const rental = await this.prismaService.rental.delete({
        where: { id },
        include: {
          landlord: true,
          rentalImages: true,
        },
      })
      return this.formatRental(rental)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
