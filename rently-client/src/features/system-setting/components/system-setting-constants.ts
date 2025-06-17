export const SYSTEM_SETTING_GROUPS = {
  INTERFACE: "interface",
  EMAIL: "email",
  PRICING: "pricing",
} as const;

export const SYSTEM_SETTING_TYPES = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  JSON: "json",
  FILE: "file",
} as const;

export const SYSTEM_SETTING_GROUP_LABELS = {
  [SYSTEM_SETTING_GROUPS.INTERFACE]: "Giao diện",
  [SYSTEM_SETTING_GROUPS.EMAIL]: "Mẫu Email",
  [SYSTEM_SETTING_GROUPS.PRICING]: "Giá dịch vụ",
};

export const SYSTEM_SETTING_TYPE_LABELS = {
  [SYSTEM_SETTING_TYPES.STRING]: "Chuỗi",
  [SYSTEM_SETTING_TYPES.NUMBER]: "Số",
  [SYSTEM_SETTING_TYPES.BOOLEAN]: "Boolean",
  [SYSTEM_SETTING_TYPES.JSON]: "JSON",
  [SYSTEM_SETTING_TYPES.FILE]: "Tệp tin",
};

export const SYSTEM_SETTING_GROUP_COLORS = {
  [SYSTEM_SETTING_GROUPS.INTERFACE]: "bg-blue-100 text-blue-800",
  [SYSTEM_SETTING_GROUPS.EMAIL]: "bg-green-100 text-green-800",
  [SYSTEM_SETTING_GROUPS.PRICING]: "bg-amber-100 text-amber-800",
  default: "bg-gray-100 text-gray-800",
};
