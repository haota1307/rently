import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common'

export const ContractTemplateNotFoundException = new NotFoundException(
  'Không tìm thấy mẫu hợp đồng'
)

export const ContractNotFoundException = new NotFoundException(
  'Không tìm thấy hợp đồng'
)

export const RentalRequestNotFoundException = new NotFoundException(
  'Không tìm thấy yêu cầu thuê phòng'
)

export const UnauthorizedContractAccessException = new ForbiddenException(
  'Bạn không có quyền truy cập hợp đồng này'
)

export const UnauthorizedContractSigningException = new ForbiddenException(
  'Bạn không có quyền ký hợp đồng này'
)

export const UnauthorizedTemplateAccessException = new ForbiddenException(
  'Bạn không có quyền truy cập mẫu hợp đồng này'
)

export const ContractUpdateForbiddenException = new ForbiddenException(
  'Chỉ chủ nhà mới có quyền cập nhật hợp đồng'
)

export const InvalidContractStatusForSigningException = new BadRequestException(
  'Hợp đồng không ở trạng thái có thể ký'
)

export const AwaitingLandlordSignatureException = new BadRequestException(
  'Đang chờ chủ nhà ký, bạn không thể ký lúc này'
)

export const AwaitingTenantSignatureException = new BadRequestException(
  'Đang chờ người thuê ký, bạn không thể ký lúc này'
)

export const InvalidContractDataException = new UnprocessableEntityException(
  'Dữ liệu hợp đồng không hợp lệ'
)
