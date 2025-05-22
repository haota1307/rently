export enum ContractStatus {
  DRAFT = "DRAFT",
  AWAITING_LANDLORD_SIGNATURE = "AWAITING_LANDLORD_SIGNATURE",
  AWAITING_TENANT_SIGNATURE = "AWAITING_TENANT_SIGNATURE",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  TERMINATED = "TERMINATED",
  RENEWED = "RENEWED",
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: "Bản nháp",
  [ContractStatus.AWAITING_LANDLORD_SIGNATURE]: "Chờ chủ nhà ký",
  [ContractStatus.AWAITING_TENANT_SIGNATURE]: "Chờ người thuê ký",
  [ContractStatus.ACTIVE]: "Đang hiệu lực",
  [ContractStatus.EXPIRED]: "Hết hạn",
  [ContractStatus.TERMINATED]: "Đã chấm dứt",
  [ContractStatus.RENEWED]: "Đã gia hạn",
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: "gray",
  [ContractStatus.AWAITING_LANDLORD_SIGNATURE]: "amber",
  [ContractStatus.AWAITING_TENANT_SIGNATURE]: "amber",
  [ContractStatus.ACTIVE]: "green",
  [ContractStatus.EXPIRED]: "red",
  [ContractStatus.TERMINATED]: "red",
  [ContractStatus.RENEWED]: "blue",
};
