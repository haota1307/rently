import { Injectable } from '@nestjs/common'
import { RoomBillRepository } from './room-bill.repo'
import {
  CreateRoomBillType,
  UpdateRoomBillType,
} from 'src/shared/models/shared-room-bill.model'
import { EmailService } from 'src/shared/services/email.service'
import React from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import RoomBillEmail from 'emails/room-bill'
import { render } from '@react-email/components'

@Injectable()
export class RoomBillService {
  constructor(
    private readonly roomBillRepository: RoomBillRepository,
    private readonly emailService: EmailService
  ) {}

  async create(params: { userId: number; data: CreateRoomBillType }) {
    const { userId, data } = params

    // Tìm thông tin phòng để lấy giá phòng
    const room = await this.roomBillRepository.findRoomById(data.roomId)
    if (!room) {
      throw new Error('Không tìm thấy thông tin phòng')
    }

    // Tìm hợp đồng hiện tại của phòng để lấy giá thuê chính xác
    const rentalContract =
      await this.roomBillRepository.findActiveContractByRoomId(data.roomId)

    // Kiểm tra xem phòng có đang được cho thuê hay không (có hợp đồng đang hoạt động)
    if (!rentalContract) {
      throw new Error(
        'Phòng này chưa được cho thuê hoặc không có hợp đồng thuê đang hoạt động'
      )
    }

    // Lấy giá thuê từ hợp đồng
    let roomRent = Number(rentalContract.monthlyRent)

    // Tính toán tiền điện và nước
    const electricityUsage = data.electricityNew - data.electricityOld
    const electricityAmount = electricityUsage * data.electricityPrice

    const waterUsage = data.waterNew - data.waterOld
    const waterAmount = waterUsage * data.waterPrice

    // Tính tổng các khoản phí khác (nếu có)
    let otherFeesTotal = 0
    if (data.otherFees) {
      if (Array.isArray(data.otherFees)) {
        otherFeesTotal = data.otherFees.reduce(
          (sum: number, fee: any) => sum + Number(fee.amount),
          0
        )
      } else if (
        typeof data.otherFees === 'object' &&
        data.otherFees !== null
      ) {
        otherFeesTotal = Object.values(
          data.otherFees as Record<string, any>
        ).reduce((sum: number, amount: any) => sum + Number(amount), 0)
      }
    }

    // Tính tổng tiền bao gồm cả tiền phòng
    const totalAmount =
      roomRent + electricityAmount + waterAmount + otherFeesTotal

    return this.roomBillRepository.create({
      ...data,
      createdById: userId,
      totalAmount,
    })
  }

  async update(params: { id: number; data: UpdateRoomBillType }) {
    const { id, data } = params

    // Nếu không cập nhật đầy đủ các thông tin cần thiết để tính toán,
    // lấy thông tin hiện tại từ cơ sở dữ liệu
    const currentBill = await this.roomBillRepository.findById(id)
    if (!currentBill) {
      throw new Error('Không tìm thấy hóa đơn')
    }

    // Xác định giá trị cho các trường
    const electricityOld = data.electricityOld ?? currentBill.electricityOld
    const electricityNew = data.electricityNew ?? currentBill.electricityNew
    const electricityPrice =
      data.electricityPrice ?? Number(currentBill.electricityPrice)
    const waterOld = data.waterOld ?? currentBill.waterOld
    const waterNew = data.waterNew ?? currentBill.waterNew
    const waterPrice = data.waterPrice ?? Number(currentBill.waterPrice)

    // Tìm thông tin phòng để lấy giá phòng
    const room = await this.roomBillRepository.findRoomById(currentBill.roomId)
    if (!room) {
      throw new Error('Không tìm thấy thông tin phòng')
    }

    // Tìm hợp đồng hiện tại của phòng để lấy giá thuê chính xác
    let roomRent = Number(room.price)
    const rentalContract =
      await this.roomBillRepository.findActiveContractByRoomId(
        currentBill.roomId
      )
    if (rentalContract) {
      roomRent = Number(rentalContract.monthlyRent)
    }

    // Tính toán tiền điện và nước
    const electricityUsage = electricityNew - electricityOld
    const electricityAmount = electricityUsage * electricityPrice

    const waterUsage = waterNew - waterOld
    const waterAmount = waterUsage * waterPrice

    // Tính tổng các khoản phí khác (nếu có)
    let otherFeesTotal = 0
    const otherFees = data.otherFees ?? currentBill.otherFees

    if (otherFees) {
      if (Array.isArray(otherFees)) {
        otherFeesTotal = otherFees.reduce(
          (sum: number, fee: any) => sum + Number(fee.amount),
          0
        )
      } else if (typeof otherFees === 'object' && otherFees !== null) {
        otherFeesTotal = Object.values(otherFees as Record<string, any>).reduce(
          (sum: number, amount: any) => sum + Number(amount),
          0
        )
      }
    }

    // Tính tổng tiền bao gồm cả tiền phòng
    const totalAmount =
      roomRent + electricityAmount + waterAmount + otherFeesTotal

    return this.roomBillRepository.update(id, {
      ...data,
      totalAmount,
    })
  }

  async findById(id: number) {
    return this.roomBillRepository.findById(id)
  }

  async list(params: {
    roomId?: number
    isPaid?: boolean
    billingMonth?: Date
    page: number
    limit: number
    landlordId?: number
  }) {
    return this.roomBillRepository.list(params)
  }

  async delete(params: { id: number }) {
    return this.roomBillRepository.delete(params.id)
  }

