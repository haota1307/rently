export const TokenType = {
  ForgotPasswordToken: "ForgotPasswordToken",
  AccessToken: "AccessToken",
  RefreshToken: "RefreshToken",
} as const;

export const Role = {
  Admin: "Admin",
  Landlord: "Landlord",
  Tenant: "Tenant",
} as const;

export const RoleValues = [Role.Admin, Role.Landlord, Role.Tenant] as const;
