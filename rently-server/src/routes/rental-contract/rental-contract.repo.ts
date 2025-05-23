import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
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
} from './rental-contract.model'
import { Prisma } from '@prisma/client'

@Injectable()
export class RentalContractRepo {
  private readonly logger = new Logger(RentalContractRepo.name)

  constructor(private prismaService: PrismaService) {}

  // Hàm chuyển đổi từ database object sang contract template DTO
  private mapContractTemplateToDto(data: any): ContractTemplateType {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileType: data.fileType,
      isDefault: data.isDefault,
      createdAt: data.createdAt,
      landlordId: data.landlordId,
    }
  }

  // Hàm chuyển đổi từ database object sang contract detail DTO
  private mapContractToDto(data: any): ContractDetailType {
    return {
      id: data.id,
      contractNumber: data.contractNumber,
      rentalRequestId: data.rentalRequestId,
      roomId: data.roomId,
      landlordId: data.landlordId,
      tenantId: data.tenantId,
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyRent: Number(data.monthlyRent),
      deposit: Number(data.deposit),
      paymentDueDate: data.paymentDueDate,
      contractContent: data.contractContent,
      terms: data.terms,
      landlordSignedAt: data.landlordSignedAt,
      tenantSignedAt: data.tenantSignedAt,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      finalDocumentUrl: data.finalDocumentUrl,

      landlord: {
        id: data.landlord?.id || 0,
        name: data.landlord?.name || '',
        email: data.landlord?.email || '',
        phoneNumber: data.landlord?.phoneNumber || null,
      },
      tenant: {
        id: data.tenant?.id || 0,
        name: data.tenant?.name || '',
        email: data.tenant?.email || '',
        phoneNumber: data.tenant?.phoneNumber || null,
      },
      room: {
        id: data.room?.id || 0,
        title: data.room?.title || '',
        price: Number(data.room?.price || 0),
        area: data.room?.area || 0,
      },
      rentalRequest: {
        id: data.rentalRequest?.id || 0,
        postId: data.rentalRequest?.postId || 0,
        status: data.rentalRequest?.status || '',
      },
      attachments: data.ContractAttachment
        ? data.ContractAttachment.map(attachment => ({
            id: attachment.id,
            fileUrl: attachment.fileUrl,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            uploadedBy: attachment.uploadedBy,
            createdAt: attachment.createdAt,
          }))
        : [],
      template: data.template
        ? {
            id: data.template.id,
            name: data.template.name,
            fileUrl: data.template.fileUrl,
          }
        : null,
    }
  }

  // Tạo mẫu hợp đồng
  async createTemplate(
    data: CreateContractTemplateType,
    userId: number,
    fileInfo: { fileUrl: string; fileName: string; fileType: string }
  ): Promise<ContractTemplateType> {
    try {
      const contractTemplate = await this.prismaService.contractTemplate.create(
        {
          data: {
            name: data.name,
            description: data.description,
            isDefault: data.isDefault,
            landlordId: userId,
            fileUrl: fileInfo.fileUrl,
            fileName: fileInfo.fileName,
            fileType: fileInfo.fileType,
            updatedAt: new Date(),
          },
        }
      )

      return this.mapContractTemplateToDto(contractTemplate)
    } catch (error) {
      this.logger.error(
        `Error creating contract template: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException('Không thể tạo mẫu hợp đồng')
    }
  }

  // Lấy danh sách mẫu hợp đồng
  async getTemplates(
    query: GetContractTemplatesQueryType,
    userId: number
  ): Promise<ContractTemplatesListType> {
    try {
      const { page, limit, search } = query
      const skip = (page - 1) * limit

      const where: Prisma.ContractTemplateWhereInput = {
        landlordId: userId,
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [totalItems, templates] = await Promise.all([
        this.prismaService.contractTemplate.count({ where }),
        this.prismaService.contractTemplate.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ])

      return {
        data: templates.map(template =>
          this.mapContractTemplateToDto(template)
        ),
        totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
      }
    } catch (error) {
      this.logger.error(
        `Error getting contract templates: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(
        'Không thể lấy danh sách mẫu hợp đồng'
      )
    }
  }

  // Tìm mẫu hợp đồng theo ID
  async findTemplateById(id: number): Promise<ContractTemplateType | null> {
    try {
      const template = await this.prismaService.contractTemplate.findUnique({
        where: { id },
      })

      return template ? this.mapContractTemplateToDto(template) : null
    } catch (error) {
      this.logger.error(
        `Error finding template by ID: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException('Không thể tìm mẫu hợp đồng')
    }
  }

  // Xóa mẫu hợp đồng
  async deleteTemplate(id: number): Promise<void> {
    try {
      await this.prismaService.contractTemplate.delete({
        where: { id },
      })
    } catch (error) {
      this.logger.error(
        `Error deleting template: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException('Không thể xóa mẫu hợp đồng')
    }
  }

  // Tạo hợp đồng mới
  async createContract(
    data: CreateContractType,
    contractContent: string
  ): Promise<ContractDetailType> {
    try {
      // Lấy thông tin của yêu cầu thuê
      const rentalRequest = await this.prismaService.rentalRequest.findUnique({
        where: { id: data.rentalRequestId },
        include: {
          post: {
            include: {
              room: true,
            },
          },
        },
      })

      if (!rentalRequest) {
        throw new Error('Yêu cầu thuê không tồn tại')
      }

      // Tạo số hợp đồng duy nhất
      const contractNumber = `RENT-${Date.now()}-${rentalRequest.tenantId}`

      // Tạo hợp đồng mới
      const contract = await this.prismaService.rentalContract.create({
        data: {
          contractNumber,
          rentalRequestId: data.rentalRequestId,
          roomId: rentalRequest.post.roomId,
          landlordId: rentalRequest.landlordId,
          tenantId: rentalRequest.tenantId,
          startDate: data.startDate,
          endDate: data.endDate,
          monthlyRent: new Prisma.Decimal(data.monthlyRent),
          deposit: new Prisma.Decimal(data.deposit),
          paymentDueDate: data.paymentDueDate,
          contractContent,
          terms: data.terms,
          templateId: data.templateId,
          status: ContractStatus.AWAITING_LANDLORD_SIGNATURE,
          updatedAt: new Date(),
        },
      })

      // Lấy thêm thông tin về người dùng và các mối quan hệ cần thiết
      const landlord = await this.prismaService.user.findUnique({
        where: { id: contract.landlordId },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
        },
      })

      const tenant = await this.prismaService.user.findUnique({
        where: { id: contract.tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
        },
      })

      const room = await this.prismaService.room.findUnique({
        where: { id: contract.roomId },
        select: {
          id: true,
          title: true,
          price: true,
          area: true,
        },
      })

      const fullContract = {
        ...contract,
        landlord,
        tenant,
        room,
        rentalRequest,
        template: data.templateId
          ? await this.prismaService.contractTemplate.findUnique({
              where: { id: data.templateId },
              select: {
                id: true,
                name: true,
                fileUrl: true,
              },
            })
          : null,
        ContractAttachment: [],
      }

      return this.mapContractToDto(fullContract)
    } catch (error) {
      this.logger.error(
        `Error creating contract: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException('Không thể tạo hợp đồng')
    }
  }

  // Tìm hợp đồng theo ID
  async findContractById(id: number): Promise<ContractDetailType | null> {
    try {
      const contract = await this.prismaService.rentalContract.findUnique({
        where: { id },
      })

      if (!contract) return null

      // Lấy các thông tin liên quan
      const [landlord, tenant, room, rentalRequest, attachments, template] =
        await Promise.all([
          this.prismaService.user.findUnique({
            where: { id: contract.landlordId },
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          }),
          this.prismaService.user.findUnique({
            where: { id: contract.tenantId },
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          }),
          this.prismaService.room.findUnique({
            where: { id: contract.roomId },
            select: {
              id: true,
              title: true,
              price: true,
              area: true,
            },
          }),
          this.prismaService.rentalRequest.findUnique({
            where: { id: contract.rentalRequestId },
            select: {
              id: true,
              postId: true,
              status: true,
            },
          }),
          this.prismaService.contractAttachment.findMany({
            where: { contractId: id },
          }),
          contract.templateId
            ? this.prismaService.contractTemplate.findUnique({
                where: { id: contract.templateId },
                select: {
                  id: true,
                  name: true,
                  fileUrl: true,
                },
              })
            : null,
        ])

      const fullContract = {
        ...contract,
        landlord,
        tenant,
        room,
        rentalRequest,
        ContractAttachment: attachments,
        template,
      }

      return this.mapContractToDto(fullContract)
    } catch (error) {
      this.logger.error(
        `Error finding contract by ID: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException('Không thể tìm hợp đồng')
    }
  }

  // Lấy danh sách hợp đồng
  async getContracts(
    query: GetContractsQueryType,
    userId: number,
    role: string
  ): Promise<ContractsListType> {
    try {
      const { page, limit, status, search } = query
      const skip = (page - 1) * limit

      // Xây dựng điều kiện where dựa trên role và query params
      let where: Prisma.RentalContractWhereInput = {}

      // Nếu không phải admin, chỉ lấy hợp đồng liên quan đến user
      if (role !== 'Admin') {
        where.OR = [{ landlordId: userId }, { tenantId: userId }]
      }

      if (status) {
        where.status = status
      }

      if (search) {
        where = {
          ...where,
          OR: [{ contractNumber: { contains: search, mode: 'insensitive' } }],
        }
      }

      const [totalItems, contracts] = await Promise.all([
        this.prismaService.rentalContract.count({ where }),
        this.prismaService.rentalContract.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ])

      // Lấy dữ liệu liên quan cho từng hợp đồng
      const contractsWithDetails = await Promise.all(
        contracts.map(async contract => {
          return this.findContractById(contract.id)
        })
      )

      const validContracts = contractsWithDetails.filter(
        (contract): contract is ContractDetailType => contract !== null
      )

      return {
        data: validContracts,
        totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
      }
    } catch (error) {
      this.logger.error(
        `Error getting contracts: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException('Không thể lấy danh sách hợp đồng')
    }
  }

  // Cập nhật trạng thái hợp đồng và thông tin chữ ký
  async updateContractSignature(
    id: number,
    userId: number,
    userType: 'landlord' | 'tenant',
    signatureUrl: string,
    info?: {
      identityCard?: string
      identityCardIssuedDate?: string
      identityCardIssuedPlace?: string
      address?: string
    }
  ): Promise<ContractDetailType> {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      }

      // Cập nhật thông tin chữ ký dựa trên loại người dùng
      if (userType === 'landlord') {
        updateData.landlordSignedAt = new Date()
        updateData.status = ContractStatus.AWAITING_TENANT_SIGNATURE
      } else {
        updateData.tenantSignedAt = new Date()
        updateData.status = ContractStatus.AWAITING_LANDLORD_SIGNATURE

        // Nếu cả chủ nhà và người thuê đều đã ký, chuyển trạng thái thành ACTIVE
        const contract = await this.prismaService.rentalContract.findUnique({
          where: { id },
          select: { landlordSignedAt: true },
        })

        if (contract && contract.landlordSignedAt) {
          updateData.status = ContractStatus.ACTIVE
        }
      }

      // Cập nhật hợp đồng
      await this.prismaService.rentalContract.update({
        where: { id },
        data: updateData,
      })

      // Thêm chữ ký vào bảng ContractSignature
      await this.prismaService.contractSignature.create({
        data: {
          contractId: id,
          userId,
          signatureUrl,
          identityCard: info?.identityCard,
          identityCardIssuedDate: info?.identityCardIssuedDate,
          identityCardIssuedPlace: info?.identityCardIssuedPlace,
          address: info?.address,
        },
      })

      // Lấy hợp đồng đã cập nhật - đảm bảo không null với type assertion
      const updatedContract = await this.findContractById(id)
      if (!updatedContract) {
        throw new InternalServerErrorException(
          'Không thể tìm thấy hợp đồng sau khi cập nhật'
        )
      }

      // Sử dụng type assertion để TypeScript hiểu rằng updatedContract không phải là null
      return updatedContract as ContractDetailType
    } catch (error) {
      this.logger.error(
        `Error updating contract signature: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(
        'Không thể cập nhật chữ ký hợp đồng'
      )
    }
  }

  // Cập nhật URL tài liệu hợp đồng cuối cùng
  async updateFinalDocument(
    id: number,
    finalDocumentUrl: string
  ): Promise<ContractDetailType> {
    try {
      await this.prismaService.rentalContract.update({
        where: { id },
        data: {
          finalDocumentUrl,
          updatedAt: new Date(),
        },
      })

      const updatedContract = await this.findContractById(id)
      if (!updatedContract) {
        throw new InternalServerErrorException(
          'Không thể tìm thấy hợp đồng sau khi cập nhật'
        )
      }

      return updatedContract as ContractDetailType
    } catch (error) {
      this.logger.error(
        `Error updating final document: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(
        'Không thể cập nhật tài liệu hợp đồng cuối cùng'
      )
    }
  }

  // Thêm tệp đính kèm vào hợp đồng
  async addContractAttachment(
    contractId: number,
    data: AddContractAttachmentType,
    uploadedBy: number
  ): Promise<ContractDetailType> {
    try {
      await this.prismaService.contractAttachment.create({
        data: {
          contractId,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileType: data.fileType,
          uploadedBy,
        },
      })

      const updatedContract = await this.findContractById(contractId)
      if (!updatedContract) {
        throw new InternalServerErrorException(
          'Không thể tìm thấy hợp đồng sau khi thêm tệp đính kèm'
        )
      }

      return updatedContract as ContractDetailType
    } catch (error) {
      this.logger.error(
        `Error adding contract attachment: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(
        'Không thể thêm tệp đính kèm vào hợp đồng'
      )
    }
  }

  // Kiểm tra quyền truy cập vào hợp đồng
  async checkContractAccess(
    contractId: number,
    userId: number
  ): Promise<boolean> {
    try {
      const contract = await this.prismaService.rentalContract.findUnique({
        where: { id: contractId },
        select: { landlordId: true, tenantId: true },
      })

      return (
        contract !== null &&
        (contract.landlordId === userId || contract.tenantId === userId)
      )
    } catch (error) {
      this.logger.error(
        `Error checking contract access: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(
        'Không thể kiểm tra quyền truy cập'
      )
    }
  }

  // Kiểm tra xem người dùng có phải là chủ nhà trong hợp đồng không
  async isLandlordOfContract(
    contractId: number,
    userId: number
  ): Promise<boolean> {
    try {
      const contract = await this.prismaService.rentalContract.findUnique({
        where: { id: contractId },
        select: { landlordId: true },
      })

      return contract !== null && contract.landlordId === userId
    } catch (error) {
      this.logger.error(
        `Error checking if user is landlord: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(
        'Không thể kiểm tra vai trò của người dùng'
      )
    }
  }

  // Kiểm tra xem người dùng có phải là người thuê trong hợp đồng không
  async isTenantOfContract(
    contractId: number,
    userId: number
  ): Promise<boolean> {
    try {
      const contract = await this.prismaService.rentalContract.findUnique({
        where: { id: contractId },
        select: { tenantId: true },
      })

      return contract !== null && contract.tenantId === userId
    } catch (error) {
      this.logger.error(
        `Error checking if user is tenant: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(
        'Không thể kiểm tra vai trò của người dùng'
      )
    }
  }

  // Kiểm tra xem mẫu có thuộc về người dùng không
  async isTemplateOwner(templateId: number, userId: number): Promise<boolean> {
    try {
      const template = await this.prismaService.contractTemplate.findUnique({
        where: { id: templateId },
        select: { landlordId: true },
      })

      return template !== null && template.landlordId === userId
    } catch (error) {
      this.logger.error(
        `Error checking template ownership: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(
        'Không thể kiểm tra quyền sở hữu mẫu hợp đồng'
      )
    }
  }

  // Lấy thông tin chi tiết của người dùng theo ID
  async getUserInfo(userId: number) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
        },
      })

      if (!user) {
        throw new NotFoundException(
          `Không tìm thấy người dùng với ID ${userId}`
        )
      }

      return user
    } catch (error) {
      this.logger.error(`Error getting user info: ${error.message}`)
      throw error
    }
  }

  async getContractSignatures(contractId: number): Promise<{
    landlordSignature?: {
      signatureUrl?: string
      identityCard?: string
      identityCardIssuedDate?: string
      identityCardIssuedPlace?: string
      address?: string
    }
    tenantSignature?: {
      signatureUrl?: string
      identityCard?: string
      identityCardIssuedDate?: string
      identityCardIssuedPlace?: string
      address?: string
    }
  }> {
    try {
      const contract = await this.prismaService.rentalContract.findUnique({
        where: { id: contractId },
        select: { landlordId: true, tenantId: true },
      })
      if (!contract) return {}
      const signatures = await this.prismaService.contractSignature.findMany({
        where: { contractId },
      })
      const landlordSignature = signatures.find(
        sig => sig.userId === contract.landlordId
      )
      const tenantSignature = signatures.find(
        sig => sig.userId === contract.tenantId
      )
      return {
        landlordSignature: landlordSignature
          ? {
              signatureUrl: landlordSignature.signatureUrl,
              identityCard: landlordSignature.identityCard ?? undefined,
              identityCardIssuedDate:
                landlordSignature.identityCardIssuedDate ?? undefined,
              identityCardIssuedPlace:
                landlordSignature.identityCardIssuedPlace ?? undefined,
              address: landlordSignature.address ?? undefined,
            }
          : undefined,
        tenantSignature: tenantSignature
          ? {
              signatureUrl: tenantSignature.signatureUrl,
              identityCard: tenantSignature.identityCard ?? undefined,
              identityCardIssuedDate:
                tenantSignature.identityCardIssuedDate ?? undefined,
              identityCardIssuedPlace:
                tenantSignature.identityCardIssuedPlace ?? undefined,
              address: tenantSignature.address ?? undefined,
            }
          : undefined,
      }
    } catch (error) {
      this.logger.error(`Error getting contract signatures: ${error.message}`)
      return {}
    }
  }
}
