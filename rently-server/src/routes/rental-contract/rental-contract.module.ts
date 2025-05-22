import { Module } from '@nestjs/common'
import { RentalContractController } from './rental-contract.controller'
import { RentalContractService } from './rental-contract.service'
import { RentalContractRepo } from './rental-contract.repo'
import { NotificationModule } from '../notification/notification.module'
import { UploadModule } from '../upload/upload.module'
import { PdfGeneratorService } from './pdf-generator.service'

@Module({
  imports: [NotificationModule, UploadModule],
  controllers: [RentalContractController],
  providers: [RentalContractService, RentalContractRepo, PdfGeneratorService],
  exports: [RentalContractService],
})
export class RentalContractModule {}
