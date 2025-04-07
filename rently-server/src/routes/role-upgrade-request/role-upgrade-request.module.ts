import { Module } from '@nestjs/common'
import { RoleUpgradeRequestController } from 'src/routes/role-upgrade-request/role-upgrade-request.controller'
import { RoleUpgradeRequestRepo } from 'src/routes/role-upgrade-request/role-upgrade-request.repo'
import { RoleUpgradeRequestService } from 'src/routes/role-upgrade-request/role-upgrade-request.service'

@Module({
  controllers: [RoleUpgradeRequestController],
  providers: [RoleUpgradeRequestService, RoleUpgradeRequestRepo],
  exports: [RoleUpgradeRequestService],
})
export class RoleUpgradeRequestModule {}
