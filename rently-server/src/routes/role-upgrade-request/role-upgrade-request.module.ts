import { Module } from '@nestjs/common'
import { RoleUpgradeRequestController } from './role-upgrade-request.controller'
import { RoleUpgradeRequestService } from './role-upgrade-request.service'
import { RoleUpgradeRequestRepo } from './role-upgrade-request.repo'
import { EventsModule } from '../../events/events.module'

@Module({
  imports: [EventsModule],
  controllers: [RoleUpgradeRequestController],
  providers: [RoleUpgradeRequestService, RoleUpgradeRequestRepo],
  exports: [RoleUpgradeRequestService, RoleUpgradeRequestRepo],
})
export class RoleUpgradeRequestModule {}
