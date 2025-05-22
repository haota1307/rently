/**
 * Các hằng số liên quan đến phương thức sinh số hợp đồng
 */
export const CONTRACT_NUMBER_PREFIX = 'RENT'

/**
 * Các đường dẫn upload cho rental-contract
 */
export const UPLOAD_PATHS = {
  TEMPLATES: 'contract-templates',
  ATTACHMENTS: 'contract-attachments',
  FINAL_DOCUMENTS: 'contract-finals',
  SIGNATURES: 'contract-signatures',
}

/**
 * Các thông báo thành công
 */
export const SUCCESS_MESSAGES = {
  TEMPLATE_DELETED: 'Xóa mẫu hợp đồng thành công',
  CONTRACT_CREATED: 'Tạo hợp đồng thành công',
  CONTRACT_SIGNED: 'Ký hợp đồng thành công',
  ATTACHMENT_ADDED: 'Thêm tệp đính kèm thành công',
  FINAL_DOCUMENT_UPDATED: 'Cập nhật tài liệu hợp đồng cuối cùng thành công',
}

/**
 * Thời gian hết hạn mặc định cho hợp đồng (tính bằng tháng)
 */
export const DEFAULT_CONTRACT_DURATION_MONTHS = 12
