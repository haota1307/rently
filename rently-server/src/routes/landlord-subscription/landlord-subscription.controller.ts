import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
  Param,
  Put,
  NotFoundException,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { LandlordSubscriptionService } from './landlord-subscription.service'
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  RenewSubscriptionDto,
} from './dto/landlord-subscription.dto'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { Roles } from '../../shared/decorators/roles.decorator'
import { RoleEnum } from '../../shared/enums/role.enum'
import {
  SubscriptionPlanDto,
  UpdateSubscriptionPlansDto,
} from './dto/subscription-plan.dto'

@ApiTags('Landlord Subscription')
@Controller('landlord-subscription')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class LandlordSubscriptionController {
  constructor(
    private readonly subscriptionService: LandlordSubscriptionService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo subscription mới cho landlord' })
  @ApiResponse({ status: 201, description: 'Tạo subscription thành công' })
  @ApiResponse({
    status: 400,
    description: 'User đã có subscription đang hoạt động',
  })
  async createSubscription(
    @ActiveUser('userId') userId: number,
    @Body() createSubscriptionDto: CreateSubscriptionDto
  ) {
    return this.subscriptionService.createSubscription(
      userId,
      createSubscriptionDto
    )
  }

  @Get('my-subscription')
  @ApiOperation({ summary: 'Lấy subscription hiện tại của user' })
  @ApiResponse({ status: 200, description: 'Lấy subscription thành công' })
  async getMySubscription(@ActiveUser('userId') userId: number) {
    return this.subscriptionService.getActiveSubscription(userId)
  }

  @Post('renew')
  @ApiOperation({ summary: 'Gia hạn subscription' })
  @ApiResponse({ status: 200, description: 'Gia hạn subscription thành công' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy subscription đang hoạt động',
  })
  async renewSubscription(
    @ActiveUser('userId') userId: number,
    @Body() renewDto: RenewSubscriptionDto
  ) {
    return this.subscriptionService.renewSubscription(
      userId,
      renewDto.paymentId
    )
  }

  @Patch('suspend')
  @ApiOperation({ summary: 'Tạm dừng subscription' })
  @ApiResponse({ status: 200, description: 'Tạm dừng subscription thành công' })
  async suspendSubscription(
    @ActiveUser('userId') userId: number,
    @Body('reason') reason?: string
  ) {
    return this.subscriptionService.suspendSubscription(userId, reason)
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Hủy subscription' })
  @ApiResponse({ status: 200, description: 'Hủy subscription thành công' })
  async cancelSubscription(
    @ActiveUser('userId') userId: number,
    @Body('reason') reason?: string
  ) {
    return this.subscriptionService.cancelSubscription(userId, reason)
  }

  @Patch('toggle-auto-renew')
  @ApiOperation({ summary: 'Bật/tắt tự động gia hạn subscription' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái tự động gia hạn thành công',
  })
  async toggleAutoRenew(
    @ActiveUser('userId') userId: number,
    @Body('autoRenew') autoRenew: boolean
  ) {
    return this.subscriptionService.toggleAutoRenew(userId, autoRenew)
  }

  @Get('check-access')
  @ApiOperation({ summary: 'Kiểm tra quyền truy cập trang cho thuê' })
  @ApiResponse({
    status: 200,
    description: 'Kiểm tra quyền truy cập thành công',
  })
  async checkLandlordAccess(
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    if (roleName === 'ADMIN') {
      return {
        hasAccess: true,
        message: 'Admin luôn có quyền truy cập',
      }
    }
    return this.subscriptionService.checkLandlordAccess(userId)
  }

  @Get('check-eligibility')
  @ApiOperation({ summary: 'Kiểm tra điều kiện đăng ký subscription' })
  @ApiResponse({
    status: 200,
    description: 'Kiểm tra điều kiện thành công',
  })
  async checkSubscriptionEligibility(@ActiveUser('userId') userId: number) {
    return this.subscriptionService.checkSubscriptionEligibility(userId)
  }

  @Get('history')
  @ApiOperation({ summary: 'Lấy lịch sử subscription' })
  @ApiResponse({ status: 200, description: 'Lấy lịch sử thành công' })
  async getSubscriptionHistory(
    @ActiveUser('userId') userId: number,
    @Query('subscriptionId') subscriptionId?: string
  ) {
    const subscriptionIdNumber = subscriptionId
      ? parseInt(subscriptionId, 10)
      : undefined
    return this.subscriptionService.getSubscriptionHistory(
      userId,
      subscriptionIdNumber
    )
  }

  // ============ ADMIN ENDPOINTS ============

  @Get('admin/subscriptions')
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách tất cả subscription' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  async getAllSubscriptions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('planType') planType?: string
  ) {
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)

    return this.subscriptionService.getAllSubscriptions({
      page: pageNumber,
      limit: limitNumber,
      search,
      status,
      planType,
    })
  }

  @Get('admin/subscriptions/stats')
  @ApiOperation({ summary: '[ADMIN] Lấy thống kê subscription' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê thành công' })
  async getSubscriptionStats() {
    return this.subscriptionService.getSubscriptionStats()
  }

  @Get('admin/subscriptions/:id')
  @ApiOperation({ summary: '[ADMIN] Lấy chi tiết subscription' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  async getSubscriptionDetail(
    @Param('id', ParseIntPipe) subscriptionId: number
  ) {
    return this.subscriptionService.getSubscriptionDetail(subscriptionId)
  }

  @Patch('admin/subscriptions/:id/suspend')
  @ApiOperation({ summary: '[ADMIN] Tạm dừng subscription' })
  @ApiResponse({ status: 200, description: 'Tạm dừng thành công' })
  async adminSuspendSubscription(
    @Param('id', ParseIntPipe) subscriptionId: number,
    @Body('reason') reason?: string
  ) {
    return this.subscriptionService.adminSuspendSubscription(
      subscriptionId,
      reason
    )
  }

  @Patch('admin/subscriptions/:id/reactivate')
  @ApiOperation({ summary: '[ADMIN] Kích hoạt lại subscription' })
  @ApiResponse({ status: 200, description: 'Kích hoạt thành công' })
  async adminReactivateSubscription(
    @Param('id', ParseIntPipe) subscriptionId: number
  ) {
    return this.subscriptionService.adminReactivateSubscription(subscriptionId)
  }

  @Patch('admin/subscriptions/:id/cancel')
  @ApiOperation({ summary: '[ADMIN] Hủy subscription' })
  @ApiResponse({ status: 200, description: 'Hủy thành công' })
  async adminCancelSubscription(
    @Param('id', ParseIntPipe) subscriptionId: number,
    @Body('reason') reason?: string
  ) {
    return this.subscriptionService.adminCancelSubscription(
      subscriptionId,
      reason
    )
  }

  @Post('admin/subscriptions/:id/renew')
  @ApiOperation({ summary: '[ADMIN] Gia hạn subscription (admin override)' })
  @ApiResponse({ status: 200, description: 'Gia hạn thành công' })
  async adminRenewSubscription(
    @Param('id', ParseIntPipe) subscriptionId: number,
    @Body('months') months: number = 1
  ) {
    return this.subscriptionService.adminRenewSubscription(
      subscriptionId,
      months
    )
  }

  @Get('admin/subscriptions/:id/history')
  @ApiOperation({ summary: '[ADMIN] Lấy lịch sử subscription' })
  @ApiResponse({ status: 200, description: 'Lấy lịch sử thành công' })
  async getAdminSubscriptionHistory(
    @Param('id', ParseIntPipe) subscriptionId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)

    return this.subscriptionService.getAdminSubscriptionHistory(
      subscriptionId,
      pageNumber,
      limitNumber
    )
  }

  // ============ SUBSCRIPTION PLANS ENDPOINTS ============

  @Get('plans')
  @ApiOperation({ summary: 'Lấy danh sách các gói subscription có sẵn' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách gói thành công' })
  async getAvailableSubscriptionPlans() {
    return this.subscriptionService.getAvailableSubscriptionPlans()
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: 'Lấy thông tin gói subscription theo ID' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin gói thành công' })
  @ApiResponse({ status: 404, description: 'Gói subscription không tồn tại' })
  async getSubscriptionPlanById(@Param('planId') planId: string) {
    const plan = await this.subscriptionService.getSubscriptionPlanById(planId)
    if (!plan) {
      throw new NotFoundException('Gói subscription không tồn tại')
    }
    return plan
  }

  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Get('admin/plans')
  @ApiOperation({
    summary: '[ADMIN] Lấy tất cả gói subscription (cả inactive)',
  })
  async getAllSubscriptionPlans() {
    return this.subscriptionService.getAllSubscriptionPlans()
  }

  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Put('admin/plans')
  @ApiOperation({
    summary: '[ADMIN] Cập nhật toàn bộ danh sách gói subscription',
  })
  async updateSubscriptionPlans(
    @Body() body: { plans: SubscriptionPlanDto[] }
  ) {
    return this.subscriptionService.updateSubscriptionPlans(body.plans)
  }

  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Post('admin/plans')
  @ApiOperation({ summary: '[ADMIN] Thêm gói subscription mới' })
  async addSubscriptionPlan(@Body() plan: SubscriptionPlanDto) {
    return this.subscriptionService.addSubscriptionPlan(plan)
  }

  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Patch('admin/plans/:planId')
  @ApiOperation({ summary: '[ADMIN] Cập nhật gói subscription' })
  async updateSubscriptionPlan(
    @Param('planId') planId: string,
    @Body() plan: SubscriptionPlanDto
  ) {
    return this.subscriptionService.updateSubscriptionPlan(planId, plan)
  }

  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Delete('admin/plans/:planId')
  @ApiOperation({ summary: '[ADMIN] Xóa gói subscription' })
  async deleteSubscriptionPlan(@Param('planId') planId: string) {
    return this.subscriptionService.deleteSubscriptionPlan(planId)
  }
}
