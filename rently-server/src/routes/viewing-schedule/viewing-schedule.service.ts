import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import {
  CreateViewingScheduleBodyType,
  UpdateViewingScheduleBodyType,
  GetViewingSchedulesQueryType,
  GetViewingSchedulesResType,
  ViewingScheduleType,
} from './viewing-schedule.model'
import { ViewingScheduleRepo } from './viewing-schedule.repo'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class ViewingScheduleService {
  constructor(
    private viewingScheduleRepo: ViewingScheduleRepo,
    private prismaService: PrismaService
  ) {}

  async create(
    body: CreateViewingScheduleBodyType,
    userId: number
  ): Promise<ViewingScheduleType> {
    console.log('userId', userId)

    if (!userId) {
      throw new BadRequestException('Người dùng không hợp lệ')
    }

    // Kiểm tra post có tồn tại không
    const post = await this.prismaService.rentalPost.findUnique({
      where: { id: body.postId },
    })

    if (!post) {
      throw new NotFoundException('Bài đăng không tồn tại')
    }

    // Kiểm tra user có phải là client không
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    })

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại')
    }

    if (user.role.name !== 'CLIENT') {
      throw new ForbiddenException(
        'Chỉ khách hàng mới có thể đặt lịch xem phòng'
      )
    }

    return this.viewingScheduleRepo.create(body, userId)
  }

  async update(
    id: number,
    body: UpdateViewingScheduleBodyType,
    userId: number
  ): Promise<ViewingScheduleType> {
    if (!userId) {
      throw new BadRequestException('Người dùng không hợp lệ')
    }

    const schedule = await this.viewingScheduleRepo.findOneByIdAndUserId(
      id,
      userId
    )

    if (!schedule) {
      throw new NotFoundException(
        'Lịch xem phòng không tồn tại hoặc bạn không có quyền cập nhật'
      )
    }

    return this.viewingScheduleRepo.update(id, body)
  }

  async list(
    query: GetViewingSchedulesQueryType,
    userId: number
  ): Promise<GetViewingSchedulesResType> {
    if (!userId) {
      throw new BadRequestException('Người dùng không hợp lệ')
    }

    // Xử lý query params
    const safeQuery = {
      ...query,
      page: Number(query.page || 1),
      limit: Number(query.limit || 10),
    }

    // Lấy vai trò của người dùng
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    })

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại')
    }

    const role = user.role.name

    return this.viewingScheduleRepo.list(safeQuery, userId, role)
  }

  async findById(id: number, userId: number): Promise<ViewingScheduleType> {
    if (!userId) {
      throw new BadRequestException('Người dùng không hợp lệ')
    }

    const schedule = await this.viewingScheduleRepo.findOneByIdAndUserId(
      id,
      userId
    )

    if (!schedule) {
      throw new NotFoundException(
        'Lịch xem phòng không tồn tại hoặc bạn không có quyền xem'
      )
    }

    return schedule
  }
}
