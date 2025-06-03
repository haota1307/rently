import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import { RentalContractService } from './rental-contract.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { FileInterceptor } from '@nestjs/platform-express'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  AddContractAttachmentDTO,
  ContractDetailDTO,
  ContractTemplateDTO,
  ContractsListDTO,
  ContractTemplatesListDTO,
  CreateContractDTO,
  CreateContractTemplateDTO,
  GetContractParamsDTO,
  GetContractsQueryDTO,
  GetContractTemplateParamsDTO,
  GetContractTemplatesQueryDTO,
  SignContractDTO,
} from './rental-contract.dto'
import { UploadService } from '../upload/cloudinary.service'
import { UPLOAD_PATHS, SUCCESS_MESSAGES } from './rental-contract.constant'
import { Response } from 'express'

@Controller('rental-contracts')
export class RentalContractController {
  constructor(
    private readonly rentalContractService: RentalContractService,
    private readonly uploadService: UploadService
  ) {}

  // ===== Quản lý mẫu hợp đồng =====

  /**
   * Upload mẫu hợp đồng mới
   */
  @Post('templates')
  @UseInterceptors(FileInterceptor('file'))
  @ZodSerializerDto(ContractTemplateDTO)
  async createTemplate(
    @Body() body: CreateContractTemplateDTO,
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser('userId') userId: number
  ) {
    // Upload file lên cloudinary
    const uploadResult = await this.uploadService.uploadMessageFile(
      file,
      UPLOAD_PATHS.TEMPLATES
    )

    // Tạo mẫu hợp đồng với thông tin file đã upload
    const fileInfo = {
      fileUrl: uploadResult.secure_url,
      fileName: file.originalname,
      fileType: file.mimetype,
    }

    return this.rentalContractService.createTemplate(body, userId, fileInfo)
  }

  /**
   * Lấy danh sách mẫu hợp đồng của người dùng
   */
  @Get('templates')
  @ZodSerializerDto(ContractTemplatesListDTO)
  async getTemplates(
    @Query() query: GetContractTemplatesQueryDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.rentalContractService.getTemplates(query, userId)
  }

  /**
   * Lấy chi tiết mẫu hợp đồng theo ID
   */
  @Get('templates/:id')
  @ZodSerializerDto(ContractTemplateDTO)
  async getTemplateById(
    @Param() params: GetContractTemplateParamsDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.rentalContractService.getTemplateById(params.id, userId)
  }

  /**
   * Xóa mẫu hợp đồng
   */
  @Delete('templates/:id')
  async deleteTemplate(
    @Param() params: GetContractTemplateParamsDTO,
    @ActiveUser('userId') userId: number
  ) {
    await this.rentalContractService.deleteTemplate(params.id, userId)
    return { message: SUCCESS_MESSAGES.TEMPLATE_DELETED }
  }

  // ===== Quản lý hợp đồng =====

  /**
   * Tạo hợp đồng mới
   */
  @Post()
  @ZodSerializerDto(ContractDetailDTO)
  async createContract(
    @Body() body: CreateContractDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.rentalContractService.createContract(body, userId)
  }

  /**
   * Lấy danh sách hợp đồng
   */
  @Get()
  @ZodSerializerDto(ContractsListDTO)
  async getContracts(
    @Query() query: GetContractsQueryDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    return this.rentalContractService.getContracts(query, userId, roleName)
  }

  /**
   * Lấy chi tiết hợp đồng theo ID
   */
  @Get(':id')
  @ZodSerializerDto(ContractDetailDTO)
  async getContractById(
    @Param() params: GetContractParamsDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    return this.rentalContractService.getContractById(
      params.id,
      userId,
      roleName
    )
  }

  /**
   * Ký hợp đồng
   */
  @Post(':id/sign')
  @ZodSerializerDto(ContractDetailDTO)
  async signContract(
    @Param() params: GetContractParamsDTO,
    @Body() body: SignContractDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    return this.rentalContractService.signContract(
      params.id,
      body,
      userId,
      roleName
    )
  }

  /**
   * Thêm tệp đính kèm vào hợp đồng
   */
  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ZodSerializerDto(ContractDetailDTO)
  async addAttachment(
    @Param() params: GetContractParamsDTO,
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    // Upload file lên cloudinary
    const uploadResult = await this.uploadService.uploadMessageFile(
      file,
      UPLOAD_PATHS.ATTACHMENTS
    )

    // Tạo đối tượng attachment từ thông tin file đã upload
    const attachmentData = {
      fileUrl: uploadResult.secure_url,
      fileName: file.originalname,
      fileType: file.mimetype,
    }

    return this.rentalContractService.addAttachment(
      params.id,
      attachmentData,
      userId,
      roleName
    )
  }

  /**
   * Cập nhật URL tài liệu hợp đồng cuối cùng
   */
  @Put(':id/final-document')
  @UseInterceptors(FileInterceptor('file'))
  @ZodSerializerDto(ContractDetailDTO)
  async updateFinalDocument(
    @Param() params: GetContractParamsDTO,
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser('userId') userId: number
  ) {
    // Upload file lên cloudinary
    const uploadResult = await this.uploadService.uploadMessageFile(
      file,
      UPLOAD_PATHS.FINAL_DOCUMENTS
    )

    return this.rentalContractService.updateFinalDocument(
      params.id,
      uploadResult.secure_url,
      userId
    )
  }

  /**
   * Xuất hợp đồng dạng PDF
   */
  @Get(':id/export-pdf')
  @Header('Content-Type', 'application/pdf')
  async exportContractPDF(
    @Param() params: GetContractParamsDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string,
    @Res() res: Response
  ) {
    try {
      const pdfBuffer = await this.rentalContractService.generateContractPDF(
        params.id,
        userId,
        roleName
      )

      const contractNumber = await this.rentalContractService.getContractNumber(
        params.id
      )

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="hop-dong-${contractNumber}.pdf"`
      )

      return res.send(pdfBuffer)
    } catch (error) {
      console.error('Error exporting contract PDF:', error)
      res.status(500).send('Không thể xuất hợp đồng')
    }
  }

  // Chấm dứt hợp đồng
  @Patch(':id/terminate')
  @ZodSerializerDto(ContractDetailDTO)
  async terminateContract(
    @Param() params: GetContractParamsDTO,
    @Body() data: { reason: string },
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    const contract = await this.rentalContractService.terminateContract(
      params.id,
      userId,
      roleName,
      data.reason
    )
    return contract
  }

  // Đánh dấu hợp đồng hết hạn (chỉ cho chủ nhà và Admin)
  @Patch(':id/expire')
  @ZodSerializerDto(ContractDetailDTO)
  async expireContract(
    @Param() params: GetContractParamsDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    return this.rentalContractService.expireContract(params.id)
  }

  // Gia hạn hợp đồng (chỉ cho chủ nhà và Admin)
  @Patch(':id/renew')
  @ZodSerializerDto(ContractDetailDTO)
  async renewContract(
    @Param() params: GetContractParamsDTO,
    @Body() data: { endDate: string },
    @ActiveUser('userId') userId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    return this.rentalContractService.renewContract(
      params.id,
      userId,
      roleName,
      data.endDate
    )
  }
}
