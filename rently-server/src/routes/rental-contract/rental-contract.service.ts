import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { RentalContractRepo } from './rental-contract.repo'
import {
  AddContractAttachmentType,
  ContractDetailType,
  ContractsListType,
  ContractStatus,
  ContractTemplateType,
  ContractTemplatesListType,
  CreateContractTemplateType,
  CreateContractType,
  GetContractsQueryType,
  GetContractTemplatesQueryType,
  SignContractType,
} from './rental-contract.model'
import { NotificationService } from '../notification/notification.service'
import { EmailService } from 'src/shared/services/email.service'
import { RoleName } from 'src/shared/constants/role.constant'
import { NotificationTypeEnum } from '../notification/notification.schema'
import {
  ContractTemplateNotFoundException,
  ContractNotFoundException,
  UnauthorizedTemplateAccessException,
  UnauthorizedContractAccessException,
  UnauthorizedContractSigningException,
  InvalidContractStatusForSigningException,
  AwaitingTenantSignatureException,
  AwaitingLandlordSignatureException,
  ContractUpdateForbiddenException,
} from './rental-contract.error'
import { PdfGeneratorService } from './pdf-generator.service'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class RentalContractService {
  private readonly logger = new Logger(RentalContractService.name)

  constructor(
    private readonly rentalContractRepo: RentalContractRepo,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly prismaService: PrismaService
  ) {}

  // ===== Quản lý mẫu hợp đồng =====

  // Tạo mẫu hợp đồng mới
  async createTemplate(
    data: CreateContractTemplateType,
    userId: number,
    fileInfo: { fileUrl: string; fileName: string; fileType: string }
  ): Promise<ContractTemplateType> {
    try {
      return await this.rentalContractRepo.createTemplate(
        data,
        userId,
        fileInfo
      )
    } catch (error) {
      this.logger.error(`Error creating contract template: ${error.message}`)
      throw error
    }
  }

  // Lấy danh sách mẫu hợp đồng của người dùng
  async getTemplates(
    query: GetContractTemplatesQueryType,
    userId: number
  ): Promise<ContractTemplatesListType> {
    try {
      return await this.rentalContractRepo.getTemplates(query, userId)
    } catch (error) {
      this.logger.error(`Error getting templates: ${error.message}`)
      throw error
    }
  }

  // Lấy chi tiết mẫu hợp đồng
  async getTemplateById(
    id: number,
    userId: number
  ): Promise<ContractTemplateType> {
    try {
      const template = await this.rentalContractRepo.findTemplateById(id)

      if (!template) {
        throw ContractTemplateNotFoundException
      }

      // Kiểm tra quyền sở hữu
      if (template.landlordId !== userId) {
        this.logger.warn(`User ${userId} tried to access template ${id}`)
        throw UnauthorizedTemplateAccessException
      }

      return template
    } catch (error) {
      this.logger.error(`Error getting template by id: ${error.message}`)
      throw error
    }
  }

  // Xóa mẫu hợp đồng
  async deleteTemplate(id: number, userId: number): Promise<void> {
    try {
      // Kiểm tra quyền sở hữu
      const isOwner = await this.rentalContractRepo.isTemplateOwner(id, userId)
      if (!isOwner) {
        throw UnauthorizedTemplateAccessException
      }

      await this.rentalContractRepo.deleteTemplate(id)
    } catch (error) {
      this.logger.error(`Error deleting template: ${error.message}`)
      throw error
    }
  }

  // ===== Quản lý hợp đồng =====

  // Tạo hợp đồng mới
  async createContract(
    data: CreateContractType,
    userId: number
  ): Promise<ContractDetailType> {
    try {
      // Kiểm tra template nếu có
      if (data.templateId) {
        const isTemplateOwner = await this.rentalContractRepo.isTemplateOwner(
          data.templateId,
          userId
        )
        if (!isTemplateOwner) {
          throw new ForbiddenException(
            'Bạn không có quyền sử dụng mẫu hợp đồng này'
          )
        }
      }

      // Tạo nội dung hợp đồng (tạm thời)
      // Trong thực tế, nội dung này có thể được lấy từ template và điền thông tin vào
      const contractContent = `Hợp đồng thuê phòng được tạo ngày ${new Date().toLocaleDateString(
        'vi-VN'
      )}`

      // Tạo hợp đồng mới
      const contract = await this.rentalContractRepo.createContract(
        data,
        contractContent
      )

      return contract
    } catch (error) {
      this.logger.error(`Error creating contract: ${error.message}`)
      throw error
    }
  }

  // Lấy chi tiết hợp đồng
  async getContractById(
    id: number,
    userId: number,
    role: string
  ): Promise<ContractDetailType> {
    try {
      const contract = await this.rentalContractRepo.findContractById(id)

      if (!contract) {
        throw ContractNotFoundException
      }

      // Kiểm tra quyền truy cập (nếu không phải Admin)
      if (role !== RoleName.Admin) {
        const hasAccess = await this.rentalContractRepo.checkContractAccess(
          id,
          userId
        )
        if (!hasAccess) {
          throw UnauthorizedContractAccessException
        }
      }

      return contract
    } catch (error) {
      this.logger.error(`Error getting contract by id: ${error.message}`)
      throw error
    }
  }

  // Lấy danh sách hợp đồng
  async getContracts(
    query: GetContractsQueryType,
    userId: number,
    role: string
  ): Promise<ContractsListType> {
    try {
      return await this.rentalContractRepo.getContracts(query, userId, role)
    } catch (error) {
      this.logger.error(`Error getting contracts: ${error.message}`)
      throw error
    }
  }

  // Ký hợp đồng
  async signContract(
    id: number,
    data: SignContractType,
    userId: number,
    role: string
  ): Promise<ContractDetailType> {
    try {
      // Kiểm tra hợp đồng tồn tại
      const contract = await this.rentalContractRepo.findContractById(id)
      if (!contract) {
        throw ContractNotFoundException
      }

      // Xác định loại người dùng (chủ nhà hay người thuê)
      let userType: 'landlord' | 'tenant' = 'tenant' // Giá trị mặc định

      if (contract.landlordId === userId) {
        userType = 'landlord'
      } else if (contract.tenantId === userId) {
        userType = 'tenant'
      } else {
        throw UnauthorizedContractSigningException
      }

      // Kiểm tra trạng thái hợp đồng có hợp lệ để ký không
      if (
        contract.status !== ContractStatus.DRAFT &&
        contract.status !== ContractStatus.AWAITING_LANDLORD_SIGNATURE &&
        contract.status !== ContractStatus.AWAITING_TENANT_SIGNATURE
      ) {
        throw InvalidContractStatusForSigningException
      }

      // Kiểm tra thêm cho trường hợp cụ thể
      if (
        userType === 'landlord' &&
        contract.status === ContractStatus.AWAITING_TENANT_SIGNATURE
      ) {
        throw AwaitingTenantSignatureException
      }

      if (
        userType === 'tenant' &&
        contract.status === ContractStatus.AWAITING_LANDLORD_SIGNATURE
      ) {
        throw AwaitingLandlordSignatureException
      }

      // Tiến hành ký hợp đồng
      const signedContract =
        await this.rentalContractRepo.updateContractSignature(
          id,
          userId,
          userType,
          data.signature,
          {
            identityCard: data.identityCard,
            identityCardIssuedDate: data.identityCardIssuedDate,
            identityCardIssuedPlace: data.identityCardIssuedPlace,
            address: data.address,
          }
        )

      // Gửi thông báo
      this.sendContractSignatureNotifications(signedContract, userType)

      return signedContract
    } catch (error) {
      this.logger.error(`Error signing contract: ${error.message}`)
      throw error
    }
  }

  // Thêm tệp đính kèm vào hợp đồng
  async addAttachment(
    contractId: number,
    data: AddContractAttachmentType,
    userId: number,
    role: string
  ): Promise<ContractDetailType> {
    try {
      // Kiểm tra quyền truy cập
      const hasAccess = await this.rentalContractRepo.checkContractAccess(
        contractId,
        userId
      )
      if (!role.includes('Admin') && !hasAccess) {
        throw new ForbiddenException(
          'Bạn không có quyền thêm tệp đính kèm vào hợp đồng này'
        )
      }

      return await this.rentalContractRepo.addContractAttachment(
        contractId,
        data,
        userId
      )
    } catch (error) {
      this.logger.error(`Error adding attachment: ${error.message}`)
      throw error
    }
  }

  // Cập nhật URL tài liệu hợp đồng cuối cùng
  async updateFinalDocument(
    contractId: number,
    finalDocumentUrl: string,
    userId: number
  ): Promise<ContractDetailType> {
    try {
      // Kiểm tra chỉ chủ nhà mới có quyền cập nhật tài liệu cuối cùng
      const isLandlord = await this.rentalContractRepo.isLandlordOfContract(
        contractId,
        userId
      )
      if (!isLandlord) {
        throw ContractUpdateForbiddenException
      }

      return await this.rentalContractRepo.updateFinalDocument(
        contractId,
        finalDocumentUrl
      )
    } catch (error) {
      this.logger.error(`Error updating final document: ${error.message}`)
      throw error
    }
  }

  // ===== Chức năng xuất PDF hợp đồng =====

  // Lấy mã số hợp đồng từ ID
  async getContractNumber(contractId: number): Promise<string> {
    const contract = await this.rentalContractRepo.findContractById(contractId)
    if (!contract) {
      throw ContractNotFoundException
    }
    return contract.contractNumber
  }

  // Tạo PDF hợp đồng
  async generateContractPDF(
    contractId: number,
    userId: number,
    roleName: string
  ): Promise<Buffer> {
    try {
      // Lấy thông tin hợp đồng
      const contract = await this.getContractById(contractId, userId, roleName)

      if (!contract) {
        throw ContractNotFoundException
      }

      // Lấy thông tin chi tiết của chủ nhà và người thuê
      const landlordInfo = await this.rentalContractRepo.getUserInfo(
        contract.landlordId
      )
      const tenantInfo = await this.rentalContractRepo.getUserInfo(
        contract.tenantId
      )

      // Lấy chữ ký
      const signatures =
        await this.rentalContractRepo.getContractSignatures(contractId)

      // Gọi service để tạo PDF
      const pdfBuffer = await this.pdfGeneratorService.generateContractPdf(
        contract,
        landlordInfo,
        tenantInfo,
        signatures
      )

      return pdfBuffer
    } catch (error) {
      this.logger.error(`Error generating contract PDF: ${error.message}`)
      throw error
    }
  }

  // Gửi thông báo khi hợp đồng được ký
  private async sendContractSignatureNotifications(
    contract: ContractDetailType,
    signerType: 'landlord' | 'tenant'
  ): Promise<void> {
    try {
      let recipientId: number
      let recipientName: string
      let signerName: string
      let notificationContent: string
      let emailRecipient: string
      let emailSubject: string
      let emailContent: string

      if (signerType === 'landlord') {
        // Chủ nhà đã ký, thông báo cho người thuê
        recipientId = contract.tenantId
        recipientName = contract.tenant?.name || ''
        signerName = contract.landlord?.name || ''
        notificationContent = `Chủ nhà ${signerName} đã ký hợp đồng thuê phòng của bạn. Vui lòng kiểm tra và ký xác nhận.`
        emailRecipient = contract.tenant?.email || ''
        emailSubject = 'Chủ nhà đã ký hợp đồng thuê phòng'
        emailContent = `<p>Xin chào ${recipientName},</p>
          <p>Chủ nhà ${signerName} đã ký hợp đồng thuê phòng của bạn.</p>
          <p>Vui lòng đăng nhập vào hệ thống để xem và ký xác nhận hợp đồng.</p>`
      } else {
        // Người thuê đã ký, thông báo cho chủ nhà
        recipientId = contract.landlordId
        recipientName = contract.landlord?.name || ''
        signerName = contract.tenant?.name || ''
        notificationContent = `Người thuê ${signerName} đã ký hợp đồng thuê phòng của bạn. Vui lòng kiểm tra và xác nhận.`
        emailRecipient = contract.landlord?.email || ''
        emailSubject = 'Người thuê đã ký hợp đồng thuê phòng'
        emailContent = `<p>Xin chào ${recipientName},</p>
          <p>Người thuê ${signerName} đã ký hợp đồng thuê phòng của bạn.</p>
          <p>Vui lòng đăng nhập vào hệ thống để xem và xác nhận hợp đồng.</p>`
      }

      // Gửi thông báo trong hệ thống
      if (recipientId) {
        await this.notificationService.create({
          userId: recipientId,
          type: NotificationTypeEnum.INTERACTION,
          title:
            signerType === 'landlord'
              ? 'Chủ nhà đã ký hợp đồng'
              : 'Người thuê đã ký hợp đồng',
          message: notificationContent,
          relatedId: contract.id,
          relatedType: 'rental_contract',
        })
      }

      // Gửi email thông báo
      if (emailRecipient) {
        await this.emailService.send({
          to: emailRecipient,
          subject: emailSubject,
          html: emailContent,
        })
      }

      // Thông báo khi hợp đồng đã được ký hoàn tất bởi cả hai bên
      if (contract.status === ContractStatus.ACTIVE) {
        // Gửi thông báo cho cả chủ nhà và người thuê
        const completionMessage = `Hợp đồng thuê phòng đã được ký hoàn tất bởi cả hai bên và có hiệu lực từ ngày ${contract.startDate.toLocaleDateString(
          'vi-VN'
        )}.`

        // Thông báo cho chủ nhà
        await this.notificationService.create({
          userId: contract.landlordId,
          type: NotificationTypeEnum.INTERACTION,
          title: 'Hợp đồng đã hoàn tất',
          message: completionMessage,
          relatedId: contract.id,
          relatedType: 'rental_contract',
        })

        // Thông báo cho người thuê
        await this.notificationService.create({
          userId: contract.tenantId,
          type: NotificationTypeEnum.INTERACTION,
          title: 'Hợp đồng đã hoàn tất',
          message: completionMessage,
          relatedId: contract.id,
          relatedType: 'rental_contract',
        })

        // Gửi email xác nhận hoàn tất cho cả hai bên
        const emailCompletionContent = `<p>Xin chào,</p>
          <p>Hợp đồng thuê phòng đã được ký hoàn tất bởi cả hai bên và có hiệu lực từ ngày ${contract.startDate.toLocaleDateString(
            'vi-VN'
          )}.</p>
          <p>Hợp đồng sẽ kết thúc vào ngày ${contract.endDate.toLocaleDateString(
            'vi-VN'
          )}.</p>
          <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết hợp đồng.</p>`

        if (contract.landlord?.email) {
          await this.emailService.send({
            to: contract.landlord.email,
            subject: 'Hợp đồng thuê phòng đã hoàn tất',
            html: emailCompletionContent,
          })
        }

        if (contract.tenant?.email) {
          await this.emailService.send({
            to: contract.tenant.email,
            subject: 'Hợp đồng thuê phòng đã hoàn tất',
            html: emailCompletionContent,
          })
        }
      }
    } catch (error) {
      // Log lỗi nhưng không ảnh hưởng đến luồng chính
      this.logger.error(
        `Error sending contract signature notifications: ${error.message}`
      )
    }
  }

  // Chấm dứt hợp đồng
  async terminateContract(
    id: number,
    userId: number,
    role: string,
    reason: string
  ): Promise<ContractDetailType> {
    try {
      // Kiểm tra quyền truy cập
      const hasAccess = await this.rentalContractRepo.checkContractAccess(
        id,
        userId
      )
      if (!role.includes('Admin') && !hasAccess) {
        throw new ForbiddenException('Bạn không có quyền chấm dứt hợp đồng này')
      }

      // Kiểm tra hợp đồng phải đang ACTIVE hoặc RENEWED
      const contract = await this.rentalContractRepo.findContractById(id)
      if (!contract) {
        throw ContractNotFoundException
      }

      if (
        contract.status !== ContractStatus.ACTIVE &&
        contract.status !== ContractStatus.RENEWED
      ) {
        throw new BadRequestException(
          'Chỉ có thể chấm dứt hợp đồng đang hoạt động hoặc đã gia hạn'
        )
      }

      // Cập nhật trạng thái hợp đồng - chỉ truyền các trường có trong schema
      const terminatedContract =
        await this.rentalContractRepo.updateContractStatus(
          id,
          ContractStatus.TERMINATED,
          { terminatedAt: new Date() }
        )

      // Thêm comment về lý do chấm dứt hợp đồng vì trường terminationReason không tồn tại trong schema
      if (reason) {
        try {
          // Có thể tạo một bảng comments hoặc metadata để lưu thông tin này
          this.logger.log(`Contract ${id} terminated with reason: ${reason}`)
          // TODO: Lưu lý do vào bảng comments hoặc metadata nếu cần
        } catch (error) {
          this.logger.warn(
            `Could not save termination reason: ${error.message}`
          )
        }
      }

      // Cập nhật trạng thái phòng thành trống (isAvailable = true)
      try {
        await this.prismaService.room.update({
          where: { id: contract.roomId },
          data: { isAvailable: true },
        })
      } catch (error) {
        this.logger.error(`Error updating room status: ${error.message}`)
        // Không throw error ở đây để vẫn hoàn tất quá trình chấm dứt hợp đồng
      }

      // Gửi thông báo đến các bên
      await this.notificationService.notifyContractTerminated(
        contract.landlordId,
        contract.contractNumber,
        id
      )

      await this.notificationService.notifyContractTerminated(
        contract.tenantId,
        contract.contractNumber,
        id
      )

      return terminatedContract
    } catch (error) {
      this.logger.error(`Error terminating contract: ${error.message}`)
      throw error
    }
  }

  // Đánh dấu hợp đồng hết hạn
  async expireContract(id: number): Promise<ContractDetailType> {
    try {
      const contract = await this.rentalContractRepo.findContractById(id)
      if (!contract) {
        throw ContractNotFoundException
      }

      // Chỉ có thể đánh dấu hết hạn cho hợp đồng đang hoạt động
      if (contract.status !== ContractStatus.ACTIVE) {
        throw new BadRequestException(
          'Chỉ có thể đánh dấu hết hạn cho hợp đồng đang hoạt động'
        )
      }

      // Cập nhật trạng thái hợp đồng
      const expiredContract =
        await this.rentalContractRepo.updateContractStatus(
          id,
          ContractStatus.EXPIRED
        )

      // Cập nhật trạng thái phòng thành trống (isAvailable = true)
      try {
        await this.prismaService.room.update({
          where: { id: contract.roomId },
          data: { isAvailable: true },
        })
      } catch (error) {
        this.logger.error(`Error updating room status: ${error.message}`)
        // Không throw error ở đây để vẫn hoàn tất quá trình đánh dấu hết hạn
      }

      // Gửi thông báo đến các bên
      await this.notificationService.notifyContractExpired(
        contract.landlordId,
        contract.contractNumber,
        id
      )

      await this.notificationService.notifyContractExpired(
        contract.tenantId,
        contract.contractNumber,
        id
      )

      return expiredContract
    } catch (error) {
      this.logger.error(`Error expiring contract: ${error.message}`)
      throw error
    }
  }

  // Gia hạn hợp đồng
  async renewContract(
    id: number,
    userId: number,
    role: string,
    endDate: string
  ): Promise<ContractDetailType> {
    try {
      // Kiểm tra quyền truy cập (chỉ chủ nhà mới có quyền gia hạn)
      const isLandlord = await this.rentalContractRepo.isLandlordOfContract(
        id,
        userId
      )
      if (!role.includes('Admin') && !isLandlord) {
        throw new ForbiddenException(
          'Chỉ chủ nhà mới có quyền gia hạn hợp đồng'
        )
      }

      // Gia hạn hợp đồng
      const renewedContract = await this.rentalContractRepo.renewContract(
        id,
        new Date(endDate)
      )

      // Gửi thông báo đến các bên
      await this.notificationService.notifyContractRenewed(
        renewedContract.landlordId,
        renewedContract.contractNumber,
        new Date(endDate),
        id
      )

      await this.notificationService.notifyContractRenewed(
        renewedContract.tenantId,
        renewedContract.contractNumber,
        new Date(endDate),
        id
      )

      return renewedContract
    } catch (error) {
      this.logger.error(`Error renewing contract: ${error.message}`)
      throw error
    }
  }

  // Hàm kiểm tra và cập nhật các hợp đồng hết hạn (dùng cho cron job)
  async checkAndUpdateExpiredContracts(): Promise<void> {
    try {
      const now = new Date()

      // Tìm các hợp đồng đã hết hạn nhưng vẫn đang ACTIVE
      const expiredContracts =
        await this.rentalContractRepo.findExpiredContracts(now)

      this.logger.log(
        `Found ${expiredContracts.length} expired contracts to update`
      )

      for (const contract of expiredContracts) {
        try {
          await this.expireContract(contract.id)
          this.logger.log(`Successfully expired contract #${contract.id}`)
        } catch (error) {
          this.logger.error(
            `Error expiring contract #${contract.id}: ${error.message}`
          )
          // Tiếp tục với hợp đồng tiếp theo
        }
      }
    } catch (error) {
      this.logger.error(`Error checking expired contracts: ${error.message}`)
      throw error
    }
  }
}