  async sendBillEmail(id: number, tenantEmail?: string) {
    const bill = await this.roomBillRepository.findById(id)

    if (!bill) {
      throw new Error('Không tìm thấy hóa đơn')
    }

    // Tìm thông tin hợp đồng liên quan đến phòng để lấy email người thuê
    let recipientEmail = tenantEmail
    let tenantName = 'Quý khách'

    // Tìm kiếm hợp đồng có liên quan đến phòng này và còn hiệu lực
    const rentalContract =
      await this.roomBillRepository.findActiveContractByRoomId(bill.roomId)
    if (rentalContract) {
      // Tìm thấy thông tin người thuê từ hợp đồng
      const tenant = await this.roomBillRepository.findUserById(
        rentalContract.tenantId
      )
      if (tenant) {
        recipientEmail = recipientEmail || tenant.email
        tenantName = tenant.name
      }
    }

    if (!recipientEmail) {
      throw new Error(
        'Không tìm thấy email người nhận. Vui lòng cung cấp email.'
      )
    }

    const electricityUsage = bill.electricityNew - bill.electricityOld
    const electricityAmount = electricityUsage * Number(bill.electricityPrice)

    const waterUsage = bill.waterNew - bill.waterOld
    const waterAmount = waterUsage * Number(bill.waterPrice)

    // Lấy thông tin tiền phòng từ phòng hoặc hợp đồng nếu có
    let roomRent = 0
    if (rentalContract) {
      roomRent = Number(rentalContract.monthlyRent)
    } else if (bill.room) {
      roomRent = Number(bill.room.price)
    }

    const otherFeesArray = bill.otherFees
      ? Array.isArray(bill.otherFees)
        ? bill.otherFees
        : typeof bill.otherFees === 'object' && bill.otherFees !== null
          ? Object.entries(bill.otherFees).map(([name, amount]) => ({
              name,
              amount: Number(amount),
            }))
          : []
      : []

    // Thêm tiền phòng vào danh sách phí nếu có
    if (roomRent > 0) {
      otherFeesArray.unshift({
        name: 'Tiền phòng',
        amount: roomRent,
      })
    }

    // Format ngày tháng theo định dạng Việt Nam
    const billingMonth = format(new Date(bill.billingMonth), 'MMMM yyyy', {
      locale: vi,
    })
    const dueDate = format(new Date(bill.dueDate), 'dd/MM/yyyy', { locale: vi })

    // Sử dụng phương thức sendRoomBill của EmailService
    await this.emailService.sendRoomBill({
      email: recipientEmail,
      tenantName: tenantName,
      roomTitle: bill.room.title,
      billingMonth: billingMonth,
      dueDate: dueDate,
      electricityOld: bill.electricityOld,
      electricityNew: bill.electricityNew,
      electricityUsage: electricityUsage,
      electricityPrice: Number(bill.electricityPrice),
      electricityAmount: electricityAmount,
      waterOld: bill.waterOld,
      waterNew: bill.waterNew,
      waterUsage: waterUsage,
      waterPrice: Number(bill.waterPrice),
      waterAmount: waterAmount,
      otherFees: otherFeesArray as Array<{ name: string; amount: number }>,
      totalAmount: Number(bill.totalAmount),
      note: bill.note || undefined,
      paymentUrl: 'https://rently.top/nap-tien',
    })

    // Cập nhật trạng thái đã gửi email
    await this.roomBillRepository.markAsSent(id)

    return { message: 'Đã gửi hóa đơn qua email thành công' }
  }

  async getTenantInfoByRoom(roomId: number) {
    const room = await this.roomBillRepository.findRoomById(roomId)
    if (!room) {
      throw new Error('Không tìm thấy thông tin phòng')
    }

    const rentalContract =
      await this.roomBillRepository.findActiveContractByRoomId(roomId)
    if (!rentalContract) {
      return {
        tenant: null,
        roomRent: Number(room.price),
      }
    }

    const tenant = await this.roomBillRepository.findUserById(
      rentalContract.tenantId
    )

    if (!tenant) {
      return {
        tenant: null,
        roomRent: Number(rentalContract.monthlyRent),
      }
    }

    return {
      tenant,
      roomRent: Number(rentalContract.monthlyRent),
    }
  }

  async getRentedRooms(landlordId: number) {
    const rooms =
      await this.roomBillRepository.findRentedRoomsByLandlord(landlordId)

    return {
      data: rooms.map(room => ({
        id: room.id,
        title: room.title,
        price: room.price,
        rentalId: room.rentalId,
        rentalTitle: room.rental.title,
        tenant:
          room.RentalContract?.length > 0
            ? room.RentalContract[0].User_RentalContract_tenantIdToUser
            : null,
        monthlyRent:
          room.RentalContract?.length > 0
            ? room.RentalContract[0].monthlyRent
            : room.price,
      })),
    }
  }

  async listTenantBills(params: {
    roomId?: number
    isPaid?: boolean
    billingMonth?: Date
    page: number
    limit: number
    tenantId?: number
  }) {
    return this.roomBillRepository.listByTenant(params)
  }

  async getLatestBillInfo(roomId: number) {
    // Tìm hóa đơn gần nhất của phòng
    const latestBill =
      await this.roomBillRepository.findLatestBillByRoom(roomId)

    if (!latestBill) {
      // Nếu không tìm thấy hóa đơn nào, trả về giá trị mặc định
      return {
        electricityOld: 0,
        electricityNew: 0,
        waterOld: 0,
        waterNew: 0,
        electricityPrice: 3500,
        waterPrice: 15000,
      }
    }

    // Nếu tìm thấy hóa đơn, sử dụng chỉ số mới của hóa đơn này làm chỉ số cũ cho hóa đơn mới
    return {
      electricityOld: latestBill.electricityNew,
      electricityNew: latestBill.electricityNew,
      waterOld: latestBill.waterNew,
      waterNew: latestBill.waterNew,
      electricityPrice: latestBill.electricityPrice,
      waterPrice: latestBill.waterPrice,
    }
  }
}
